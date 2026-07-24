import { getUserById } from "../services/auth.services.js"
import supabase from "../supabase/supabase.js"

export const FREE_TRACKING_LIMIT = 15

const limitConfig = {
    workouts:{
        table:"Workouts",
        code:"FREE_WORKOUT_LIMIT_REACHED",
        message:"Your free plan includes 15 workouts. Upgrade to Endurra Pro for unlimited workout tracking."
    },
    calorieDays:{
        table:"DayFoodLogs",
        code:"FREE_CALORIE_LIMIT_REACHED",
        message:"Your free plan includes 15 calorie-tracking days. Upgrade to Endurra Pro for unlimited nutrition tracking."
    }
}

const enforceFreeTrackingLimit = (limitType) => async (req, res, next) => {
    const userId = req.user?.userId

    if (!userId) {
        return res.status(401).json({message:"User session not found"})
    }

    const user = await getUserById(userId)

    if (user.error || !user.data) {
        return res.status(401).json({message:"User session not found"})
    }

    if (user.data.is_pro) {
        return next()
    }

    const config = limitConfig[limitType]
    const usage = await supabase
        .from(config.table)
        .select("id", {count:"exact", head:true})
        .eq("user_id", userId)

    if (usage.error) {
        return res.status(500).json({message:"Could not verify free-plan usage"})
    }

    const used = usage.count || 0

    if (used >= FREE_TRACKING_LIMIT) {
        return res.status(403).json({
            code:config.code,
            message:config.message,
            limit:FREE_TRACKING_LIMIT,
            used
        })
    }

    return next()
}

export const enforceWorkoutLimit = enforceFreeTrackingLimit("workouts")
export const enforceCalorieDayLimit = enforceFreeTrackingLimit("calorieDays")
