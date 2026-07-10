import express from "express"
import { addExerciseToWorkout, addSet, createExercise, createUserWorkout, delExerciseFromWorkout, delSet, delWorkout, exerciseList, getUserWorkouts, getWorkoutInfo } from "../controllers/workout.controller.js"

const router = express.Router()

router.get("/workout-dash", getUserWorkouts)
router.post("/create-workout", createUserWorkout)
router.delete("/deleteWorkout/:workoutId", delWorkout)

router.get("/exerciseList", exerciseList)
router.post("/createExercise", createExercise)
router.post("/addExerciseToWorkout", addExerciseToWorkout)
router.delete("/deleteExerciseFromWorkout", delExerciseFromWorkout)

router.post("/addSetToExercise", addSet)
router.delete("/deleteSet", delSet)
router.get("/getWorkoutDetail/:workoutId", getWorkoutInfo)


export default router
