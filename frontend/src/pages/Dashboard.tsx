import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
    Activity,
    ArrowRight,
    Clock3,
    Crown,
    Dumbbell,
    Flame,
    Quote,
    RefreshCw,
    ShieldCheck,
    Target,
    TimerReset,
    Utensils
} from "lucide-react"
import Navbar from "../components/Navbar"
import { BASEURL, apiFetch } from "../URL"

type UserProfile = {
    first_name: string
    is_pro?: boolean
}

type NutritionProfile = {
    calories: number
    protein: number
    carbs: number
    fats: number
    weight?: number
    goal_selection?: string
}

type Workout = {
    id: number
    name: string
    created_at: string
}

type MuscleRecovery = {
    muscle: string
    workoutId: number
    workoutName: string
    trainedAt: string
    setCount: number
    recoveryHours: number
    remainingHours: number
    recoveryPercent: number
    readyAt: string
    status: "ready" | "nearly_ready" | "recovering"
}

type RecoveryOverview = {
    workoutCount: number
    muscleRecovery: MuscleRecovery[]
}

const formatWorkoutDate = (date: string) => {
    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) {
        return "Recent workout"
    }

    return new Intl.DateTimeFormat(undefined, {
        month:"short",
        day:"numeric",
        hour:"numeric",
        minute:"2-digit"
    }).format(parsedDate)
}

const recoveryStatus = {
    ready:{
        label:"Ready",
        className:"border-[#2DDE85]/25 bg-[#2DDE85]/10 text-[#55E99A]"
    },
    nearly_ready:{
        label:"Nearly ready",
        className:"border-amber-300/25 bg-amber-300/10 text-amber-200"
    },
    recovering:{
        label:"Recovering",
        className:"border-orange-300/20 bg-orange-300/10 text-orange-200"
    }
}

