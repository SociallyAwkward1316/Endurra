import express from "express"
import { addFoodToLog, createLog, createNutritionProfile, fetchLog, fetchSavedFoods, grabNutritionProfile, removeFoodFromLog, removeSavedFood, saveFood, searchFoodByBarcode, searchForFood } from "../controllers/caltracker.controller.js"
import { createFoodImageAnalysis } from "../controllers/foodImage.controller.js"
import { enforceCalorieDayLimit } from "../middleware/freeTrackingLimits.js"
import { uploadFoodImage } from "../middleware/foodImageUpload.js"
import proOnly from "../middleware/proOnly.js"

const router = express.Router()

router.post("/createNutritionProfile", createNutritionProfile)
router.get("/getNutritionProfile", grabNutritionProfile)
router.post("/createUserLog", enforceCalorieDayLimit, createLog)
router.get("/getDailyLog/:date", fetchLog)

router.get("/foodsearch/search", searchForFood)
router.get("/foodsearch/barcode", searchFoodByBarcode)
router.post("/food-image/analyze", proOnly, uploadFoodImage, createFoodImageAnalysis)

router.get("/saved-foods", fetchSavedFoods)
router.post("/saved-foods", saveFood)
router.delete("/saved-foods/:foodId", removeSavedFood)

router.post("/addFoodToLog", addFoodToLog)
router.delete("/deleteFoodEntry/:entryId", removeFoodFromLog)



export default router
