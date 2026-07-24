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

const RECOVERY_MUSCLE_CONFIG = [
    {
        muscle:"Chest",
        baseHours:36,
        terms:["chest", "pec", "bench", "push up", "pushup", "fly", "incline", "decline"]
    },
    {
        muscle:"Back",
        baseHours:48,
        terms:["back", "lat", "row", "pulldown", "pull down", "pull up", "pullup", "chin up", "chinup", "deadlift", "trap"]
    },
    {
        muscle:"Legs",
        baseHours:48,
        terms:["leg", "quad", "hamstring", "squat", "lunge", "romanian", "rdl"]
    },
    {
        muscle:"Glutes",
        baseHours:36,
        terms:["glute", "hip thrust", "hip bridge"]
    },
    {
        muscle:"Shoulders",
        baseHours:36,
        terms:["shoulder", "delt", "overhead", "military", "arnold", "lateral raise", "front raise", "rear delt"]
    },
    {
        muscle:"Triceps",
        baseHours:24,
        terms:["tricep", "skullcrusher", "skull crusher", "pushdown", "dip", "close grip"]
    },
    {
        muscle:"Biceps",
        baseHours:24,
        terms:["bicep", "curl", "hammer curl", "preacher"]
    },
    {
        muscle:"Core",
        baseHours:24,
        terms:["core", "ab", "oblique", "plank", "crunch"]
    },
    {
        muscle:"Calves",
        baseHours:24,
        terms:["calf", "calves"]
    }
]

const inferPrimaryMuscle = (exerciseName) => {
    const normalizedName = exerciseName.toLowerCase()
    const match = MUSCLE_PATTERNS.find((pattern) =>
        pattern.terms.some((term) => normalizedName.includes(term))
    )

    return match?.muscle || "Other"
}

const getRecoveryMuscle = (exercise = {}) => {
    const normalizedExercise = exercise || {}
    const explicitMuscle = String(normalizedExercise.primary_muscle || "").trim()
    const explicitMatch = RECOVERY_MUSCLE_CONFIG.find((config) =>
        config.terms.some((term) => explicitMuscle.toLowerCase().includes(term))
    )

    if (explicitMatch) {
        return explicitMatch
    }

    const exerciseName = String(normalizedExercise.name || "").toLowerCase()
    const nameMatch = RECOVERY_MUSCLE_CONFIG.find((config) =>
        config.terms.some((term) => exerciseName.includes(term))
    )

    return nameMatch || {
        muscle:explicitMuscle && explicitMuscle.toLowerCase() !== "other"
            ? explicitMuscle
            : "Full body",
        baseHours:36
    }
}

const getRecoveryHours = (baseHours, setCount) => {
    const volumeBonus = setCount >= 10 ? 24 : setCount >= 6 ? 12 : 0

    return Math.min(72, baseHours + volumeBonus)
}

export const getAllUserWorkouts = async (userId) => {
    const workouts = await supabase.from("Workouts").select("*").eq("user_id", userId).order("created_at", { ascending: false });

    return workouts
}

export const getRecentMuscleRecovery = async (userId) => {
    const workouts = await supabase
        .from("Workouts")
        .select(`
            id,
            name,
            created_at,
            WorkoutExercises (
                Exercises (name, primary_muscle),
                Sets (id)
            )
        `)
        .eq("user_id", userId)
        .order("created_at", {ascending:false})
        .limit(10)

    if (workouts.error) {
        return workouts
    }

    const now = Date.now()
    const latestMuscleSessions = new Map()
    const recentWorkouts = (workouts.data || [])
        .filter((workout) =>
            (workout.WorkoutExercises || []).some((workoutExercise) => workoutExercise.Sets?.length)
        )
        .slice(0, 3)

    recentWorkouts.forEach((workout) => {
        const trainedAt = Date.parse(workout.created_at)

        if (!Number.isFinite(trainedAt)) {
            return
        }

        const workoutMuscles = new Map()
        const workoutExercises = workout.WorkoutExercises || []

        workoutExercises.forEach((workoutExercise) => {
            const setCount = workoutExercise.Sets?.length || 0

            if (!setCount) {
                return
            }

            const recoveryMuscle = getRecoveryMuscle(workoutExercise.Exercises)
            const current = workoutMuscles.get(recoveryMuscle.muscle) || {
                baseHours:recoveryMuscle.baseHours,
                setCount:0
            }

            current.setCount += setCount
            workoutMuscles.set(recoveryMuscle.muscle, current)
        })

        workoutMuscles.forEach((muscleSession, muscle) => {
            if (latestMuscleSessions.has(muscle)) {
                return
            }

            const recoveryHours = getRecoveryHours(muscleSession.baseHours, muscleSession.setCount)
            const elapsedHours = Math.max(0, (now - trainedAt) / (60 * 60 * 1000))
            const remainingHours = Math.max(0, Math.ceil(recoveryHours - elapsedHours))

            latestMuscleSessions.set(muscle, {
                muscle,
                workoutId:workout.id,
                workoutName:workout.name || "Workout",
                trainedAt:workout.created_at,
                setCount:muscleSession.setCount,
                recoveryHours,
                remainingHours,
                recoveryPercent:Math.min(100, Math.max(0, Math.round((elapsedHours / recoveryHours) * 100))),
                readyAt:new Date(trainedAt + (recoveryHours * 60 * 60 * 1000)).toISOString(),
                status:remainingHours === 0 ? "ready" : remainingHours <= 12 ? "nearly_ready" : "recovering"
            })
        })
    })

    const muscleRecovery = Array.from(latestMuscleSessions.values())
        .sort((a, b) => b.remainingHours - a.remainingHours || Date.parse(b.trainedAt) - Date.parse(a.trainedAt))

    return {
        data:{
            workoutCount:recentWorkouts.length,
            muscleRecovery
        },
        error:null
    }
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

export const getExerciseBestWeight = async (userId, workoutExerciseId) => {
    const targetExercise = await supabase
        .from("WorkoutExercises")
        .select("id, exercise_id, workout_id")
        .eq("id", workoutExerciseId)
        .maybeSingle()

    if (targetExercise.error || !targetExercise.data) {
        return {
            data:null,
            error:targetExercise.error || new Error("Workout exercise not found")
        }
    }

    const userWorkouts = await supabase
        .from("Workouts")
        .select("id")
        .eq("user_id", userId)

    if (userWorkouts.error) {
        return userWorkouts
    }

    const workoutIds = (userWorkouts.data || []).map(workout => workout.id)

    if (!workoutIds.includes(targetExercise.data.workout_id)) {
        return {data:null, error:new Error("Unauthorized workout exercise")}
    }

    if (workoutIds.length === 0) {
        return {data:{previousBest:0, hasPreviousSets:false}, error:null}
    }

    const exerciseHistory = await supabase
        .from("WorkoutExercises")
        .select("Sets(weight)")
        .eq("exercise_id", targetExercise.data.exercise_id)
        .in("workout_id", workoutIds)

    if (exerciseHistory.error) {
        return exerciseHistory
    }

    const weights = (exerciseHistory.data || []).flatMap(workoutExercise =>
        (workoutExercise.Sets || [])
            .map(set => Number(set.weight))
            .filter(Number.isFinite)
    )

    return {
        data:{
            previousBest:weights.length ? Math.max(...weights) : 0,
            hasPreviousSets:weights.length > 0
        },
        error:null
    }
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
