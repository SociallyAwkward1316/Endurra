import { getEffectiveUserStreak } from "../services/streak.services.js"

export const getUserStreak = async (req, res) => {
    const currentDate = req.query.date
    const streak = await getEffectiveUserStreak(req.user.userId, currentDate)

    if (streak.error) {
        const status = streak.error.message === "Invalid current date" ? 400 : 500

        return res.status(status).json({message:streak.error.message})
    }

    return res.status(200).json({streak:streak.data})
}
