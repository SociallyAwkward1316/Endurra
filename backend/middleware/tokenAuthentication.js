import jwt from "jsonwebtoken"
import "dotenv/config"

const tokenAuthentication = (req, res, next) => {
    const token = req.cookies.accessToken
    if (token) {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({message:"Token Invalid", error:err.message})
        } else {
            req.user = decoded
            next()
        }
    })
    } else {
        return res.status(401).json({message:"No token found"})
    }



}

export default tokenAuthentication