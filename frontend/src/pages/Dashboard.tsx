import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
    Activity,
    ArrowRight,
    Dumbbell,
    Flame,
    Quote,
    Target,
    Utensils
} from "lucide-react"
import Navbar from "../components/Navbar"
import { BASEURL, apiFetch } from "../URL"

type UserProfile = {
    first_name: string
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

function Dashboard () {
    const navigate = useNavigate()
    const [user, setUser] = useState<UserProfile | null>(null)
    const [nutritionProfile, setNutritionProfile] = useState<NutritionProfile | null>(null)
    const [workouts, setWorkouts] = useState<Workout[]>([])
    const [quoteIndex, setQuoteIndex] = useState(0)

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
    }, [])

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

    const latestWorkout = workouts[0]
    const goalName = nutritionProfile?.goal_selection
        ? nutritionProfile.goal_selection.charAt(0).toUpperCase() + nutritionProfile.goal_selection.slice(1)
        : "Set profile"

    const macroSummary = nutritionProfile
        ? `${nutritionProfile.protein}g protein / ${nutritionProfile.carbs}g carbs / ${nutritionProfile.fats}g fat`
        : "Create a nutrition profile to unlock goals"

    return (
        <div className="min-h-screen bg-[#171B1F] text-[#F8FAFC] md:pl-64">
            <Navbar />

            <main className="mx-auto w-full max-w-7xl px-4 pb-6 pt-16 md:px-8 md:py-8">
                <section className="mb-6 overflow-hidden rounded-[28px] border border-[#2A3138] bg-[#1E242B] shadow-2xl shadow-black/20">
                    <div className="flex flex-col gap-7 p-5 sm:p-6 md:flex-row md:items-center md:justify-between md:p-8">
                        <div>
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#2DDE85]/25 bg-[#2DDE85]/10 px-3 py-1 text-sm font-medium text-[#2DDE85]">
                                <Activity size={16} />
                                Dashboard
                            </div>

                            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                                Welcome back, {user?.first_name?.trim() || "there"}
                            </h1>

                            <p className="mt-2 max-w-xl text-sm leading-6 text-[#94A3B8] md:text-base">
                                Your training and nutrition are in one place. Keep the day focused and measurable.
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

                <section className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="rounded-[28px] border border-[#2A3138] bg-[#1E242B] p-6 shadow-xl shadow-black/10">
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

                    <div className="rounded-[28px] border border-[#2A3138] bg-[#1E242B] p-6 shadow-xl shadow-black/10">
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
                    <div className="rounded-[22px] border border-[#2A3138] bg-[#1E242B] p-4 shadow-xl shadow-black/10 md:rounded-[24px] md:p-5">
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-medium text-[#94A3B8] md:text-sm">Total workouts</p>
                            <Dumbbell size={18} className="shrink-0 text-[#2DDE85] md:size-5" />
                        </div>
                        <p className="mt-2 text-2xl font-bold text-white md:mt-3 md:text-3xl">{workouts.length}</p>
                    </div>

                    <div className="rounded-[22px] border border-[#2A3138] bg-[#1E242B] p-4 shadow-xl shadow-black/10 md:rounded-[24px] md:p-5">
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-medium text-[#94A3B8] md:text-sm">Latest workout</p>
                            <Flame size={18} className="shrink-0 text-[#2DDE85] md:size-5" />
                        </div>
                        <p className="mt-2 truncate text-lg font-bold text-white md:mt-3 md:text-xl">
                            {latestWorkout ? latestWorkout.name : "No workouts yet"}
                        </p>
                    </div>

                    <div className="col-span-2 rounded-[22px] border border-[#2A3138] bg-[#1E242B] p-4 shadow-xl shadow-black/10 md:rounded-[24px] md:p-5">
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
