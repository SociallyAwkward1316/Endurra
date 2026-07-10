import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import "dotenv/config"
import { checkIfEmailInUse, grabUserFromSupabase, registerUserToSupabase } from "../services/auth.services.js"

export const signupController = async (req, res) => {

    const data = req.body

    const emailInUseCheck =  await checkIfEmailInUse(data.email)

    if (emailInUseCheck === true) {
        return res.status(409).json({message: "Email already in use"})
    }

    const hashedPassword = await bcrypt.hash(data.password, 10)

    const userData = {
        username: data.username,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        password: hashedPassword
    }


    const user = await registerUserToSupabase(userData)

    return res.status(201).json(user.data)
}


export const loginController = async (req, res) => {
    const email = req.body.email
    const password = req.body.password

    const user = await grabUserFromSupabase(email)
    if (user === undefined) {
        return res.status(404).json({message: "Email not in use"})
    } 
    const authenticationCheck = await bcrypt.compare(password, user.password)

    if (authenticationCheck === true) {
        const accessToken = jwt.sign({userId:user.id, email:user.email}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "60m"})
        const refreshToken = jwt.sign({userId:user.id, email:user.email}, process.env.REFRESH_TOKEN_SECRET, {expiresIn: "30D"})

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            maxAge: 60 * 60 * 1000
        })

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            maxAge: 30 * 24 * 60 * 60 * 1000
        })

        res.status(200).json({message:"Login Success", tokens:{access:accessToken, refresh:refreshToken}})
    } else {
        res.status(403).json({message: "Password Invalid"})
    }
}


export const refreshController = async (req, res) => {
    const refreshToken = req.cookies.refreshToken
    if (refreshToken) {

        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({message:"Refresh token invalid"})
            } else {
                const data = {userId:decoded.userId, email:decoded.email}
                const newAccessToken = jwt.sign(data, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "60m"})
                res.cookie("accessToken", newAccessToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: "lax",
                    maxAge: 60 * 60 * 1000
                })

                res.status(200).json({message:"Token refreshed"})
            }
        })
    } else {
        return res.status(401).json({message:"Refresh token not found"})
    }
}
