import { deleteFoodEntry, deleteSavedFood, getFood, getLog, getLogById, getNutritionProfile, getSavedFood, getSavedFoods, postFoodEntry, postFoodtoDb, postNutritionProfile, postSavedFood, postUserDailyLog } from "../services/caltracker.services.js"
import { findFatSecretFoodByBarcode, searchFatSecretFoods } from "../utils/fatsecret.utils.js"
import { updateUserStreak } from "../services/streak.services.js"


export const createNutritionProfile = async (req, res) => {
    if (req.body.height === undefined || req.body.weight === undefined || req.body.gender === undefined || req.body.goal === undefined || req.body.goalAdjustment === undefined || req.body.activityLevel === undefined || req.body.age === undefined) {
        return res.status(400).json({message:"Missing information"})
    }

    const userId = req.user.userId
    const height = req.body.height
    const weight = req.body.weight
    const gender = req.body.gender
    const age = req.body.age
    const goal_selection = req.body.goal
    const goal_selection2 = req.body.goalAdjustment
    const activity_level = req.body.activityLevel

    const activityMultipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extremely_active: 1.9
    }

    const weightKg = weight * 0.453592
    const heightCm = height * 2.54
    let bmr

    if (gender === "male") {
        bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5)
    } else if (gender === "female") {
        bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161)
    }
    const maintenanceCalories =
    bmr * activityMultipliers[activity_level]

    const protein = Math.round(weight * 1)
    const fats = Math.round(weight * 0.35)

    let targetCalories = maintenanceCalories

    if (goal_selection === "bulk") {
        targetCalories += Number(goal_selection2)
    }

    if (goal_selection === "cut") {
        targetCalories -= Number(goal_selection2)
    }

    const nutritionProfile = {
    user_id:userId,
    height:height,
    weight:weight,
    gender:gender,
    age:age,
    goal_selection:goal_selection,
    goal_selection2:goal_selection2,
    activity_level:activity_level,
    calories:Math.round(targetCalories),
    protein: protein,
    fats: fats,
    carbs: Math.round((targetCalories - (protein * 4) - (fats * 9)) / 4)

    }

    const profile = await postNutritionProfile(nutritionProfile)

    res.status(200).json({nutritionProfile: profile.data})

}

export const grabNutritionProfile = async (req,res) => {
    const userId = req.user.userId
    if (userId === undefined) {
        return res.status(404).json({message:"No UserId Found"})
    }

    const nutritionProfile = await getNutritionProfile(userId)

    if (nutritionProfile.data.length === 0) {
        return res.status(204).json({message:"No Nutrition Profile"})
    }

    return res.status(200).json({ nutritionProfile: nutritionProfile.data})
}

export const fetchLog = async (req, res) => {
    const userId = req.user.userId
    const date = req.params.date
    const log = await getLog(userId, date)

    if (log.data === 0) {
        return res.status(404).json({message:"No Log Found"})
    }

    return res.status(200).json({log:log.data[0]})
    
}

export const createLog = async (req, res) => {
    const userId = req.user.userId
    const date = req.body.logDate

    const checkIfLogExists = await getLog(userId, date)

    if (checkIfLogExists.data.length !== 0) {
        return res.status(409).json({message:"Log Already Exists"})
    }
    const creation = await postUserDailyLog(userId, date)
    const log = await getLog(userId, date)

    return res.status(200).json({log:log.data[0]})
}

const normalizeFoodText = (value = "") => {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
}

const scoreFoodResult = (food, search) => {
    const name = normalizeFoodText(food.name)
    const brand = normalizeFoodText(food.brand_name || "")
    const searchableText = normalizeFoodText(`${brand} ${name}`)
    const searchTerm = normalizeFoodText(search)
    const searchWords = searchTerm.split(" ").filter(Boolean)
    const hasAllWords = searchWords.every(word => searchableText.includes(word))

    if (!searchTerm || !hasAllWords) {
        return -100
    }

    let score = 0

    if (name === searchTerm) score += 120
    if (searchableText === searchTerm) score += 120
    if (name.startsWith(searchTerm)) score += 70
    if (searchableText.startsWith(searchTerm)) score += 70
    if (brand && searchWords.some(word => brand.includes(word))) score += 45
    if (name.includes(`${searchTerm} raw`)) score += 70
    if (name.includes(`${searchTerm}s raw`)) score += 70
    if (name.includes(`${searchTerm} fruit`)) score += 45
    if (name.includes("raw")) score += 35
    if (name.includes("fresh")) score += 25
    if (food.serving_unit === "g" && Number(food.serving_size) === 100) score += 12
    if (!food.brand_name) score += 10

    const noisyTerms = [
        "chips",
        "muffin",
        "bread",
        "cake",
        "cereal",
        "bar",
        "snack",
        "candy",
        "pie",
        "juice",
        "smoothie",
        "yogurt",
        "flavored",
        "baby food",
        "dried",
        "dehydrated",
        "freeze dried"
    ]

    noisyTerms.forEach(term => {
        if (name.includes(term)) {
            score -= 35
        }
    })

    if (food.brand_name) score -= 12

    const extraWords = Math.max(name.split(" ").length - searchWords.length, 0)
    score -= Math.min(extraWords * 3, 30)

    return score
}

