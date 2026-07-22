import express from "express"
import { createCoachAnalysis } from "../controllers/coach.controller.js"

const router = express.Router()

router.post("/analyze", createCoachAnalysis)

export default router
