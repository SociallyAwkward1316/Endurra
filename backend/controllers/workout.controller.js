import "dotenv/config"
import { getAllUserWorkouts, getUserWorkoutDetail, postSet, postUserWorkout, deleteSet, getExerciseList, postExerciseToWorkout, deleteExerciseFromWorkout, deleteUserWorkout, createUserExercise} from "../services/workout.services.js"
import { updateUserStreak } from "../services/streak.services.js"

export const getUserWorkouts = async (req, res) => {
    const userId = req.user.userId
    const workouts = await getAllUserWorkouts(userId)

    if(workouts.data.length === 0) {
        return res.status(404).json({message:"No Workouts"})
    }

    return res.status(200).json({data:workouts.data})
    
}

export const createUserWorkout = async (req,res) => {
    const userId = req.user.userId
    const workoutName = req.body.workoutName
    const activityDate = /^\d{4}-\d{2}-\d{2}$/.test(req.body.activityDate || "")
        ? req.body.activityDate
        : new Date().toISOString().split("T")[0]

    if (!workoutName) {
        return res.status(400).json({message:"Missing Workout Name"})
    }

    const workout = await postUserWorkout(workoutName, userId)

    if (workout.error) {
        return res.status(500).json({message:workout.error.message})
    }

    const streak = await updateUserStreak(userId, "workout", activityDate)

    if (streak.error) {
        console.error("Could not update workout streak", streak.error.message)
    }

    return res.status(200).json({data:workout.data, streak:streak.data || null})

}

export const getWorkoutInfo = async (req,res) => {
    const workoutId = req.params.workoutId

    const userWorkoutService = await getUserWorkoutDetail(workoutId)
    const data = userWorkoutService.data
    res.status(200).json({data:data})



}

export const addSet = async (req,res) => {
    const workoutUserId = req.body.workoutUserId
    const exerciseId = req.body.exerciseId
    const weight = req.body.weight
    const reps = req.body.reps

    if (workoutUserId !== req.user.userId) {
        return res.status(401).json({message:"Unauthorized"})
    }

    if (!weight || !reps) {
        return res.status(400).json({message:"Missing Data to POST"})
    }

    const set = await postSet(exerciseId, weight, reps)

    return res.status(200).json(set)
} 

export const delSet = async (req,res) => {
    const workoutUserId = req.body.workoutUserId
    const setId = req.body.setId
    
    if (workoutUserId !== req.user.userId) {
        return res.status(401).json({message:"Unauthorized"})
    }

    const set = await deleteSet(setId)

    return res.status(200).json({message:"Set Deleted"})

}


export const exerciseList = async (req,res) => {

    const list = await getExerciseList()

    if (list.error) {
        return res.status(500).json({message:list.error.message})
    }

    return res.status(200).json({data:list.data})
}

export const createExercise = async (req,res) => {
    const userId = req.user.userId
    const exerciseName = req.body.name?.trim()

    if (!exerciseName) {
        return res.status(400).json({message:"Missing exercise name"})
    }

    if (exerciseName.length < 2) {
        return res.status(400).json({message:"Exercise name must be at least 2 characters"})
    }

    const exercise = await createUserExercise(exerciseName, userId)

    if (exercise.error) {
        return res.status(500).json({message:exercise.error.message})
    }

    return res.status(200).json({data:exercise.data})
}

export const addExerciseToWorkout = async (req, res) => {
    const workout = req.body.workout
    const exercise = req.body.exercise

    if (req.user.userId !== workout.user_id) {
        return res.status(401).json({message:"Invalid User"})
    }

    const response = await postExerciseToWorkout(workout.id, exercise.id)

    if (response.error) {
        return res.status(500).json({message:response.error.message})
    }

    return res.status(200).json({message:"Exercise Added", data:response.data})


}


export const delExerciseFromWorkout = async (req,res) => {

    const workout = req.body.workout
    const exercise = req.body.exercise

    if (req.user.userId !== workout.user_id) {
        return res.status(401).json({message:"Invalid User"})
    }

    const response = deleteExerciseFromWorkout(exercise.id)

    return res.status(200).json({message:"Deleted"})

}

export const delWorkout = async (req, res) => {
    const userId = req.user.userId
    const workoutId = req.params.workoutId

    if (!workoutId) {
        return res.status(400).json({message:"Missing Workout Id"})
    }

    const deletedWorkout = await deleteUserWorkout(workoutId, userId)

    if (deletedWorkout.error) {
        const status = deletedWorkout.error.status || 500

        return res.status(status).json({message:deletedWorkout.error.message})
    }

    return res.status(200).json({message:"Workout Deleted"})
}
