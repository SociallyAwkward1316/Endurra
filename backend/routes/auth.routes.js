import express from "express"
import { loginController, logoutController, refreshController, sessionController, signupController } from "../controllers/auth.controller.js"

const router = express.Router()


router.post("/signup", signupController)

router.post("/login", loginController)

router.post("/refresh", refreshController)

router.get("/session", sessionController)

router.post("/logout", logoutController)





export default router
