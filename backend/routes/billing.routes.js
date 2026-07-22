import express from "express"
import {
    billingStatusController,
    checkoutController,
    portalController
} from "../controllers/billing.controller.js"

const router = express.Router()

router.get("/status", billingStatusController)
router.post("/checkout", checkoutController)
router.post("/portal", portalController)

export default router
