import supabase from "../supabase/supabase.js";

const MUSCLE_PATTERNS = [
    {
        muscle: "Chest",
        terms: ["chest", "pec", "bench", "push up", "pushup", "fly", "incline", "decline"]
    },
    {
        muscle: "Legs",
        terms: ["back squat", "front squat", "goblet squat", "split squat", "leg", "quad", "hamstring", "glute", "calf", "squat", "lunge", "hip thrust", "romanian", "rdl"]
    },
    {
        muscle: "Back",
        terms: ["back", "lat", "row", "pulldown", "pull down", "pull up", "pullup", "chin up", "chinup", "deadlift"]
    },
    {
        muscle: "Shoulders",
        terms: ["shoulder", "delt", "overhead", "military", "arnold", "lateral raise", "front raise", "rear delt"]
    },
    {
        muscle: "Biceps",
        terms: ["bicep", "curl", "hammer curl", "preacher"]
    },
    {
        muscle: "Triceps",
        terms: ["tricep", "skullcrusher", "skull crusher", "pushdown", "dip", "close grip"]
    }
]

const inferPrimaryMuscle = (exerciseName) => {
    const normalizedName = exerciseName.toLowerCase()
    const match = MUSCLE_PATTERNS.find((pattern) =>
        pattern.terms.some((term) => normalizedName.includes(term))
    )

    return match?.muscle || "Other"
}

export const getAllUserWorkouts = async (userId) => {
    const workouts = await supabase.from("Workouts").select("*").eq("user_id", userId).order("created_at", { ascending: false });

    return workouts
}

export const postUserWorkout = async (workoutName, userId) => {
    const workout = await supabase.from("Workouts").insert({user_id:userId, name:workoutName}).select()

    return workout
}

export const getUserWorkoutDetail = async (workoutId) => {
    const workout = await supabase.from("Workouts").select(`*, WorkoutExercises (*, Exercises (id, name), Sets (id, weight, reps))`).eq("id", workoutId)
    return workout

}

export const postSet = async (exerciseId, weight, reps) => {
    const set = await supabase.from("Sets").insert({exercise_id:exerciseId, weight:weight, reps:reps}).select()
    return set
}

export const deleteSet = async (set_id) => {
    const deletedset = await supabase.from("Sets").delete().eq("id", set_id)
}

export const getExerciseList = async () => {
    const exerciseList = await supabase
        .from("Exercises")
        .select()
        .order("name", { ascending: true })

    return exerciseList
}

export const createUserExercise = async (name, userId) => {
    const normalizedName = name.trim()
    const exercisePayload = {
        name: normalizedName,
        primary_muscle: inferPrimaryMuscle(normalizedName)
    }

    const existingExercise = await supabase
        .from("Exercises")
        .select()
        .ilike("name", normalizedName)
        .limit(1)

    if (existingExercise.error) {
        return existingExercise
    }

    if (existingExercise.data?.length) {
        return {
            data: existingExercise.data,
            error: null
        }
    }

    const userExercise = await supabase
        .from("Exercises")
        .insert({ ...exercisePayload, user_id: userId })
        .select()

    if (!userExercise.error) {
        return userExercise
    }

    const missingUserIdColumn =
        userExercise.error.message?.includes("'user_id' column") ||
        userExercise.error.message?.includes("user_id")

    if (!missingUserIdColumn) {
        return userExercise
    }

    return supabase
        .from("Exercises")
        .insert(exercisePayload)
        .select()
}

export const postExerciseToWorkout = async (workout_id, exercise_id) =>  {
    const exercise = await supabase
        .from("WorkoutExercises")
        .insert({workout_id:workout_id, exercise_id:exercise_id})
        .select()

    return exercise
}

export const deleteExerciseFromWorkout = async (exercise_id) => {
    const del = await supabase.from("WorkoutExercises").delete().eq("id", exercise_id)

    return del
}

export const deleteUserWorkout = async (workoutId, userId) => {
    const workout = await supabase
        .from("Workouts")
        .select("id, user_id")
        .eq("id", workoutId)
        .single()

    if (workout.error) {
        return workout
    }

    if (String(workout.data.user_id) !== String(userId)) {
        return {
            data: null,
            error: {
                message: "Unauthorized",
                status: 401
            }
        }
    }

    const workoutExercises = await supabase
        .from("WorkoutExercises")
        .select("id")
        .eq("workout_id", workoutId)

    if (workoutExercises.error) {
        return workoutExercises
    }

    const workoutExerciseIds = (workoutExercises.data || []).map((exercise) => exercise.id)

    if (workoutExerciseIds.length > 0) {
        const deletedSets = await supabase
            .from("Sets")
            .delete()
            .in("exercise_id", workoutExerciseIds)

        if (deletedSets.error) {
            return deletedSets
        }

        const deletedWorkoutExercises = await supabase
            .from("WorkoutExercises")
            .delete()
            .eq("workout_id", workoutId)

        if (deletedWorkoutExercises.error) {
            return deletedWorkoutExercises
        }
    }

    return supabase
        .from("Workouts")
        .delete()
        .eq("id", workoutId)
        .eq("user_id", userId)
}
