import { COACH_ANALYSIS_TYPES, generateCoachAnalysis } from "../services/coach.services.js"

const activeRequests = new Set()

export const createCoachAnalysis = async (req, res) => {
    const userId = req.user.userId
    const analysisType = req.body.analysisType

    if (!COACH_ANALYSIS_TYPES.includes(analysisType)) {
        return res.status(400).json({message:"Choose a valid coach analysis"})
    }

    if (activeRequests.has(userId)) {
        return res.status(429).json({message:"Your coach is already preparing an analysis"})
    }

    activeRequests.add(userId)

    try {
        const result = await generateCoachAnalysis({
            userId,
            analysisType,
            localDate:req.body.localDate,
            timezone:req.body.timezone,
            utcOffsetMinutes:req.body.utcOffsetMinutes
        })

        res.set("Cache-Control", "no-store")
        return res.status(200).json(result)
    } catch (error) {
        console.error("Could not generate coach analysis", error)

        const status = error.status === 503 ? 503 : 500
        const message = status === 503
            ? error.message
            : "Your coach could not complete that analysis. Please try again."

        return res.status(status).json({message})
    } finally {
        activeRequests.delete(userId)
    }
}
