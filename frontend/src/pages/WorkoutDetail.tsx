import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
    ArrowLeft,
    Dumbbell,
    Plus,
    Search,
    Trash2,
    Trophy,
    X
} from "lucide-react"
import Navbar from "../components/Navbar"
import { useNavigate, useParams } from "react-router-dom"
import { BASEURL, apiFetch } from "../URL"

type Exercise = {
    id: number
    name: string
    user_id?: number | null
}

type SetEntry = {
    id: number
    weight: number | string
    reps: number | string
}

type WorkoutExercise = {
    id: number
    Exercises: Exercise
    Sets?: SetEntry[]
}

type AddedWorkoutExercise = {
    id: number
}

type Workout = {
    id: number
    user_id: number
    name: string
    date?: string
    created_at?: string
    WorkoutExercises?: WorkoutExercise[]
}

function WorkoutDetail() {
    const [showExerciseModal, setShowExerciseModal] = useState(false)
    const [showSetModal, setShowSetModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showDeleteExerciseModal, setShowDeleteExerciseModal] = useState(false)
    const [selectedExercise, setSelectedExercise] = useState<number | null>(null)
    const [selectedSet, setSelectedSet] = useState<number | null>(null)
    const [weight, setWeight] = useState("")
    const [reps, setReps] = useState("")
    const [workout, setWorkout] = useState<Workout | null>(null)
    const [exerciseSearch, setExerciseSearch] = useState("")
    const [exerciseList, setExerciseList] = useState<Exercise[]>([])
    const [exerciseToDelete, setExerciseToDelete] = useState<WorkoutExercise | null>(null)
    const [creatingExercise, setCreatingExercise] = useState(false)
    const [addingExercise, setAddingExercise] = useState(false)
    const [addingSet, setAddingSet] = useState(false)
    const [exerciseCreateError, setExerciseCreateError] = useState("")
    const creatingExerciseRef = useRef(false)
    const addingExerciseRef = useRef(false)
    const addingSetRef = useRef(false)

    const {workoutId} = useParams()
    const navigate = useNavigate()

    const fetchWorkoutInfo = useCallback(async () => {
        const response = await apiFetch(`${BASEURL}/workout/getWorkoutDetail/${workoutId}`,
            {
                method:"GET",
                credentials:"include",
                headers: {"Content-Type": "application/json"}
            }
        )

        const data = await response.json()
        setWorkout(data.data?.[0] || null)
    }, [workoutId])

    const fetchExerciseList = useCallback(async () => {
        const response = await apiFetch(`${BASEURL}/workout/exerciseList`,
            {
                method:"GET",
                credentials:"include",
                headers:{"Content-Type": "application/json"}
            }
        )

        const data = await response.json()
        setExerciseList(data.data || [])
    }, [])

    useEffect(() => {
        const loadPageData = async () => {
            await fetchWorkoutInfo()
            await fetchExerciseList()
        }

        loadPageData()
    },[fetchWorkoutInfo, fetchExerciseList])

    const filteredExercises = useMemo(() => {
        return exerciseList.filter((exercise) =>
            exercise.name
                .toLowerCase()
                .includes(exerciseSearch.toLowerCase())
        )
    }, [exerciseList, exerciseSearch])

    const trimmedExerciseSearch = exerciseSearch.trim()
    const exactExerciseMatch = useMemo(() => {
        const normalizedSearch = trimmedExerciseSearch.toLowerCase()

        if (!normalizedSearch) {
            return false
        }

        return exerciseList.some((exercise) => exercise.name.toLowerCase() === normalizedSearch)
    }, [exerciseList, trimmedExerciseSearch])

    const canCreateExercise = trimmedExerciseSearch.length >= 2 && !exactExerciseMatch

    const workoutStats = useMemo(() => {
        const exercises = workout?.WorkoutExercises || []
        const totalSets = exercises.reduce((sum, exercise) => sum + (exercise.Sets?.length || 0), 0)
        const totalReps = exercises.reduce(
            (sum, exercise) =>
                sum + (exercise.Sets || []).reduce((setSum, set) => setSum + (Number(set.reps) || 0), 0),
            0
        )

        return {
            exercises: exercises.length,
            totalSets,
            totalReps
        }
    }, [workout])

    const formatWorkoutDate = () => {
        const date = workout?.date || workout?.created_at

        if (!date) {
            return "Workout session"
        }

        return new Date(date).toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
            year: "numeric"
        })
    }

    const closeExerciseModal = () => {
        setShowExerciseModal(false)
        setExerciseSearch("")
        setExerciseCreateError("")
    }

    const handleExerciseClick = async (exercise: Exercise) => {
        if (!workout || addingExerciseRef.current) {
            return
        }

        addingExerciseRef.current = true
        setAddingExercise(true)
        closeExerciseModal()

        try {
            const response = await apiFetch(`${BASEURL}/workout/addExerciseToWorkout`,
                {
                    method:"POST",
                    credentials:"include",
                    headers:{"Content-Type":"application/json"},
                    body:JSON.stringify({
                        workout,
                        exercise
                    })
                }
            )

            const data = await response.json()
            const addedExercise = data.data?.[0] as AddedWorkoutExercise | undefined

            await fetchWorkoutInfo()

            if (addedExercise?.id) {
                setSelectedExercise(addedExercise.id)
                setShowSetModal(true)
            }
        } finally {
            addingExerciseRef.current = false
            setAddingExercise(false)
        }
    }

    const handleCreateExercise = async () => {
        if (!canCreateExercise || creatingExerciseRef.current) {
            return
        }

        creatingExerciseRef.current = true
        setCreatingExercise(true)
        setExerciseCreateError("")

        try {
            const response = await apiFetch(`${BASEURL}/workout/createExercise`,
                {
                    method:"POST",
                    credentials:"include",
                    headers:{"Content-Type":"application/json"},
                    body:JSON.stringify({
                        name:trimmedExerciseSearch
                    })
                }
            )

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || "Could not create exercise")
            }

            const createdExercise = data.data?.[0] as Exercise | undefined

            if (!createdExercise) {
                throw new Error("Could not create exercise")
            }

            setExerciseList((currentExercises) => {
                const exists = currentExercises.some((exercise) => exercise.id === createdExercise.id)

                return exists ? currentExercises : [...currentExercises, createdExercise]
            })

            await handleExerciseClick(createdExercise)
        } catch (error) {
            setExerciseCreateError(error instanceof Error ? error.message : "Could not create exercise")
        } finally {
            creatingExerciseRef.current = false
            setCreatingExercise(false)
        }
    }

    const handleExerciseDelete = async () => {
        if (!workout || !exerciseToDelete) {
            return
        }

        await apiFetch(`${BASEURL}/workout/deleteExerciseFromWorkout`,
            {
                method:"DELETE",
                credentials:"include",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify({
                    workout,
                    exercise:exerciseToDelete
                })
            }
        )

        await fetchWorkoutInfo()
        setExerciseToDelete(null)
        setShowDeleteExerciseModal(false)
    }

    const handleSetSubmit = async () => {
        if (!workout || !selectedExercise || !weight || !reps || addingSetRef.current) {
            return
        }

        addingSetRef.current = true
        setAddingSet(true)
        setShowSetModal(false)

        const exerciseId = selectedExercise
        const submittedWeight = weight
        const submittedReps = reps

        setWeight("")
        setReps("")
        setSelectedExercise(null)

        try {
            await apiFetch(`${BASEURL}/workout/addSetToExercise`,
                {
                    method:"POST",
                    credentials:"include",
                    headers:{"Content-Type":"application/json"},
                    body:JSON.stringify({
                        workoutUserId:workout.user_id,
                        exerciseId,
                        weight:submittedWeight,
                        reps:submittedReps
                    })
                }
            )

            await fetchWorkoutInfo()
        } finally {
            addingSetRef.current = false
            setAddingSet(false)
        }
    }

    const handleSetDelete = async () => {
        if (!workout || !selectedSet) {
            return
        }

        await apiFetch(`${BASEURL}/workout/deleteSet`,
            {
                method:"DELETE",
                credentials:"include",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify({
                    workoutUserId:workout.user_id,
                    setId:selectedSet
                })
            }
        )

        await fetchWorkoutInfo()
        setSelectedSet(null)
        setShowDeleteModal(false)
    }

    if (!workout) {
        return (
            <div className="min-h-screen bg-[#171B1F] text-[#F8FAFC] md:pl-64">
                <Navbar />
                <main className="mx-auto w-full max-w-7xl px-4 pb-6 pt-16 md:px-8 md:py-8">
                    <div className="rounded-[28px] border border-[#2A3138] bg-[#1E242B] p-8 text-[#94A3B8]">
                        Loading workout...
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#171B1F] text-[#F8FAFC] md:pl-64">
            <Navbar />

            <main className="mx-auto w-full max-w-7xl px-4 pb-6 pt-16 md:px-8 md:py-8">
                <section className="mb-6 overflow-hidden rounded-[28px] border border-[#2A3138] bg-[#1E242B] shadow-2xl shadow-black/20">
                    <div className="flex flex-col gap-7 p-5 sm:p-6 md:flex-row md:items-center md:justify-between md:p-8">
                        <div>
                            <div className="mb-7 flex flex-col items-start gap-5 sm:gap-6">
                                <button
                                    onClick={() => navigate("/workoutDash")}
                                    className="inline-flex items-center gap-2 text-sm font-medium text-[#94A3B8] transition hover:text-white"
                                >
                                    <ArrowLeft size={16} />
                                    Back to workouts
                                </button>

                                <div className="inline-flex items-center gap-2 rounded-full border border-[#2DDE85]/25 bg-[#2DDE85]/10 px-3 py-1 text-sm font-medium text-[#2DDE85]">
                                    <Trophy size={16} />
                                    Active workout
                                </div>
                            </div>

                            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                                {workout.name}
                            </h1>

                            <p className="mt-2 text-sm text-[#94A3B8] md:text-base">
                                {formatWorkoutDate()}
                            </p>
                        </div>

                        <button
                            onClick={() => setShowExerciseModal(true)}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2DDE85] px-5 py-3 font-semibold text-black shadow-lg shadow-[#2DDE85]/20 transition hover:bg-[#25C876] sm:w-auto"
                        >
                            <Plus size={18} />
                            Add Exercise
                        </button>
                    </div>
                </section>

                <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
                    <div className="col-span-2 rounded-[22px] border border-[#2A3138] bg-[#1E242B] p-4 shadow-xl shadow-black/10 md:col-span-1 md:rounded-[24px] md:p-5">
                        <p className="text-sm font-medium text-[#94A3B8]">Exercises</p>
                        <p className="mt-2 text-2xl font-bold text-white md:mt-3 md:text-3xl">{workoutStats.exercises}</p>
                    </div>

                    <div className="rounded-[22px] border border-[#2A3138] bg-[#1E242B] p-4 shadow-xl shadow-black/10 md:rounded-[24px] md:p-5">
                        <p className="text-sm font-medium text-[#94A3B8]">Total sets</p>
                        <p className="mt-2 text-2xl font-bold text-white md:mt-3 md:text-3xl">{workoutStats.totalSets}</p>
                    </div>

                    <div className="rounded-[22px] border border-[#2A3138] bg-[#1E242B] p-4 shadow-xl shadow-black/10 md:rounded-[24px] md:p-5">
                        <p className="text-sm font-medium text-[#94A3B8]">Total reps</p>
                        <p className="mt-2 text-2xl font-bold text-white md:mt-3 md:text-3xl">{workoutStats.totalReps}</p>
                    </div>
                </section>

                <section className="space-y-4">
                    {!workout.WorkoutExercises?.length ? (
                        <div className="rounded-[28px] border border-dashed border-[#313A45] bg-[#1E242B] px-6 py-14 text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2DDE85]/10 text-[#2DDE85]">
                                <Dumbbell size={26} />
                            </div>
                            <p className="font-semibold text-white">
                                No exercises added yet.
                            </p>
                            <p className="mt-2 text-sm text-[#6B7280]">
                                Add an exercise to start tracking sets.
                            </p>
                        </div>
                    ) : (
                        workout.WorkoutExercises.map((exercise) => (
                            <div
                                key={exercise.id}
                                className="rounded-[28px] border border-[#2A3138] bg-[#1E242B] p-5 shadow-xl shadow-black/10 md:p-6"
                            >
                                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">
                                            {exercise.Exercises.name}
                                        </h2>

                                        <p className="mt-1 text-sm text-[#6B7280]">
                                            {exercise.Sets?.length || 0} sets logged
                                        </p>
                                    </div>

                                    <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:min-w-72">
                                        <button
                                            onClick={() => {
                                                setSelectedExercise(exercise.id)
                                                setShowSetModal(true)
                                            }}
                                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#2DDE85]/40 bg-[#2DDE85]/10 px-4 py-2.5 text-sm font-semibold text-[#2DDE85] transition hover:border-[#2DDE85] hover:bg-[#2DDE85]/15"
                                        >
                                            <Plus size={16} />
                                            Add Set
                                        </button>

                                        <button
                                            onClick={() => {
                                                setExerciseToDelete(exercise)
                                                setShowDeleteExerciseModal(true)
                                            }}
                                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/15 hover:text-red-200"
                                            aria-label={`Delete ${exercise.Exercises.name}`}
                                        >
                                            <Trash2 size={18} />
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                {!exercise.Sets?.length ? (
                                    <div className="rounded-2xl border border-dashed border-[#313A45] bg-[#171B1F] px-5 py-8 text-center text-sm text-[#6B7280]">
                                        No sets yet. Add your first set for this exercise.
                                    </div>
                                ) : (
                                    <>
                                    <div className="grid grid-cols-1 gap-2.5 sm:hidden">
                                        {exercise.Sets.map((set, index) => (
                                            <div
                                                key={set.id}
                                                className="rounded-xl border border-[#2A3138] bg-[#171B1F] p-3"
                                            >
                                                <div className="mb-3 flex items-center justify-between gap-3">
                                                    <span className="rounded-full bg-[#2DDE85]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#2DDE85]">
                                                        Set #{index + 1}
                                                    </span>

                                                    <button
                                                        onClick={() => {
                                                            setSelectedSet(set.id)
                                                            setShowDeleteModal(true)
                                                        }}
                                                        className="inline-flex rounded-lg p-1.5 text-[#6B7280] transition hover:bg-red-500/10 hover:text-red-300"
                                                        aria-label="Delete set"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div>
                                                        <p className="text-xs text-[#6B7280]">Weight</p>
                                                        <p className="mt-0.5 font-bold text-white">{set.weight} lb</p>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs text-[#6B7280]">Reps</p>
                                                        <p className="mt-0.5 font-bold text-white">{set.reps}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="hidden overflow-hidden rounded-2xl border border-[#2A3138] sm:block">
                                        <table className="w-full">
                                            <thead className="bg-[#171B1F]">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Set</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Weight</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Reps</th>
                                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Action</th>
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-[#2A3138] bg-[#1E242B]">
                                                {exercise.Sets.map((set, index) => (
                                                    <tr key={set.id}>
                                                        <td className="px-4 py-4 font-semibold text-white">
                                                            {index + 1}
                                                        </td>

                                                        <td className="px-4 py-4 text-[#CBD5E1]">
                                                            {set.weight} lb
                                                        </td>

                                                        <td className="px-4 py-4 text-[#CBD5E1]">
                                                            {set.reps}
                                                        </td>

                                                        <td className="px-4 py-4 text-right">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedSet(set.id)
                                                                    setShowDeleteModal(true)
                                                                }}
                                                                className="inline-flex rounded-xl p-2 text-[#6B7280] transition hover:bg-red-500/10 hover:text-red-300"
                                                                aria-label="Delete set"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </section>
            </main>

            {showExerciseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-[#313A45] bg-[#1E242B] shadow-2xl shadow-black/40">
                        <div className="flex items-start justify-between border-b border-[#2A3138] px-6 py-5">
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    Add Exercise
                                </h2>
                                <p className="mt-1 text-sm text-[#6B7280]">
                                    Search and add an exercise to this workout.
                                </p>
                            </div>

                            <button
                                onClick={closeExerciseModal}
                                className="rounded-xl p-2 text-[#94A3B8] transition hover:bg-[#171B1F] hover:text-white"
                                aria-label="Close modal"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="relative">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                                <input
                                    value={exerciseSearch}
                                    onChange={(e) => {
                                        setExerciseSearch(e.target.value)
                                        setExerciseCreateError("")
                                    }}
                                    placeholder="Search exercises..."
                                    className="w-full rounded-2xl border border-[#313A45] bg-[#171B1F] py-3 pl-11 pr-4 text-white outline-none transition placeholder:text-[#6B7280] focus:border-[#2DDE85]"
                                />
                            </div>

                            <div className="mt-5 max-h-96 space-y-3 overflow-y-auto pr-1">
                                {canCreateExercise && (
                                    <button
                                        onClick={handleCreateExercise}
                                        disabled={creatingExercise}
                                        className="flex w-full items-center gap-3 rounded-2xl border border-[#2DDE85]/35 bg-[#2DDE85]/10 p-4 text-left transition hover:border-[#2DDE85] hover:bg-[#2DDE85]/15 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2DDE85] text-black">
                                            <Plus size={18} />
                                        </div>

                                        <div>
                                            <p className="font-semibold text-white">
                                                {creatingExercise ? "Creating exercise..." : `Create "${trimmedExerciseSearch}"`}
                                            </p>
                                            <p className="mt-1 text-sm text-[#94A3B8]">
                                                Save it to your exercise list and add it to this workout.
                                            </p>
                                        </div>
                                    </button>
                                )}

                                {exerciseCreateError && (
                                    <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                        {exerciseCreateError}
                                    </div>
                                )}

                                {filteredExercises.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-[#313A45] bg-[#171B1F] px-6 py-12 text-center text-[#6B7280]">
                                        {trimmedExerciseSearch.length ? "No saved exercises match this search yet." : "Search for an exercise to add."}
                                    </div>
                                ) : (
                                    filteredExercises.map((exercise) => (
                                        <button
                                            key={exercise.id}
                                            onClick={() => handleExerciseClick(exercise)}
                                            disabled={addingExercise}
                                            className="flex w-full items-center gap-3 rounded-2xl border border-transparent bg-[#171B1F] p-4 text-left transition hover:border-[#2DDE85] disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2DDE85]/10 text-[#2DDE85]">
                                                <Dumbbell size={18} />
                                            </div>

                                            <p className="font-semibold text-white">
                                                {exercise.name}
                                            </p>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showSetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-[#313A45] bg-[#1E242B] shadow-2xl shadow-black/40">
                        <div className="flex items-start justify-between border-b border-[#2A3138] px-6 py-5">
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    Add Set
                                </h2>
                                <p className="mt-1 text-sm text-[#6B7280]">
                                    Log weight and reps for this exercise.
                                </p>
                            </div>

                            <button
                                onClick={() => setShowSetModal(false)}
                                className="rounded-xl p-2 text-[#94A3B8] transition hover:bg-[#171B1F] hover:text-white"
                                aria-label="Close modal"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <div className="space-y-4 p-6">
                            <input
                                type="number"
                                placeholder="Weight"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                className="w-full rounded-2xl border border-[#313A45] bg-[#171B1F] px-4 py-3 text-white outline-none transition placeholder:text-[#6B7280] focus:border-[#2DDE85]"
                            />

                            <input
                                type="number"
                                placeholder="Reps"
                                value={reps}
                                onChange={(e) => setReps(e.target.value)}
                                className="w-full rounded-2xl border border-[#313A45] bg-[#171B1F] px-4 py-3 text-white outline-none transition placeholder:text-[#6B7280] focus:border-[#2DDE85]"
                            />

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setShowSetModal(false)}
                                    className="rounded-xl border border-[#313A45] px-4 py-2 font-medium text-[#AAB4C0] transition hover:bg-[#171B1F] hover:text-white"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={handleSetSubmit}
                                    disabled={addingSet}
                                    className="rounded-xl bg-[#2DDE85] px-5 py-2 font-semibold text-black transition hover:bg-[#25C876] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {addingSet ? "Adding..." : "Add Set"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[28px] border border-[#313A45] bg-[#1E242B] p-6 shadow-2xl shadow-black/40">
                        <h2 className="text-xl font-bold text-white">
                            Delete set?
                        </h2>

                        <p className="mt-2 text-sm text-[#6B7280]">
                            This action cannot be undone.
                        </p>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="rounded-xl border border-[#313A45] px-4 py-2 font-medium text-[#AAB4C0] transition hover:bg-[#171B1F] hover:text-white"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleSetDelete}
                                className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteExerciseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[28px] border border-[#313A45] bg-[#1E242B] p-6 shadow-2xl shadow-black/40">
                        <h2 className="text-xl font-bold text-white">
                            Delete exercise?
                        </h2>

                        <p className="mt-2 text-sm text-[#6B7280]">
                            This will remove the exercise and all sets associated with it.
                        </p>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteExerciseModal(false)}
                                className="rounded-xl border border-[#313A45] px-4 py-2 font-medium text-[#AAB4C0] transition hover:bg-[#171B1F] hover:text-white"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleExerciseDelete}
                                className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default WorkoutDetail
