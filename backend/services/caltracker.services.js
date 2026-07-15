import supabase from "../supabase/supabase.js"

export const postNutritionProfile = async (nutritionProfile) => {
    const postreq = await supabase.from("NutritionProfiles").insert(nutritionProfile).select()

    return postreq
}

export const getNutritionProfile = async (userId) => {
    const nutritionProfile = await supabase.from("NutritionProfiles").select().eq("user_id", userId)
    return nutritionProfile
}

export const updateNutritionProfileByUserId = async (userId, nutritionProfile) => {
    const updatedProfile = await supabase
        .from("NutritionProfiles")
        .update(nutritionProfile)
        .eq("user_id", userId)
        .select()

    return updatedProfile
}

export const getLog = async (userId, date) => {
    const log = await supabase.from("DayFoodLogs").select("*, FoodEntries(*, Food(*))").eq("user_id", userId).eq("log_date", date)
    return log
}

export const getLogById = async (userId, logId) => {
    return supabase
        .from("DayFoodLogs")
        .select("id, user_id, log_date")
        .eq("id", logId)
        .eq("user_id", userId)
        .maybeSingle()
}

export const postUserDailyLog = async (userId, date) => {
    const userLog = await supabase.from("DayFoodLogs").insert({user_id: userId, log_date: date}).select()
    return userLog
}

export const getFood = async (foodSearch) => {
    const foodList = await supabase
        .from("Food")
        .select()
        .ilike("name", `%${foodSearch}%`)
        .limit(50)

    return foodList
}

export const postFoodtoDb = async (foodsList) => {
    const uniqueFoods = Array.from(
        new Map(
            foodsList
                .filter(food => food?.name)
                .map(food => [
                    food.fdc_id !== null && food.fdc_id !== undefined
                        ? `fdc:${String(food.fdc_id)}`
                        : `name:${food.name.toLowerCase()}`,
                    food
                ])
        ).values()
    )

    if (uniqueFoods.length === 0) {
        return {data: [], error: null}
    }

    const foodIds = Array.from(new Set(uniqueFoods
        .map(food => food.fdc_id)
        .filter(foodId => foodId !== null && foodId !== undefined)))

    const existingFoods = foodIds.length > 0
        ? await supabase.from("Food").select().in("fdc_id", foodIds)
        : {data: [], error: null}

    if (existingFoods.error) {
        return existingFoods
    }

    const existingIds = new Set(
        (existingFoods.data ?? []).map(food => food.fdc_id)
    )

    const foodsToInsert = uniqueFoods.filter(food =>
        food.fdc_id === null ||
        food.fdc_id === undefined ||
        !existingIds.has(food.fdc_id)
    )

    if (foodsToInsert.length === 0) {
        return {data: existingFoods.data ?? [], error: null}
    }

    const insertedFoods = await supabase
        .from("Food")
        .upsert(foodsToInsert, {onConflict: "fdc_id", ignoreDuplicates: true})
        .select()

    if (insertedFoods.error && insertedFoods.error.code !== "23505") {
        return insertedFoods
    }

    const savedFoods = foodIds.length > 0
        ? await supabase.from("Food").select().in("fdc_id", foodIds)
        : insertedFoods

    return {
        data: savedFoods.data ?? [
            ...(existingFoods.data ?? []),
            ...(insertedFoods.data ?? [])
        ],
        error: savedFoods.error ?? null
    }
}

export const postFoodEntry = async (logId, foodId, servings) => {
    const food = await supabase
        .from("FoodEntries")
        .insert({log_id:logId, food_id:foodId, servings})
        .select("id, servings, Food(*)")
        .single()

    return food
}

export const deleteFoodEntry = async (entryId) => {
    const food = await supabase.from("FoodEntries").delete().eq("id", entryId).select()

    return food
}

export const getSavedFoods = async (userId) => {
    return supabase
        .from("SavedFoods")
        .select("food_id, Food(*)")
        .eq("user_id", userId)
        .order("food_id", {ascending:false})
}

export const getSavedFood = async (userId, foodId) => {
    return supabase
        .from("SavedFoods")
        .select("food_id")
        .eq("user_id", userId)
        .eq("food_id", foodId)
        .maybeSingle()
}

export const postSavedFood = async (userId, foodId) => {
    return supabase
        .from("SavedFoods")
        .insert({user_id:userId, food_id:foodId})
        .select("food_id, Food(*)")
        .single()
}

export const deleteSavedFood = async (userId, foodId) => {
    return supabase
        .from("SavedFoods")
        .delete()
        .eq("user_id", userId)
        .eq("food_id", foodId)
}
