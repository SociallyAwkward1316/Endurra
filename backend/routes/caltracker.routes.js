import express from "express"
import { addFoodToLog, createLog, createNutritionProfile, fetchLog, fetchSavedFoods, grabNutritionProfile, removeFoodFromLog, removeSavedFood, saveFood, searchFoodByBarcode, searchForFood } from "../controllers/caltracker.controller.js"

const router = express.Router()

router.post("/createNutritionProfile", createNutritionProfile)
router.get("/getNutritionProfile", grabNutritionProfile)
router.post("/createUserLog", createLog)
router.get("/getDailyLog/:date", fetchLog)

router.get("/foodsearch/search", searchForFood)
router.get("/foodsearch/barcode", searchFoodByBarcode)

router.get("/saved-foods", fetchSavedFoods)
router.post("/saved-foods", saveFood)
router.delete("/saved-foods/:foodId", removeSavedFood)

router.post("/addFoodToLog", addFoodToLog)
router.delete("/deleteFoodEntry/:entryId", removeFoodFromLog)



export default router
