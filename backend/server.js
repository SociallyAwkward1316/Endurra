import "dotenv/config"
import express from "express"
import AuthRouter from "./routes/auth.routes.js"
import WorkoutRouter from "./routes/workout.routes.js"
import CalTrackerRouter from "./routes/caltracker.routes.js"
import AnalyticsRouter from "./routes/analytics.routes.js"
import ProfileRouter from "./routes/profile.routes.js"
import errorhandler from "./middleware/errorhandler.js"
import cookieParser from "cookie-parser"
import cors from "cors"
import { corsOptions } from "./middleware/corsOptions.js"
import tokenAuthentication from "./middleware/tokenAuthentication.js"

const PORT = process.env.PORT || 3000


const app = express()
app.use(express.json())
app.use(cookieParser())
app.use(cors(corsOptions))

app.use("/auth", AuthRouter)
app.use("/workout", tokenAuthentication ,WorkoutRouter)
app.use("/caltracker", tokenAuthentication, CalTrackerRouter)
app.use("/analytics", tokenAuthentication, AnalyticsRouter)
app.use("/profile", tokenAuthentication, ProfileRouter)


app.listen(PORT)

app.use(errorhandler)
