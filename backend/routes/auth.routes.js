import express from "express"
import { loginController, refreshController, signupController } from "../controllers/auth.controller.js"

const router = express.Router()


router.post("/signup", signupController)

router.post("/login", loginController)

router.post("/refresh", refreshController)





export default router