import "dotenv/config"
const cachedTokens = new Map()

const FATSECRET_TOKEN_URL = "https://oauth.fatsecret.com/connect/token"
const FATSECRET_API_URL = "https://platform.fatsecret.com/rest/server.api"
const FATSECRET_BARCODE_API_URL = "https://platform.fatsecret.com/rest/food/barcode/find-by-id/v2"

const getFatSecretCredentials = () => {
    const clientId =
        process.env.FATSECRET_CLIENT_ID 

    const clientSecret =
        process.env.FATSECRET_CLIENT_SECRET 

    return {
        clientId,
        clientSecret
    }
}

const parseNumber = (value) => {
    const number = Number(value)

    return Number.isFinite(number) ? number : null
}

const normalizeServingUnit = (unit = "serving") => {
    const cleanedUnit = unit.trim().toLowerCase()

    if (["g", "gram", "grams"].includes(cleanedUnit)) return "g"
    if (["ml", "milliliter", "milliliters"].includes(cleanedUnit)) return "mL"
    if (["oz", "ounce", "ounces"].includes(cleanedUnit)) return "oz"

    return cleanedUnit || "serving"
}

const parseServing = (description = "") => {
    const servingText = description.match(/^Per\s+(.+?)\s+-/i)?.[1]?.trim()

    if (!servingText) {
        return {
            serving_size: 1,
            serving_unit: "serving"
        }
    }

    const compactMatch = servingText.match(/^([\d.]+)\s*([a-zA-Z]+)$/)

    if (compactMatch) {
        return {
            serving_size: parseNumber(compactMatch[1]) ?? 1,
            serving_unit: normalizeServingUnit(compactMatch[2])
        }
    }

    const spacedMatch = servingText.match(/^([\d.]+)\s+(.+)$/)

    if (spacedMatch) {
        return {
            serving_size: parseNumber(spacedMatch[1]) ?? 1,
            serving_unit: normalizeServingUnit(spacedMatch[2])
        }
    }

    return {
        serving_size: 1,
        serving_unit: normalizeServingUnit(servingText)
    }
}

const parseNutrients = (description = "") => {
    return {
        calories: parseNumber(description.match(/Calories:\s*([\d.]+)\s*kcal/i)?.[1]),
        fats: parseNumber(description.match(/Fat:\s*([\d.]+)\s*g/i)?.[1]),
        carbs: parseNumber(description.match(/Carbs:\s*([\d.]+)\s*g/i)?.[1]),
        protein: parseNumber(description.match(/Protein:\s*([\d.]+)\s*g/i)?.[1])
    }
}

const normalizeFatSecretFood = (food) => {
    const description = food.food_description || ""
    const serving = parseServing(description)
    const nutrients = parseNutrients(description)
    const fatSecretId = Number(food.food_id)

    return {
        // Keep FatSecret IDs stable while avoiding collisions with positive USDA FDC IDs.
        fdc_id: Number.isFinite(fatSecretId) ? -Math.abs(fatSecretId) : null,
        name: food.food_name,
        brand_name: food.brand_name || null,
        serving_size: serving.serving_size,
        serving_unit: serving.serving_unit,
        calories: nutrients.calories,
        protein: nutrients.protein,
        carbs: nutrients.carbs,
        fats: nutrients.fats
    }
}

const normalizeDetailedFatSecretFood = (food) => {
    const rawServings = food?.servings?.serving
    const servings = Array.isArray(rawServings)
        ? rawServings
        : rawServings
            ? [rawServings]
            : []
    const serving = servings.find(item => Number(item.is_default) === 1) || servings[0]
    const fatSecretId = Number(food?.food_id)

    if (!serving || !Number.isFinite(fatSecretId)) {
        return null
    }

    return {
        fdc_id: -Math.abs(fatSecretId),
        name: food.food_name,
        brand_name: food.brand_name || null,
        serving_size: parseNumber(serving.metric_serving_amount) ?? parseNumber(serving.number_of_units) ?? 1,
        serving_unit: normalizeServingUnit(serving.metric_serving_unit || serving.measurement_description || "serving"),
        calories: parseNumber(serving.calories),
        protein: parseNumber(serving.protein),
        carbs: parseNumber(serving.carbohydrate),
        fats: parseNumber(serving.fat)
    }
}

const getFatSecretAccessToken = async (scope = "basic") => {
    const now = Date.now()
    const cachedToken = cachedTokens.get(scope)

    if (cachedToken && cachedToken.expiresAt > now) {
        return cachedToken.value
    }

    const { clientId, clientSecret } = getFatSecretCredentials()

    if (!clientId || !clientSecret) {
        throw new Error("Missing FatSecret API credentials")
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
    const body = new URLSearchParams({
        grant_type: "client_credentials",
        scope
    })

    const response = await fetch(FATSECRET_TOKEN_URL,
        {
            method: "POST",
            headers: {
                "Authorization": `Basic ${credentials}`,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body
        }
    )

    const data = await response.json()

    if (!response.ok || !data.access_token) {
        console.error("FatSecret token request failed", data)
        throw new Error("Could not authenticate with FatSecret")
    }

    cachedTokens.set(scope, {
        value:data.access_token,
        expiresAt:now + ((Number(data.expires_in) || 86400) - 60) * 1000
    })

    return data.access_token
}

export const searchFatSecretFoods = async (searchExpression) => {
    const token = await getFatSecretAccessToken()
    const params = new URLSearchParams({
        method: "foods.search",
        search_expression: searchExpression,
        format: "json",
        max_results: "50"
    })

    const response = await fetch(`${FATSECRET_API_URL}?${params}`,
        {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        }
    )

    const data = await response.json()

    if (!response.ok || data.error) {
        console.error("FatSecret food search failed", data)
        throw new Error("Could not search FatSecret foods")
    }

    const rawFoods = data.foods?.food
        ? Array.isArray(data.foods.food)
            ? data.foods.food
            : [data.foods.food]
        : []

    return rawFoods
        .map(normalizeFatSecretFood)
        .filter(food =>
            food.fdc_id != null &&
            food.name &&
            food.serving_size != null &&
            food.serving_unit != null &&
            food.calories != null &&
            food.protein != null &&
            food.carbs != null &&
            food.fats != null
        )
}

export const findFatSecretFoodByBarcode = async (barcode) => {
    const digits = String(barcode).replace(/\D/g, "")

    if (digits.length < 8 || digits.length > 13) {
        throw new Error("Invalid barcode")
    }

    const gtin = digits.padStart(13, "0")
    const token = await getFatSecretAccessToken("premier barcode")
    const params = new URLSearchParams({
        barcode:gtin,
        format:"json",
        flag_default_serving:"true"
    })
    const response = await fetch(`${FATSECRET_BARCODE_API_URL}?${params}`, {
        method:"GET",
        headers:{
            "Authorization":`Bearer ${token}`,
            "Accept":"application/json"
        }
    })
    const data = await response.json()

    if (Number(data.error?.code) === 211) {
        return null
    }

    if (!response.ok || data.error) {
        console.error("FatSecret barcode lookup failed", data)
        throw new Error("Could not look up barcode")
    }

    return normalizeDetailedFatSecretFood(data.food || data)
}
