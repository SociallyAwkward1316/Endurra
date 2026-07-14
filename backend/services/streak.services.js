import supabase from "../supabase/supabase.js"

const DEFAULT_STREAK = {
    current_workout_streak:0,
    best_workout_streak:0,
    current_calorie_streak:0,
    best_calorie_streak:0,
    last_workout_date:null,
    last_calorie_date:null
}

const isDateKey = (date) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) {
        return false
    }

    const timestamp = Date.parse(`${date}T00:00:00Z`)

    return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === date
}

const dayDifference = (laterDate, earlierDate) => {
    const later = Date.parse(`${laterDate}T00:00:00Z`)
    const earlier = Date.parse(`${earlierDate}T00:00:00Z`)

    return Math.round((later - earlier) / 86400000)
}

const addDays = (date, amount) => {
    const timestamp = Date.parse(`${date}T00:00:00Z`) + (amount * 86400000)

    return new Date(timestamp).toISOString().slice(0, 10)
}

const createStreakRow = async (userId) => {
    return supabase
        .from("UserStreaks")
        .insert({user_id:userId, ...DEFAULT_STREAK})
        .select()
        .single()
}

export const getOrCreateUserStreak = async (userId) => {
    const existing = await supabase
        .from("UserStreaks")
        .select()
        .eq("user_id", userId)
        .maybeSingle()

    if (existing.error) {
        return existing
    }

    if (existing.data) {
        return existing
    }

    return createStreakRow(userId)
}

export const updateUserStreak = async (userId, type, activityDate) => {
    if (!isDateKey(activityDate) || !["workout", "calorie"].includes(type)) {
        return {data:null, error:new Error("Invalid streak activity")}
    }

    const streak = await getOrCreateUserStreak(userId)

    if (streak.error) {
        return streak
    }

    const currentField = `current_${type}_streak`
    const bestField = `best_${type}_streak`
    const lastDateField = `last_${type}_date`
    const lastDate = streak.data[lastDateField]

    const currentStreak = Number(streak.data[currentField]) || 0

    if (lastDate && activityDate === lastDate) {
        return streak
    }

    if (lastDate && activityDate < lastDate) {
        const firstDateInStreak = addDays(lastDate, -(Math.max(currentStreak, 1) - 1))

        if (dayDifference(firstDateInStreak, activityDate) !== 1) {
            return streak
        }

        const extendedCurrent = currentStreak + 1
        const extendedBest = Math.max(Number(streak.data[bestField]) || 0, extendedCurrent)

        return supabase
            .from("UserStreaks")
            .update({
                [currentField]:extendedCurrent,
                [bestField]:extendedBest
            })
            .eq("id", streak.data.id)
            .select()
            .single()
    }

    const nextCurrent = lastDate && dayDifference(activityDate, lastDate) === 1
        ? currentStreak + 1
        : 1
    const nextBest = Math.max(Number(streak.data[bestField]) || 0, nextCurrent)

    return supabase
        .from("UserStreaks")
        .update({
            [currentField]:nextCurrent,
            [bestField]:nextBest,
            [lastDateField]:activityDate
        })
        .eq("id", streak.data.id)
        .select()
        .single()
}

export const getEffectiveUserStreak = async (userId, currentDate) => {
    if (!isDateKey(currentDate)) {
        return {data:null, error:new Error("Invalid current date")}
    }

    const streak = await getOrCreateUserStreak(userId)

    if (streak.error) {
        return streak
    }

    const data = {...streak.data}

    if (data.last_workout_date && dayDifference(currentDate, data.last_workout_date) > 1) {
        data.current_workout_streak = 0
    }

    if (data.last_calorie_date && dayDifference(currentDate, data.last_calorie_date) > 1) {
        data.current_calorie_streak = 0
    }

    return {data, error:null}
}
