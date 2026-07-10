import supabase from "../supabase/supabase.js";

const CORE_MUSCLE_GROUPS = ["Chest", "Back", "Shoulders", "Biceps", "Triceps", "Legs"];

const MUSCLE_PATTERNS = [
    {
        group: "Chest",
        terms: ["chest", "pec", "bench", "push up", "pushup", "fly", "incline", "decline"]
    },
    {
        group: "Legs",
        terms: ["back squat", "front squat", "goblet squat", "split squat", "leg", "quad", "hamstring", "glute", "calf", "squat", "lunge", "hip thrust", "romanian", "rdl"]
    },
    {
        group: "Back",
        terms: ["back", "lat", "row", "pulldown", "pull down", "pull up", "pullup", "chin up", "chinup", "deadlift"]
    },
    {
        group: "Shoulders",
        terms: ["shoulder", "delt", "overhead", "military", "arnold", "lateral raise", "front raise", "rear delt"]
    },
    {
        group: "Biceps",
        terms: ["bicep", "curl", "hammer curl", "preacher"]
    },
    {
        group: "Triceps",
        terms: ["tricep", "skullcrusher", "skull crusher", "pushdown", "dip", "close grip"]
    }
];

const normalizeNumber = (value) => {
    const number = Number(value);

    return Number.isFinite(number) ? number : 0;
};

