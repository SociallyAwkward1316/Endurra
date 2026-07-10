import express from "express"
import { addFoodToLog, createLog, createNutritionProfile, fetchLog, grabNutritionProfile, removeFoodFromLog, searchForFood } from "../controllers/caltracker.controller.js"

const router = express.Router()

router.post("/createNutritionProfile", createNutritionProfile)
router.get("/getNutritionProfile", grabNutritionProfile)
router.post("/createUserLog", createLog)
router.get("/getDailyLog/:date", fetchLog)

router.get("/foodsearch/search", searchForFood)

router.post("/addFoodToLog", addFoodToLog)
router.delete("/deleteFoodEntry/:entryId", removeFoodFromLog)



export default router
