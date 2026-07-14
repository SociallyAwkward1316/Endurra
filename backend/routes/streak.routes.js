import express from "express"
import { getUserStreak } from "../controllers/streak.controller.js"

const router = express.Router()

router.get("/", getUserStreak)

export default router
