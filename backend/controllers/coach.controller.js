import { COACH_ANALYSIS_TYPES, generateCoachAnalysis } from "../services/coach.services.js"

const activeRequests = new Set()

const getCoachErrorResponse = (error) => {
    if (error.code === "insufficient_quota") {
        return {
            status:503,
            body:{
                code:"AI_QUOTA_EXCEEDED",
                message:"AI Coach has reached its current usage limit. Please try again later."
            }
        }
    }

    if (error.status === 429) {
        return {
            status:429,
            body:{
                code:"AI_RATE_LIMITED",
                message:"AI Coach is receiving too many requests. Please wait a moment and try again."
            }
        }
    }

    if (error.status === 401 || error.code === "invalid_api_key") {
        return {
            status:503,
            body:{
                code:"AI_CONFIGURATION_ERROR",
                message:"AI Coach is temporarily unavailable."
            }
        }
    }

    if (error.status === 503) {
        return {
            status:503,
            body:{
                code:"AI_UNAVAILABLE",
                message:error.message || "AI Coach is temporarily unavailable."
            }
        }
    }

    if (Number(error.status) >= 400 && Number(error.status) < 500) {
        return {
            status:Number(error.status),
            body:{
                code:"AI_REQUEST_ERROR",
                message:error.message || "Could not prepare this coach analysis."
            }
        }
    }

    if (Number(error.status) >= 500) {
        return {
            status:503,
            body:{
                code:"AI_PROVIDER_ERROR",
                message:"AI Coach is temporarily unavailable. Please try again."
            }
        }
    }

    return {
        status:500,
        body:{
            code:"AI_ANALYSIS_FAILED",
            message:"Your coach could not complete that analysis. Please try again."
        }
    }
}

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
        console.error("Could not generate coach analysis", {
            status:error.status || null,
            code:error.code || null,
            type:error.type || null,
            message:error.message || "Unknown coach error"
        })
        const response = getCoachErrorResponse(error)

        return res.status(response.status).json(response.body)
    } finally {
        activeRequests.delete(userId)
    }
}
