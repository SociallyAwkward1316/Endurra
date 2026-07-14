import { useCallback, useEffect, useMemo, useState } from "react"
import { CalendarDays, Dumbbell, Flame, Plus, Search, Trophy, Trash2, X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import { BASEURL, apiFetch } from "../URL.tsx"
import { fetchUserStreak, getLocalDateKey } from "../streaks"
import type { UserStreak } from "../streaks"

type Workout = {
    id: number
    name: string
    created_at: string
}

function WorkoutDash() {
    const [showModal, setShowModal] = useState(false)
    const [workoutName, setWorkoutName] = useState("")
    const [workouts, setWorkouts] = useState<Workout[]>([])
    const [search, setSearch] = useState("")
    const [workoutToDelete, setWorkoutToDelete] = useState<Workout | null>(null)
    const [deletingWorkoutId, setDeletingWorkoutId] = useState<number | null>(null)
    const [creatingWorkout, setCreatingWorkout] = useState(false)
    const [streak, setStreak] = useState<UserStreak | null>(null)
    const navigate = useNavigate()

    const fetchWorkouts = useCallback(async () => {
        const response = await apiFetch(`${BASEURL}/workout/workout-dash`,
            {
                method:"GET",
                credentials:"include",
                headers: {"Content-Type": "application/json"}
            }
        )

        if (response.status === 404) {
            setWorkouts([])

            return
        }

        const data = await response.json()
        setWorkouts(data.data || [])
    }, [])

    useEffect(() => {
        const loadPage = async () => {
            const [, streakData] = await Promise.all([
                fetchWorkouts(),
                fetchUserStreak()
            ])

            setStreak(streakData)
        }

        loadPage()
    }, [fetchWorkouts])

    const filteredWorkouts = useMemo(() => {
        return workouts.filter((workout) =>
            workout.name.toLowerCase().includes(search.toLowerCase())
        )
    }, [workouts, search])

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        })
    }

    const handleWorkoutSubmit = async () => {
        if (!workoutName.trim() || creatingWorkout) {
            return
        }

        setCreatingWorkout(true)

        const response = await apiFetch(`${BASEURL}/workout/create-workout`,
            {
                method: "POST",
                credentials:"include",
                headers:{"Content-Type":"application/json"},
                body: JSON.stringify({
                    workoutName:workoutName.trim(),
                    activityDate:getLocalDateKey()
                })
            }
        )

        const data = await response.json()
        const createdWorkout = data.data?.[0]

        if (data.streak) {
            setStreak(data.streak)
        }

        setWorkoutName("")
        setShowModal(false)
        setCreatingWorkout(false)

        if (createdWorkout?.id) {
            navigate(`/workoutDash/workoutDetail/${createdWorkout.id}`)

            return
        }

        await fetchWorkouts()
    }

    const handleWorkoutDelete = async () => {
        if (!workoutToDelete) {
            return
        }

        setDeletingWorkoutId(workoutToDelete.id)

        await apiFetch(`${BASEURL}/workout/deleteWorkout/${workoutToDelete.id}`,
            {
                method:"DELETE",
                credentials:"include",
                headers:{"Content-Type":"application/json"}
            }
        )

        await fetchWorkouts()
        setWorkoutToDelete(null)
        setDeletingWorkoutId(null)
    }

    return (
        <div className="min-h-screen bg-[#171B1F] text-[#F8FAFC] md:pl-64">
            <Navbar />

            <main className="mx-auto w-full max-w-7xl px-4 pb-6 pt-16 md:px-8 md:py-8">
                <section className="mb-6 overflow-hidden rounded-[28px] border border-[#2A3138] bg-[#1E242B] shadow-2xl shadow-black/20">
                    <div className="flex flex-col gap-7 p-5 sm:p-6 md:flex-row md:items-center md:justify-between md:p-8">
                        <div>
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#2DDE85]/25 bg-[#2DDE85]/10 px-3 py-1 text-sm font-medium text-[#2DDE85]">
                                <Dumbbell size={16} />
                                Training log
                            </div>

                            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                                Workout Tracker
                            </h1>

                            <p className="mt-2 max-w-xl text-sm leading-6 text-[#94A3B8] md:text-base">
                                Build routines, track sessions, and keep every lift organized.
                            </p>
                        </div>

                        <button
                            onClick={() => setShowModal(true)}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2DDE85] px-5 py-3 font-semibold text-black shadow-lg shadow-[#2DDE85]/20 transition hover:bg-[#25C876] sm:w-auto"
                        >
                            <Plus size={18} />
                            New Workout
                        </button>
                    </div>
                </section>

                <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                    <div className="col-span-2 rounded-[22px] border border-[#2A3138] bg-[#1E242B] p-4 shadow-xl shadow-black/10 md:col-span-1 md:rounded-[24px] md:p-5">
                        <p className="text-sm font-medium text-[#94A3B8]">Total workouts</p>
                        <p className="mt-2 text-2xl font-bold text-white md:mt-3 md:text-3xl">{workouts.length}</p>
                    </div>

                    <div className="rounded-[22px] border border-[#2A3138] bg-[#1E242B] p-4 shadow-xl shadow-black/10 md:rounded-[24px] md:p-5">
                        <p className="text-sm font-medium text-[#94A3B8]">Latest session</p>
                        <p className="mt-2 truncate text-lg font-bold text-white md:mt-3 md:text-xl">
                            {workouts[0] ? workouts[0].name : "None yet"}
                        </p>
                    </div>

                    <div className="rounded-[22px] border border-[#2DDE85]/25 bg-[#2DDE85]/8 p-4 shadow-xl shadow-black/10 md:rounded-[24px] md:p-5">
                        <p className="text-sm font-medium text-[#94A3B8]">Current streak</p>
                        <p className="mt-2 inline-flex items-center gap-2 text-2xl font-bold text-white md:mt-3 md:text-3xl">
                            <Flame size={20} className="text-[#2DDE85]" />
                            {streak?.current_workout_streak || 0}
                        </p>
                        <p className="mt-1 text-xs text-[#6B7280]">consecutive days</p>
                    </div>

                    <div className="rounded-[22px] border border-[#2A3138] bg-[#1E242B] p-4 shadow-xl shadow-black/10 md:rounded-[24px] md:p-5">
                        <p className="text-sm font-medium text-[#94A3B8]">Best streak</p>
                        <p className="mt-2 inline-flex items-center gap-2 text-2xl font-bold text-white md:mt-3 md:text-3xl">
                            <Trophy size={20} className="text-[#2DDE85]" />
                            {streak?.best_workout_streak || 0}
                        </p>
                        <p className="mt-1 text-xs text-[#6B7280]">personal best</p>
                    </div>
                </section>

                <section className="rounded-[28px] border border-[#2A3138] bg-[#1E242B] p-5 shadow-xl shadow-black/10 md:p-6">
                    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                Your Workouts
                            </h2>
                            <p className="mt-1 text-sm text-[#6B7280]">
                                Select a workout to view exercises and sets.
                            </p>
                        </div>

                        <div className="relative w-full lg:max-w-sm">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search workouts..."
                                className="w-full rounded-2xl border border-[#313A45] bg-[#171B1F] py-3 pl-11 pr-4 text-white outline-none transition placeholder:text-[#6B7280] focus:border-[#2DDE85]"
                            />
                        </div>
                    </div>

                    {filteredWorkouts.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-[#313A45] bg-[#171B1F] px-6 py-14 text-center">
                            <p className="font-semibold text-white">
                                No workouts found.
                            </p>
                            <p className="mt-2 text-sm text-[#6B7280]">
                                Create your first workout to start logging exercises.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {filteredWorkouts.map((workout) => (
                                <div
                                    key={workout.id}
                                    role="button"
                                    tabIndex={0}
                                    className="group cursor-pointer rounded-[24px] border border-[#2A3138] bg-[#171B1F] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#2DDE85] hover:shadow-xl hover:shadow-black/20"
                                    onClick={() => {
                                        navigate(`workoutDetail/${workout.id}`)
                                    }}
                                    onKeyDown={(event) => {
                                        if (event.target !== event.currentTarget) {
                                            return
                                        }

                                        if (event.key === "Enter" || event.key === " ") {
                                            navigate(`workoutDetail/${workout.id}`)
                                        }
                                    }}
                                >
                                    <div className="mb-5 flex items-start justify-between gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2DDE85]/10 text-[#2DDE85] transition group-hover:bg-[#2DDE85] group-hover:text-black">
                                            <Dumbbell size={22} />
                                        </div>

                                        <button
                                            onClick={(event) => {
                                                event.stopPropagation()
                                                setWorkoutToDelete(workout)
                                            }}
                                            className="rounded-xl border border-[#313A45] p-2.5 text-[#94A3B8] transition hover:border-red-400/60 hover:bg-red-500/10 hover:text-red-300"
                                            aria-label={`Delete ${workout.name}`}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    <h3 className="text-xl font-bold text-white">
                                        {workout.name}
                                    </h3>

                                    <div className="mt-4 flex items-center text-sm">
                                        <span className="inline-flex items-center gap-1 text-[#6B7280]">
                                            <CalendarDays size={14} />
                                            {formatDate(workout.created_at)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-[#313A45] bg-[#1E242B] shadow-2xl shadow-black/40">
                        <div className="flex items-start justify-between border-b border-[#2A3138] px-6 py-5">
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    Create Workout
                                </h2>

                                <p className="mt-1 text-sm text-[#6B7280]">
                                    Give your new session a clear name.
                                </p>
                            </div>

                            <button
                                onClick={() => setShowModal(false)}
                                className="rounded-xl p-2 text-[#94A3B8] transition hover:bg-[#171B1F] hover:text-white"
                                aria-label="Close modal"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <div className="p-6">
                            <input
                                type="text"
                                placeholder="Push Day"
                                value={workoutName}
                                onChange={(e) => setWorkoutName(e.target.value)}
                                className="w-full rounded-2xl border border-[#313A45] bg-[#171B1F] px-4 py-3 text-white outline-none transition placeholder:text-[#6B7280] focus:border-[#2DDE85]"
                            />

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowModal(false)}
                                    disabled={creatingWorkout}
                                    className="rounded-xl border border-[#313A45] px-4 py-2 font-medium text-[#AAB4C0] transition hover:bg-[#171B1F] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={handleWorkoutSubmit}
                                    disabled={creatingWorkout || !workoutName.trim()}
                                    className="rounded-xl bg-[#2DDE85] px-5 py-2 font-semibold text-black transition hover:bg-[#25C876] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {creatingWorkout ? "Creating..." : "Create"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {workoutToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-[28px] border border-[#313A45] bg-[#1E242B] p-6 shadow-2xl shadow-black/40">
                        <h2 className="text-xl font-bold text-white">
                            Delete workout?
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                            This will delete <span className="font-semibold text-white">{workoutToDelete.name}</span> and its logged exercises and sets.
                        </p>

                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                            <button
                                onClick={() => setWorkoutToDelete(null)}
                                disabled={deletingWorkoutId === workoutToDelete.id}
                                className="rounded-xl border border-[#313A45] px-4 py-2 font-medium text-[#AAB4C0] transition hover:bg-[#171B1F] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleWorkoutDelete}
                                disabled={deletingWorkoutId === workoutToDelete.id}
                                className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {deletingWorkoutId === workoutToDelete.id ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default WorkoutDash