function Dashboard () {
    const navigate = useNavigate()
    const [user, setUser] = useState<UserProfile | null>(null)
    const [nutritionProfile, setNutritionProfile] = useState<NutritionProfile | null>(null)
    const [workouts, setWorkouts] = useState<Workout[]>([])
    const [recovery, setRecovery] = useState<RecoveryOverview | null>(null)
    const [recoveryLoading, setRecoveryLoading] = useState(false)
    const [recoveryError, setRecoveryError] = useState("")
    const [quoteIndex, setQuoteIndex] = useState(0)

    const fetchRecovery = useCallback(async () => {
        setRecoveryLoading(true)
        setRecoveryError("")

        try {
            const response = await apiFetch(`${BASEURL}/workout/recovery`, {
                method:"GET",
                headers:{"Content-Type":"application/json"}
            })
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || "Could not load muscle recovery.")
            }

            setRecovery(data)
        } catch (error) {
            setRecoveryError(error instanceof Error ? error.message : "Could not load muscle recovery.")
        } finally {
            setRecoveryLoading(false)
        }
    }, [])

    const fetchUser = useCallback(async () => {
        const response = await apiFetch(`${BASEURL}/profile`, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        })

        if (!response.ok) {
            return
        }

        const data = await response.json()
        setUser(data.user || null)

        if (data.user?.is_pro) {
            await fetchRecovery()
        }
    }, [fetchRecovery])

    const fetchNutritionProfile = useCallback(async () => {
        const response = await fetch(`${BASEURL}/caltracker/getNutritionProfile`,
            {
                method:"GET",
                credentials:"include",
                headers:{"Content-Type":"application/json"}
            }
        )

        if (response.status === 204) {
            setNutritionProfile(null)

            return
        }

        const data = await response.json()
        setNutritionProfile(data.nutritionProfile?.[0] || null)
    }, [])

    const fetchWorkouts = useCallback(async () => {
        const response = await fetch(`${BASEURL}/workout/workout-dash`,
            {
                method:"GET",
                credentials:"include",
                headers:{"Content-Type":"application/json"}
            }
        )

        if (response.status === 404) {
            setWorkouts([])

            return
        }

        const data = await response.json()
        const workoutList = data.data || []
        setWorkouts(workoutList)
    }, [])

    useEffect(() => {
        const loadDashboard = async () => {
            await Promise.all([
                fetchUser(),
                fetchNutritionProfile(),
                fetchWorkouts()
            ])
        }

        loadDashboard()
    }, [fetchNutritionProfile, fetchUser, fetchWorkouts])

    const motivationalQuotes = useMemo(() => [
        "The only way we give up is by not starting today.",
        "Small promises kept daily become proof that you are changing.",
        "You do not need a perfect day. You need one honest rep.",
        "Momentum is built quietly. Start, then let the work speak.",
        "A stronger version of you is waiting on today's first choice.",
        "Discipline is just self-respect repeated."
    ], [])

    useEffect(() => {
        const timeout = setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * motivationalQuotes.length)

            setQuoteIndex(randomIndex)
        }, 0)

        return () => clearTimeout(timeout)
    }, [motivationalQuotes])

    const quote = motivationalQuotes[quoteIndex]

    const isPro = user?.is_pro === true
    const latestWorkout = workouts[0]
    const goalName = nutritionProfile?.goal_selection
        ? nutritionProfile.goal_selection.charAt(0).toUpperCase() + nutritionProfile.goal_selection.slice(1)
        : "Set profile"

    const macroSummary = nutritionProfile
        ? `${nutritionProfile.protein}g protein / ${nutritionProfile.carbs}g carbs / ${nutritionProfile.fats}g fat`
        : "Create a nutrition profile to unlock goals"
    const recoveringMuscles = recovery?.muscleRecovery.filter((muscle) => muscle.status !== "ready").length || 0
    const readyMuscles = recovery?.muscleRecovery.filter((muscle) => muscle.status === "ready").length || 0
    const dashboardCardClass = isPro
        ? "border-[#344039] bg-[#1D2521]"
        : "border-[#2A3138] bg-[#1E242B]"

    return (
        <div className="min-h-screen bg-[#171B1F] text-[#F8FAFC] md:pl-64">
            <Navbar />

            <main className="mx-auto w-full max-w-7xl px-4 pb-6 pt-16 md:px-8 md:py-8">
                <section className={`mb-6 overflow-hidden rounded-[28px] border shadow-2xl shadow-black/20 ${
                    isPro
                        ? "border-[#B89A55]/30 bg-[linear-gradient(135deg,#202820_0%,#1E242B_55%,#25241E_100%)]"
                        : "border-[#2A3138] bg-[#1E242B]"
                }`}>
                    <div className="flex flex-col gap-7 p-5 sm:p-6 md:flex-row md:items-center md:justify-between md:p-8">
                        <div>
                            <div className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${
                                isPro
                                    ? "border-[#D7B86D]/30 bg-[#D7B86D]/10 text-[#E7CC8A]"
                                    : "border-[#2DDE85]/25 bg-[#2DDE85]/10 text-[#2DDE85]"
                            }`}>
                                {isPro ? <Crown size={16} /> : <Activity size={16} />}
                                {isPro ? "Endurra Pro dashboard" : "Dashboard"}
                            </div>

                            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                                Welcome back, {user?.first_name?.trim() || "there"}
                            </h1>

                            <p className="mt-2 max-w-xl text-sm leading-6 text-[#94A3B8] md:text-base">
                                {isPro
                                    ? "Your training, nutrition, and estimated muscle readiness are working together in one focused view."
                                    : "Your training and nutrition are in one place. Keep the day focused and measurable."}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:min-w-80 sm:grid-cols-2">
                            <button
                                onClick={() => navigate("/workoutDash")}
                                className="rounded-2xl bg-[#2DDE85] px-4 py-3 text-left font-semibold text-black shadow-lg shadow-[#2DDE85]/20 transition hover:bg-[#25C876]"
                            >
                                <span className="flex items-center gap-2">
                                    <Dumbbell size={18} />
                                    Train
                                </span>
                            </button>

                            <button
                                onClick={() => navigate("/calorieTracker")}
                                className="rounded-2xl border border-[#313A45] bg-[#171B1F] px-4 py-3 text-left font-semibold text-white transition hover:border-[#2DDE85] hover:text-[#2DDE85]"
                            >
                                <span className="flex items-center gap-2">
                                    <Utensils size={18} />
                                    Log food
                                </span>
                            </button>
                        </div>
                    </div>
                </section>

                {isPro && (
                    <section className="relative mb-6 overflow-hidden rounded-[28px] border border-[#2DDE85]/20 bg-[#18211D] p-5 shadow-2xl shadow-black/20 sm:p-6 md:p-7">
                        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#2DDE85]/[0.08] blur-3xl" />

                        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-start gap-3">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#2DDE85]/20 bg-[#2DDE85]/10 text-[#2DDE85]">
                                    <TimerReset size={24} />
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="text-xl font-bold text-white md:text-2xl">Muscle recovery</h2>
                                        <span className="rounded-full border border-[#D7B86D]/20 bg-[#D7B86D]/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#E7CC8A]">
                                            Pro
                                        </span>
                                    </div>
                                    <p className="mt-1 max-w-2xl text-sm leading-6 text-[#8E9B94]">
                                        Estimated readiness from logged sets across up to three of your latest completed workouts. Use how you feel to adjust today&apos;s training.
                                    </p>
                                </div>
                            </div>

                            {!recoveryLoading && !recoveryError && (
                                <div className="flex gap-2">
                                    <div className="rounded-2xl border border-[#2DDE85]/15 bg-black/15 px-3 py-2 text-center">
                                        <p className="text-lg font-bold text-[#55E99A]">{readyMuscles}</p>
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64726B]">Ready</p>
                                    </div>
                                    <div className="rounded-2xl border border-orange-300/15 bg-black/15 px-3 py-2 text-center">
                                        <p className="text-lg font-bold text-orange-200">{recoveringMuscles}</p>
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64726B]">Resting</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {recoveryLoading ? (
                            <div className="relative mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {[0, 1, 2].map((item) => (
                                    <div key={item} className="h-52 animate-pulse rounded-[22px] border border-[#2B3731] bg-[#1C2722]" />
                                ))}
                            </div>
                        ) : recoveryError ? (
                            <div className="relative mt-6 flex flex-col gap-4 rounded-[22px] border border-red-400/15 bg-red-400/5 p-5 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-sm text-red-200">{recoveryError}</p>
                                <button
                                    type="button"
                                    onClick={fetchRecovery}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300/20 px-3 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-300/10"
                                >
                                    <RefreshCw size={15} />
                                    Try again
                                </button>
                            </div>
                        ) : recovery?.muscleRecovery.length ? (
                            <div className="relative mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {recovery.muscleRecovery.map((muscle) => {
                                    const status = recoveryStatus[muscle.status]

                                    return (
                                        <button
                                            type="button"
                                            key={muscle.muscle}
                                            onClick={() => navigate(`/workoutDash/workoutDetail/${muscle.workoutId}`)}
                                            className="group rounded-[22px] border border-[#2B3731] bg-[#1C2722] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#3B5146] hover:bg-[#202D27]"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-lg font-bold text-white">{muscle.muscle}</p>
                                                    <p className="mt-1 text-xs text-[#75827B]">
                                                        {muscle.setCount} logged {muscle.setCount === 1 ? "set" : "sets"} · {muscle.recoveryHours}h estimate
                                                    </p>
                                                </div>
                                                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${status.className}`}>
                                                    {status.label}
                                                </span>
                                            </div>

                                            <div className="mt-6 flex items-end justify-between gap-4">
                                                <div>
                                                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5F6C65]">
                                                        Recovery time
                                                    </p>
                                                    <p className="mt-1 text-2xl font-bold text-white">
                                                        {muscle.remainingHours > 0 ? `${muscle.remainingHours} hrs` : "Ready now"}
                                                    </p>
                                                </div>
                                                <ShieldCheck
                                                    size={26}
                                                    className={muscle.status === "ready" ? "text-[#2DDE85]" : "text-[#64726B]"}
                                                />
                                            </div>

                                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#111814]">
                                                <div
                                                    className={`h-full rounded-full transition-all ${
                                                        muscle.status === "ready"
                                                            ? "bg-[#2DDE85]"
                                                            : "bg-[linear-gradient(90deg,#2DDE85_0%,#E7B75C_100%)]"
                                                    }`}
                                                    style={{width:`${muscle.recoveryPercent}%`}}
                                                />
                                            </div>

                                            <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#2B3731] pt-4">
                                                <div className="min-w-0">
                                                    <p className="truncate text-xs font-semibold text-[#AAB5AF]">{muscle.workoutName}</p>
                                                    <p className="mt-1 text-[11px] text-[#66736C]">{formatWorkoutDate(muscle.trainedAt)}</p>
                                                </div>
                                                <ArrowRight size={16} className="shrink-0 text-[#56635C] transition group-hover:translate-x-1 group-hover:text-[#2DDE85]" />
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="relative mt-6 rounded-[22px] border border-dashed border-[#34443C] bg-black/10 p-7 text-center">
                                <Clock3 size={26} className="mx-auto text-[#2DDE85]" />
                                <h3 className="mt-3 font-bold text-white">Recovery starts with your next logged set</h3>
                                <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-[#7E8B84]">
                                    Complete a workout with logged sets and Endurra will estimate readiness by muscle group here.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => navigate("/workoutDash")}
                                    className="mt-4 rounded-xl bg-[#2DDE85] px-4 py-2.5 text-sm font-bold text-black transition hover:bg-[#25C876]"
                                >
                                    Open workout tracker
                                </button>
                            </div>
                        )}
                    </section>
                )}

                <section className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className={`rounded-[28px] border p-6 shadow-xl shadow-black/10 ${dashboardCardClass}`}>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium text-[#94A3B8]">
                                    Nutrition profile
                                </p>
                                <h2 className="mt-3 text-4xl font-bold text-white">
                                    {nutritionProfile?.calories || 0}
                                    <span className="ml-2 text-base font-medium text-[#6B7280]">cal</span>
                                </h2>
                            </div>

                            <div className="rounded-2xl bg-[#2DDE85]/10 p-3 text-[#2DDE85]">
                                <Target size={24} />
                            </div>
                        </div>

                        <div className="mt-6 rounded-2xl border border-[#2A3138] bg-[#171B1F] p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[#94A3B8]">Current goal</span>
                                <span className="rounded-full bg-[#2DDE85]/10 px-3 py-1 text-sm font-semibold text-[#2DDE85]">
                                    {goalName}
                                </span>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                                <span className="text-sm text-[#94A3B8]">Current weight</span>
                                <span className="font-semibold text-white">
                                    {nutritionProfile?.weight ? `${nutritionProfile.weight} lbs` : "Not set"}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate(nutritionProfile ? "/calorieTracker" : "/createNutritionProfile")}
                            className="mt-5 inline-flex w-full items-center justify-between rounded-2xl border border-[#313A45] px-4 py-3 font-semibold text-[#CBD5E1] transition hover:border-[#2DDE85] hover:text-[#2DDE85]"
                        >
                            {nutritionProfile ? "Open calorie tracker" : "Create nutrition profile"}
                            <ArrowRight size={18} />
                        </button>
                    </div>

                    <div className={`rounded-[28px] border p-6 shadow-xl shadow-black/10 ${dashboardCardClass}`}>
                        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2DDE85]/10 text-[#2DDE85]">
                            <Quote size={24} />
                        </div>

                        <p className="text-xl font-semibold leading-8 text-white">
                            {quote}
                        </p>

                        <p className="mt-5 text-sm text-[#6B7280]">
                            Today&apos;s reminder
                        </p>
                    </div>
                </section>

                <section className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-4">
                    <div className={`rounded-[22px] border p-4 shadow-xl shadow-black/10 md:rounded-[24px] md:p-5 ${dashboardCardClass}`}>
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-medium text-[#94A3B8] md:text-sm">Total workouts</p>
                            <Dumbbell size={18} className="shrink-0 text-[#2DDE85] md:size-5" />
                        </div>
                        <p className="mt-2 text-2xl font-bold text-white md:mt-3 md:text-3xl">{workouts.length}</p>
                    </div>

                    <div className={`rounded-[22px] border p-4 shadow-xl shadow-black/10 md:rounded-[24px] md:p-5 ${dashboardCardClass}`}>
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-medium text-[#94A3B8] md:text-sm">Latest workout</p>
                            <Flame size={18} className="shrink-0 text-[#2DDE85] md:size-5" />
                        </div>
                        <p className="mt-2 truncate text-lg font-bold text-white md:mt-3 md:text-xl">
                            {latestWorkout ? latestWorkout.name : "No workouts yet"}
                        </p>
                    </div>

                    <div className={`col-span-2 rounded-[22px] border p-4 shadow-xl shadow-black/10 md:rounded-[24px] md:p-5 xl:col-span-4 ${dashboardCardClass}`}>
                        <p className="text-xs font-medium text-[#94A3B8] md:text-sm">Macro targets</p>
                        <p className="mt-2 text-base font-bold text-white md:mt-3 md:text-xl">
                            {macroSummary}
                        </p>
                    </div>

                    <button
                        onClick={() => navigate("/workoutDash")}
                        className="col-span-2 rounded-[22px] bg-[#2DDE85] p-4 text-left text-black shadow-xl shadow-[#2DDE85]/10 transition hover:bg-[#25C876] md:rounded-[24px] md:p-5 xl:col-span-4"
                    >
                        <span className="flex items-center justify-between">
                            <span className="text-sm font-semibold">Ready to train?</span>
                            <ArrowRight size={20} />
                        </span>
                        <span className="mt-2 block text-xl font-bold md:mt-3 md:text-2xl">
                            Start Workout
                        </span>
                    </button>
                </section>
            </main>
        </div>
    )
}

export default Dashboard
