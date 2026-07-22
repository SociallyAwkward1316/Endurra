import { getUserById } from "../services/auth.services.js"

const proOnly = async (req, res, next) => {
    if (!req.user?.userId || req.user.is_pro !== true) {
        return res.status(403).json({message:"An Endurra Pro membership is required"})
    }

    const user = await getUserById(req.user.userId)

    if (user.error || !user.data) {
        return res.status(401).json({message:"User session not found"})
    }

    if (!user.data.is_pro) {
        return res.status(403).json({message:"An Endurra Pro membership is required"})
    }

    req.user.is_pro = true
    next()
}

export default proOnly
