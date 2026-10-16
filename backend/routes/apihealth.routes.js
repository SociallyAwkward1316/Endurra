import express from "express"
import supabase from "../supabase/supabase.js"

const router = express.Router()

const TEST_USER_ID = 15
const TEST_USER_EMAIL = "334@gmail.com"

router.get("/", (req, res) => {
    res.set("Cache-Control", "no-store")

    return res.status(200).json({
        status:"healthy",
        service:"endurra-api",
        uptimeSeconds:Math.floor(process.uptime()),
        timestamp:new Date().toISOString()
    })
})

router.get("/database", async (req, res) => {
    const startedAt = performance.now()

    try {
        const {data, error} = await supabase
            .from("Users")
            .select("id")
            .eq("id", TEST_USER_ID)
            .eq("email", TEST_USER_EMAIL)
            .maybeSingle()

        res.set("Cache-Control", "no-store")

        if (error || !data) {
            if (error) {
                console.error("Database health check failed", {
                    code:error.code || null,
                    message:error.message
                })
            }

            return res.status(503).json({
                status:"unhealthy",
                service:"endurra-database",
                responseTimeMs:Math.round(performance.now() - startedAt),
                timestamp:new Date().toISOString()
            })
        }

        return res.status(200).json({
            status:"healthy",
            service:"endurra-database",
            responseTimeMs:Math.round(performance.now() - startedAt),
            timestamp:new Date().toISOString()
        })
    } catch (error) {
        console.error("Database health check could not connect", {
            message:error instanceof Error ? error.message : "Unknown database health error"
        })

        res.set("Cache-Control", "no-store")

        return res.status(503).json({
            status:"unhealthy",
            service:"endurra-database",
            responseTimeMs:Math.round(performance.now() - startedAt),
            timestamp:new Date().toISOString()
        })
    }
})

export default router
