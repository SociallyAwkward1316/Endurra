import { analyzeFoodImage, saveFoodImageAnalysis } from "../services/foodImage.services.js"

const activeUsers = new Set()

const getErrorResponse = (error) => {
    if (error.code === "insufficient_quota") {
        return {
            status:503,
            message:"AI meal analysis has reached its current usage limit. Please try again later."
        }
    }

    if (error.status === 429) {
        return {
            status:429,
            message:"AI meal analysis is receiving too many requests. Please wait and try again."
        }
    }

    if (error.status === 401 || error.code === "invalid_api_key") {
        return {
            status:503,
            message:"AI meal analysis is temporarily unavailable."
        }
    }

    if (Number(error.status) >= 400 && Number(error.status) < 500) {
        return {
            status:Number(error.status),
            message:error.message || "Could not analyze that meal photo."
        }
    }

    return {
        status:503,
        message:error.message || "AI meal analysis is temporarily unavailable."
    }
}

export const createFoodImageAnalysis = async (req, res) => {
    const userId = req.user.userId

    if (!req.file?.buffer) {
        return res.status(400).json({message:"Choose a meal photo to analyze"})
    }

    if (activeUsers.has(userId)) {
        return res.status(429).json({message:"A meal photo is already being analyzed"})
    }

    activeUsers.add(userId)

    try {
        const result = await analyzeFoodImage({
            imageBuffer:req.file.buffer,
            userNote:req.body.note
        })
        const savedAnalysis = await saveFoodImageAnalysis({
            userId,
            userNote:req.body.note,
            analysis:result.analysis,
            metadata:result.metadata
        })

        if (savedAnalysis.error || !savedAnalysis.data?.id) {
            console.error("Could not save meal photo analysis", {
                code:savedAnalysis.error?.code || null,
                message:savedAnalysis.error?.message || "Analysis row was not returned"
            })

            return res.status(503).json({
                code:"FOOD_IMAGE_SAVE_FAILED",
                message:"Your meal was analyzed but the estimate could not be saved. Please try again."
            })
        }

        const analysis = result.analysis

        res.set("Cache-Control", "no-store")

        return res.status(200).json({
            analysisId:savedAnalysis.data.id,
            analysis,
            food:{
                analysis_id:savedAnalysis.data.id,
                name:analysis.mealName,
                brand_name:"Endurra AI estimate",
                serving_size:1,
                serving_unit:"meal",
                calories:analysis.totals.calories,
                protein:analysis.totals.protein,
                carbs:analysis.totals.carbs,
                fats:analysis.totals.fats,
                source:"ai_image"
            }
        })
    } catch (error) {
        console.error("Could not analyze meal photo", {
            status:error.status || null,
            code:error.code || null,
            reason:error.reason || null,
            message:error.message || "Unknown image analysis error"
        })
        const response = getErrorResponse(error)

        return res.status(response.status).json({
            code:error.code || "FOOD_IMAGE_ANALYSIS_FAILED",
            message:response.message
        })
    } finally {
        activeUsers.delete(userId)

        if (req.file) {
            req.file.buffer = Buffer.alloc(0)
        }
    }
}