const dedupeAndRankFoods = (foods, search, limit = 25) => {
    const seen = new Set()

    return foods
        .map(food => ({
            ...food,
            score: scoreFoodResult(food, search)
        }))
        .filter(food => food.score > -100)
        .sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score
            }

            return a.name.length - b.name.length
        })
        .filter(food => {
            const key = normalizeFoodText(`${food.brand_name || ""} ${food.name}`)

            if (seen.has(key)) {
                return false
            }

            seen.add(key)
            return true
        })
        .slice(0, limit)
        .map(({ score, ...food }) => food)
}

const combineFoodsPreferSaved = (savedFoods, incomingFoods) => {
    const savedKeys = new Set(
        savedFoods.map(food => normalizeFoodText(`${food.brand_name || ""} ${food.name}`))
    )

    return [
        ...savedFoods,
        ...incomingFoods.filter(food => !savedKeys.has(normalizeFoodText(`${food.brand_name || ""} ${food.name}`)))
    ]
}

const getFatSecretSearchQueries = (search) => {
    const normalizedSearch = normalizeFoodText(search)
    const words = normalizedSearch.split(" ").filter(Boolean)
    const queries = [normalizedSearch]

    for (let index = 1; index < words.length - 1; index += 1) {
        queries.push(words.slice(index).join(" "))
    }

    if (words.length > 2) {
        queries.push(words.slice(-2).join(" "))
    }

    return Array.from(new Set(queries.filter(query => query.length > 0)))
}

const prepareFoodForDb = (food) => {
    return {
        fdc_id: food.fdc_id,
        name: food.name,
        brand_name: food.brand_name || null,
        serving_size: food.serving_size,
        serving_unit: food.serving_unit,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fats: food.fats
    }
}

const resolveFoodId = async (foodId, food) => {
    if (foodId) {
        return {foodId, error:null}
    }

    if (!food?.name) {
        return {foodId:null, error:new Error("Missing food")}
    }

    const savedFood = await postFoodtoDb([prepareFoodForDb(food)])

    return {
        foodId:savedFood.data?.[0]?.id || null,
        error:savedFood.error || null
    }
}

export const searchForFood = async (req, res) => {
    const foodSearch = req.query.food

    if (!foodSearch || !foodSearch.trim()) {
        return res.status(200).json({foods:[]})
    }

    const apiFood = await getFood(foodSearch)
    const localFoods = apiFood.data ?? []

    let fatSecretFoods = []

    try {
        const searchQueries = getFatSecretSearchQueries(foodSearch)
        const searchResults = await Promise.all(
            searchQueries.map(query => searchFatSecretFoods(query))
        )

        fatSecretFoods = searchResults.flat()
    } catch (error) {
        console.error("FatSecret search failed", error.message)

        return res.status(200).json({
            foods:dedupeAndRankFoods(localFoods, foodSearch)
        })
    }

    const rankedFatSecretFoods = dedupeAndRankFoods(fatSecretFoods, foodSearch)
    const foodsAdded = rankedFatSecretFoods.length > 0
        ? await postFoodtoDb(rankedFatSecretFoods)
        : {data:[]}

    if (foodsAdded.error) {
        console.error("Could not save FatSecret foods", foodsAdded.error)
    }
    
    return res.status(200).json({
        foods:dedupeAndRankFoods(
            combineFoodsPreferSaved(
                localFoods,
                foodsAdded.data ?? []
            ),
            foodSearch
        )
    })

}

