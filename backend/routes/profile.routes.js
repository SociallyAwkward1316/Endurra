import express from "express";
import { getProfile, updateProfileInfo, updateProfileNutrition } from "../controllers/profile.controller.js";

const router = express.Router();

router.get("/", getProfile);
router.put("/user", updateProfileInfo);
router.put("/nutrition", updateProfileNutrition);

export default router;
