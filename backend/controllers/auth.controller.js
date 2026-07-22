import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import "dotenv/config"
import { checkIfEmailInUse, getUserById, grabUserFromSupabase, registerUserToSupabase, updateUserPassword } from "../services/auth.services.js"
import { sendPasswordResetEmail } from "../services/email.services.js"

const accessCookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 1000
}

const clearCookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "lax"
}

const getTokenData = (user) => ({
    userId:user.id,
    email:user.email,
    is_pro:Boolean(user.is_pro)
})

const setAccessTokenCookie = (res, user) => {
    const token = jwt.sign(getTokenData(user), process.env.ACCESS_TOKEN_SECRET, {expiresIn:"60m"})
    res.cookie("accessToken", token, accessCookieOptions)

    return token
}

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
        password: hashedPassword,
        is_pro: false
    }


    const user = await registerUserToSupabase(userData)

    if (user.error) {
        return res.status(500).json({message:"Could not create account"})
    }

    return res.status(201).json({message:"Account created"})
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
        const accessToken = jwt.sign(getTokenData(user), process.env.ACCESS_TOKEN_SECRET, {expiresIn: "60m"})
        const refreshToken = jwt.sign(getTokenData(user), process.env.REFRESH_TOKEN_SECRET, {expiresIn: "30D"})

        res.cookie("accessToken", accessToken, accessCookieOptions)

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            maxAge: 30 * 24 * 60 * 60 * 1000
        })

        res.status(200).json({message:"Login Success", authenticated:true, isPro:Boolean(user.is_pro)})
    } else {
        res.status(403).json({message: "Password Invalid"})
    }
}


export const refreshController = async (req, res) => {
    const refreshToken = req.cookies.refreshToken
    if (!refreshToken) {
        return res.status(401).json({message:"Refresh token not found"})
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await getUserById(decoded.userId)

        if (user.error || !user.data) {
            return res.status(401).json({message:"User session not found"})
        }

        setAccessTokenCookie(res, user.data)

        return res.status(200).json({message:"Token refreshed", isPro:Boolean(user.data.is_pro)})
    } catch {
        return res.status(401).json({message:"Refresh token invalid"})
    }
}

export const sessionController = async (req, res) => {
    const accessToken = req.cookies.accessToken
    const refreshToken = req.cookies.refreshToken

    if (accessToken) {
        try {
            const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)
            const user = await getUserById(decoded.userId)

            if (user.error || !user.data) {
                throw new Error("User session not found")
            }

            if (Boolean(decoded.is_pro) !== Boolean(user.data.is_pro) || decoded.email !== user.data.email) {
                setAccessTokenCookie(res, user.data)
            }

            res.set("Cache-Control", "no-store")

            return res.status(200).json({authenticated:true, isPro:Boolean(user.data.is_pro)})
        } catch {
            // A valid refresh token below can restore the session.
        }
    }

    if (!refreshToken) {
        return res.status(401).json({authenticated:false})
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await getUserById(decoded.userId)

        if (user.error || !user.data) {
            throw new Error("User session not found")
        }

        setAccessTokenCookie(res, user.data)
        res.set("Cache-Control", "no-store")

        return res.status(200).json({authenticated:true, isPro:Boolean(user.data.is_pro)})
    } catch {
        res.clearCookie("accessToken", clearCookieOptions)
        res.clearCookie("refreshToken", clearCookieOptions)

        return res.status(401).json({authenticated:false})
    }
}

export const logoutController = (req, res) => {
    res.clearCookie("accessToken", clearCookieOptions)
    res.clearCookie("refreshToken", clearCookieOptions)
    res.set("Cache-Control", "no-store")

    return res.status(200).json({message:"Logout successful"})
}

const passwordResetResponse = {
    message:"If an account exists for that email, a password reset link is on its way."
}

const passwordMeetsRequirements = (password) =>
    password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password)

export const forgotPasswordController = async (req, res) => {
    const email = String(req.body.email || "").trim()

    if (!email) {
        return res.status(200).json(passwordResetResponse)
    }

    try {
        const user = await grabUserFromSupabase(email)

        if (user) {
            const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET
            const frontendUrl = process.env.FRONTEND_URL

            if (!accessTokenSecret || !frontendUrl) {
                throw new Error("ACCESS_TOKEN_SECRET and FRONTEND_URL must be configured")
            }

            const token = jwt.sign(
                {
                    userId:user.id,
                    email:user.email,
                    purpose:"password-reset"
                },
                accessTokenSecret,
                {expiresIn:"15m"}
            )
            const resetUrl = new URL("/reset-password", frontendUrl)
            resetUrl.searchParams.set("token", token)

            await sendPasswordResetEmail({
                to:user.email,
                firstName:user.first_name,
                resetUrl:resetUrl.toString()
            })
        }
    } catch (error) {
        console.error("Could not send password reset email", error)
    }

    return res.status(200).json(passwordResetResponse)
}

export const resetPasswordController = async (req, res) => {
    const token = String(req.body.token || "")
    const password = String(req.body.password || "")
    const confirmPassword = String(req.body.confirmPassword || "")
    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET

    if (!token || !accessTokenSecret) {
        return res.status(400).json({message:"This reset link is invalid or has expired."})
    }

    if (password !== confirmPassword) {
        return res.status(400).json({message:"Passwords do not match."})
    }

    if (!passwordMeetsRequirements(password)) {
        return res.status(400).json({message:"Use at least 8 characters with uppercase, lowercase, and a number."})
    }

    try {
        const decoded = jwt.verify(token, accessTokenSecret)

        if (decoded.purpose !== "password-reset" || !decoded.userId) {
            return res.status(400).json({message:"This reset link is invalid or has expired."})
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const updatedUser = await updateUserPassword(decoded.userId, hashedPassword)

        if (updatedUser.error) {
            console.error("Could not update password", updatedUser.error)

            return res.status(500).json({message:"Could not reset your password. Please try again."})
        }

        res.clearCookie("accessToken", clearCookieOptions)
        res.clearCookie("refreshToken", clearCookieOptions)

        return res.status(200).json({message:"Password reset successfully. You can now log in."})
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError || error instanceof jwt.JsonWebTokenError) {
            return res.status(400).json({message:"This reset link is invalid or has expired."})
        }

        console.error("Could not reset password", error)

        return res.status(500).json({message:"Could not reset your password. Please try again."})
    }
}