export const searchFoodByBarcode = async (req, res) => {
    const barcode = String(req.query.barcode || "").replace(/\D/g, "")

    if (barcode.length < 8 || barcode.length > 13) {
        return res.status(400).json({message:"Scan a valid UPC or EAN barcode"})
    }

    try {
        const food = await findFatSecretFoodByBarcode(barcode)

        if (!food) {
            return res.status(404).json({message:"No food was found for that barcode"})
        }

        const savedFood = await postFoodtoDb([food])

        if (savedFood.error) {
            console.error("Could not save barcode food", savedFood.error)
        }

        return res.status(200).json({food:savedFood.data?.[0] || food})
    } catch (error) {
        console.error("Barcode lookup failed", error.message)

        return res.status(502).json({message:"Barcode lookup is currently unavailable"})
    }
}

export const addFoodToLog = async (req, res) => {
    const logId = req.body.logId
    let foodId = req.body.foodId
    const food = req.body.food
    const servings = Number(req.body.servings || 1)
    const dailyLog = await getLogById(req.user.userId, logId)

    if (dailyLog.error || !dailyLog.data) {
        return res.status(404).json({message:"Food log not found"})
    }

    if (!foodId && food?.name) {
        const savedFood = await postFoodtoDb([prepareFoodForDb(food)])

        if (savedFood.error) {
            console.error("Could not save selected food", savedFood.error)
        }

        if (!savedFood.data?.[0]?.id) {
            console.error("Could not resolve food before adding entry", {
                error: savedFood.error,
                food
            })
            return res.status(500).json({message:"Could not save selected food"})
        }

        foodId = savedFood.data[0].id
    }

    if (!logId || !foodId || !Number.isFinite(servings) || servings <= 0) {
        console.error("Invalid add food payload", {
            logId,
            foodId,
            servings,
            hasFood: Boolean(food)
        })
        return res.status(400).json({message:"Missing or invalid food entry"})
    }

    const foodEntry = await postFoodEntry(logId, foodId, servings)

    if (foodEntry.error) {
        console.error("Could not add food entry", foodEntry.error)
        return res.status(500).json({message:"Could not add food to log"})
    }

    const streak = await updateUserStreak(req.user.userId, "calorie", dailyLog.data.log_date)

    if (streak.error) {
        console.error("Could not update calorie streak", streak.error.message)
    }

    return res.status(200).json({
        message:"Food Added",
        foodEntry:foodEntry.data,
        streak:streak.data || null
    })

}

export const fetchSavedFoods = async (req, res) => {
    const savedFoods = await getSavedFoods(req.user.userId)

    if (savedFoods.error) {
        return res.status(500).json({message:"Could not load saved foods"})
    }

    const foods = (savedFoods.data || [])
        .map(savedFood => savedFood.Food)
        .filter(Boolean)

    return res.status(200).json({foods})
}

export const saveFood = async (req, res) => {
    const userId = req.user.userId
    const resolved = await resolveFoodId(req.body.foodId, req.body.food)

    if (resolved.error || !resolved.foodId) {
        return res.status(400).json({message:"Could not resolve food to save"})
    }

    const existing = await getSavedFood(userId, resolved.foodId)

    if (existing.error) {
        return res.status(500).json({message:"Could not check saved food"})
    }

    if (existing.data) {
        return res.status(200).json({food:req.body.food, alreadySaved:true})
    }

    const savedFood = await postSavedFood(userId, resolved.foodId)

    if (savedFood.error) {
        return res.status(500).json({message:"Could not save food"})
    }

    return res.status(201).json({food:savedFood.data?.Food || req.body.food})
}

export const removeSavedFood = async (req, res) => {
    const foodId = Number(req.params.foodId)

    if (!Number.isFinite(foodId)) {
        return res.status(400).json({message:"Invalid food"})
    }

    const deleted = await deleteSavedFood(req.user.userId, foodId)

    if (deleted.error) {
        return res.status(500).json({message:"Could not remove saved food"})
    }

    return res.status(200).json({message:"Saved food removed"})
}

export const removeFoodFromLog = async (req, res) => {
    const entryId = req.params.entryId

    if (!entryId) {
        return res.status(400).json({message:"Missing food entry"})
    }

    const deletedEntry = await deleteFoodEntry(entryId)

    if (deletedEntry.error) {
        return res.status(500).json({message:"Could not delete food entry"})
    }

    return res.status(200).json({message:"Food Entry Deleted"})
}