const getExerciseText = (exercise = {}) => {
    return [
        exercise.name,
        exercise.primary_muscle,
        exercise.primaryMuscle,
        exercise.muscle_group,
        exercise.muscleGroup,
        exercise.body_part,
        exercise.bodyPart,
        exercise.target
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
};

const inferMuscleGroup = (exercise = {}) => {
    const explicitGroup = exercise.primary_muscle || exercise.primaryMuscle || exercise.muscle_group || exercise.muscleGroup || exercise.body_part || exercise.bodyPart || exercise.target;

    if (explicitGroup) {
        const normalizedExplicitGroup = String(explicitGroup).toLowerCase();
        const matchingCoreGroup = CORE_MUSCLE_GROUPS.find((group) =>
            normalizedExplicitGroup.includes(group.toLowerCase())
        );

        if (matchingCoreGroup) {
            return matchingCoreGroup;
        }
    }

    const exerciseText = getExerciseText(exercise);
    const matchingPattern = MUSCLE_PATTERNS.find((pattern) =>
        pattern.terms.some((term) => exerciseText.includes(term))
    );

    return matchingPattern?.group || "Other";
};

const getWorkoutAnalyticsRows = async (userId) => {
    return supabase
        .from("Workouts")
        .select(`
            id,
            name,
            created_at,
            user_id,
            WorkoutExercises (
                id,
                exercise_id,
                Exercises (*),
                Sets (
                    id,
                    weight,
                    reps
                )
            )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
};

const buildAnalytics = (workouts = []) => {
    const focusMap = new Map(
        CORE_MUSCLE_GROUPS.map((group) => [
            group,
            {
                group,
                sets: 0,
                exercises: 0,
                volume: 0
            }
        ])
    );

    const exerciseMap = new Map();

    workouts.forEach((workout) => {
        (workout.WorkoutExercises || []).forEach((workoutExercise) => {
            const exercise = workoutExercise.Exercises || {};
            const exerciseId = exercise.id || workoutExercise.exercise_id;

            if (!exerciseId) {
                return;
            }

            const muscleGroup = inferMuscleGroup(exercise);
            const sets = workoutExercise.Sets || [];
            const effectiveSetCount = sets.length || 1;
            const volume = sets.reduce((sum, set) => {
                return sum + (normalizeNumber(set.weight) * normalizeNumber(set.reps));
            }, 0);

            if (focusMap.has(muscleGroup)) {
                const focus = focusMap.get(muscleGroup);
                focus.sets += effectiveSetCount;
                focus.exercises += 1;
                focus.volume += volume;
            }

            if (!exerciseMap.has(exerciseId)) {
                exerciseMap.set(exerciseId, {
                    id: exerciseId,
                    name: exercise.name || "Exercise",
                    muscleGroup,
                    totalSets: 0,
                    totalReps: 0,
                    bestWeight: 0,
                    totalVolume: 0,
                    sessions: 0,
                    lastPerformed: null
                });
            }

            const summary = exerciseMap.get(exerciseId);
            summary.totalSets += sets.length;
            summary.totalReps += sets.reduce((sum, set) => sum + normalizeNumber(set.reps), 0);
            summary.bestWeight = Math.max(
                summary.bestWeight,
                ...sets.map((set) => normalizeNumber(set.weight)),
                0
            );
            summary.totalVolume += volume;
            summary.sessions += 1;

            if (!summary.lastPerformed || new Date(workout.created_at) > new Date(summary.lastPerformed)) {
                summary.lastPerformed = workout.created_at;
            }
        });
    });

    const focus = Array.from(focusMap.values());
    const exercises = Array.from(exerciseMap.values()).sort((a, b) => {
        if (b.totalSets !== a.totalSets) {
            return b.totalSets - a.totalSets;
        }

        return a.name.localeCompare(b.name);
    });

    const totals = exercises.reduce(
        (sum, exercise) => ({
            totalExercises: sum.totalExercises + 1,
            totalSets: sum.totalSets + exercise.totalSets,
            totalVolume: sum.totalVolume + exercise.totalVolume
        }),
        {
            totalExercises: 0,
            totalSets: 0,
            totalVolume: 0
        }
    );

    const favoriteGroup = focus.slice().sort((a, b) => b.sets - a.sets)[0];

    return {
        focus,
        exercises,
        totals: {
            ...totals,
            favoriteGroup: favoriteGroup?.sets ? favoriteGroup.group : null
        }
    };
};

export const getUserAnalyticsOverview = async (userId) => {
    const workouts = await getWorkoutAnalyticsRows(userId);

    if (workouts.error) {
        return workouts;
    }

    return {
        data: buildAnalytics(workouts.data || []),
        error: null
    };
};

export const getUserExerciseAnalytics = async (userId, exerciseId) => {
    const workouts = await getWorkoutAnalyticsRows(userId);

    if (workouts.error) {
        return workouts;
    }

    const matchingSets = [];
    const progression = [];
    let exerciseInfo = null;

    (workouts.data || []).forEach((workout) => {
        (workout.WorkoutExercises || []).forEach((workoutExercise) => {
            const exercise = workoutExercise.Exercises || {};
            const currentExerciseId = String(exercise.id || workoutExercise.exercise_id);

            if (currentExerciseId !== String(exerciseId)) {
                return;
            }

            if (!exerciseInfo) {
                exerciseInfo = {
                    id: exercise.id || workoutExercise.exercise_id,
                    name: exercise.name || "Exercise",
                    muscleGroup: inferMuscleGroup(exercise)
                };
            }

            const sets = workoutExercise.Sets || [];
            const workoutVolume = sets.reduce((sum, set) => {
                return sum + (normalizeNumber(set.weight) * normalizeNumber(set.reps));
            }, 0);
            const bestWeight = Math.max(...sets.map((set) => normalizeNumber(set.weight)), 0);
            const totalReps = sets.reduce((sum, set) => sum + normalizeNumber(set.reps), 0);

            progression.push({
                workoutId: workout.id,
                workoutName: workout.name,
                date: workout.created_at,
                sets: sets.length,
                totalReps,
                bestWeight,
                volume: workoutVolume
            });

            sets.forEach((set, index) => {
                matchingSets.push({
                    id: set.id,
                    workoutId: workout.id,
                    workoutName: workout.name,
                    date: workout.created_at,
                    setNumber: index + 1,
                    weight: normalizeNumber(set.weight),
                    reps: normalizeNumber(set.reps),
                    volume: normalizeNumber(set.weight) * normalizeNumber(set.reps)
                });
            });
        });
    });

    if (!exerciseInfo) {
        return {
            data: null,
            error: {
                message: "Exercise analytics not found"
            }
        };
    }

    const totals = matchingSets.reduce(
        (sum, set) => ({
            totalSets: sum.totalSets + 1,
            totalReps: sum.totalReps + set.reps,
            bestWeight: Math.max(sum.bestWeight, set.weight),
            totalVolume: sum.totalVolume + set.volume
        }),
        {
            totalSets: 0,
            totalReps: 0,
            bestWeight: 0,
            totalVolume: 0
        }
    );

    return {
        data: {
            exercise: exerciseInfo,
            totals,
            progression,
            sets: matchingSets
        },
        error: null
    };
};
