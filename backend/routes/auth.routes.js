import express from "express"
import { forgotPasswordController, loginController, logoutController, refreshController, resetPasswordController, sessionController, signupController } from "../controllers/auth.controller.js"

const router = express.Router()


router.post("/signup", signupController)

router.post("/login", loginController)

router.post("/refresh", refreshController)

router.get("/session", sessionController)

router.post("/logout", logoutController)

router.post("/forgot-password", forgotPasswordController)

router.post("/reset-password", resetPasswordController)





export default router
