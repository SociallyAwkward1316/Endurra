import { useCallback, useEffect, useMemo, useState } from "react"
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Plus,
    Search,
    Trash2,
    X
} from "lucide-react"
import Navbar from "../components/Navbar"
import { BASEURL, apiFetch } from "../URL"

type NutritionTotals = {
    calories: number
    protein: number
    carbs: number
    fats: number
}

type Food = NutritionTotals & {
    id?: number
    fdc_id?: number
    name: string
    brand_name?: string | null
    serving_size?: number | null
    serving_unit?: string | null
}

type FoodEntry = {
    id: number
    servings?: number | null
    Food: Food
}

type DailyLog = {
    id: number
    FoodEntries?: FoodEntry[]
}

type MacroCard = {
    label: string
    value: number
    target: number
    unit: string
}

function CalorieTracker() {
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split("T")[0]
    )
    const [nutritionProfile, setNutritionProfile] = useState<NutritionTotals>({
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0
    })
    const [dailyLog, setDailyLog] = useState<DailyLog | undefined>()
    const [showFoodModal, setShowFoodModal] = useState(false)
    const [foodSearch, setFoodSearch] = useState("")
    const [foodResults, setFoodResults] = useState<Food[]>([])
    const [selectedFood, setSelectedFood] = useState<Food | null>(null)
    const [servings, setServings] = useState("1")
    const [deletingEntryId, setDeletingEntryId] = useState<number | null>(null)
    const [foodAddError, setFoodAddError] = useState("")
    const [addingFood, setAddingFood] = useState(false)

    const formatServing = (food?: Food) => {
        if (!food) {
            return "serving"
        }

        const size = food.serving_size
        const unit = food.serving_unit || "serving"

        if (size === undefined || size === null) {
            return unit
        }

        return `${size} ${unit}`
    }

    const formatDate = (date: string) => {
        return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric"
        })
    }

    const getProgress = (value: number, target: number) => {
        if (!target) {
            return 0
        }

        return Math.min(Math.round((value / target) * 100), 100)
    }

    const fetchLog = useCallback(async (date: string) => {
        const logResponse = await apiFetch(`${BASEURL}/caltracker/getDailyLog/${date}`,
            {
                method:"GET",
                credentials:"include",
                headers:{"Content-Type":"application/json"}
            }
        )

        const logData = await logResponse.json()

        if (logData.log !== undefined){
            setDailyLog(logData.log)
        } else {
            setDailyLog(undefined)
        }
    }, [])

    useEffect(() => {
        const fetchPageData = async () => {
            const profileResponse = await apiFetch(`${BASEURL}/caltracker/getNutritionProfile`,
                {
                    method:"GET",
                    credentials: "include",
                    headers:{"Content-Type":"application/json"}
                }
            )

            const profileData = await profileResponse.json()

            if (
                profileData.nutritionProfile &&
                profileData.nutritionProfile.length > 0
            ) {
                const profile = profileData.nutritionProfile[0]
                setNutritionProfile({
                    calories: profile.calories,
                    protein: profile.protein,
                    carbs: profile.carbs,
                    fats: profile.fats
                })
            }
        }

        const loadLog = async () => {
            await fetchLog(selectedDate)
        }

        fetchPageData()
        loadLog()
    }, [selectedDate, fetchLog])

    useEffect(() => {
        const timeout = setTimeout(async () => {
            if (!foodSearch.trim()) {
                setFoodResults([])

                return
            }

            const response = await apiFetch(`${BASEURL}/caltracker/foodsearch/search?food=${encodeURIComponent(foodSearch)}`,
                {
                    method:"GET",
                    credentials:"include",
                    headers:{"Content-Type":"application/json"}
                }
            )

            const data = await response.json()

            setFoodResults(data.foods || [])
        },300)

        return () => clearTimeout(timeout)
    },[foodSearch])

    const totals = useMemo(() => {
        const entries = dailyLog?.FoodEntries || []

        const nextTotals = entries.reduce<NutritionTotals>(
            (sum, entry) => {
                const entryServings = Number(entry.servings) || 1
                const food = entry.Food || {}

                return {
                    calories: sum.calories + (Number(food.calories) || 0) * entryServings,
                    protein: sum.protein + (Number(food.protein) || 0) * entryServings,
                    carbs: sum.carbs + (Number(food.carbs) || 0) * entryServings,
                    fats: sum.fats + (Number(food.fats) || 0) * entryServings
                }
            },
            {
                calories: 0,
                protein: 0,
                carbs: 0,
                fats: 0
            }
        )

        return {
            calories: Math.round(nextTotals.calories),
            protein: Math.round(nextTotals.protein),
            carbs: Math.round(nextTotals.carbs),
            fats: Math.round(nextTotals.fats)
        }
    }, [dailyLog])

    const macroCards: MacroCard[] = [
        {
            label: "Protein",
            value: totals.protein,
            target: nutritionProfile.protein,
            unit: "g"
        },
        {
            label: "Carbs",
            value: totals.carbs,
            target: nutritionProfile.carbs,
            unit: "g"
        },
        {
            label: "Fat",
            value: totals.fats,
            target: nutritionProfile.fats,
            unit: "g"
        }
    ]

    const remainingCalories = Math.max(nutritionProfile.calories - totals.calories, 0)
    const calorieProgress = getProgress(totals.calories, nutritionProfile.calories)

    const changeDay = (amount: number) => {
        const date = new Date(`${selectedDate}T00:00:00`)

        date.setDate(date.getDate() + amount)

        setSelectedDate(
            date.toISOString().split("T")[0]
        )
    }

    const closeFoodModal = () => {
        setShowFoodModal(false)
        setSelectedFood(null)
        setServings("1")
        setFoodAddError("")
    }

    const openFoodModal = () => {
        setShowFoodModal(true)
        setSelectedFood(null)
        setServings("1")
        setFoodAddError("")
    }

    const handleFoodClick = (food: Food) => {
        setSelectedFood(food)
        setServings("1")
        setFoodAddError("")
    }

    const handleAddFood = async () => {
        if (!selectedFood) {
            return
        }

        setFoodAddError("")

        const servingAmount = Number(servings)

        if (!Number.isFinite(servingAmount) || servingAmount <= 0) {
            setFoodAddError("Enter a valid serving amount.")
            return
        }

        setAddingFood(true)

        try {
            let logId = dailyLog?.id

            if (!dailyLog?.id) {
                const response = await apiFetch(`${BASEURL}/caltracker/createUserLog`,
                    {
                        method:"POST",
                        credentials:"include",
                        headers:{"Content-Type":"application/json"},
                        body:JSON.stringify({
                            logDate: selectedDate
                        })
                    }
                )

                const data = await response.json()

                if (!response.ok) {
                    setFoodAddError(data.message || "Could not create today's food log.")

                    return
                }

                setDailyLog(data.log)
                logId = data.log?.id
            }

            const response = await apiFetch(`${BASEURL}/caltracker/addFoodToLog`,
                {
                    method:"POST",
                    credentials:"include",
                    headers:{"Content-Type":"application/json"},
                    body:JSON.stringify({
                        foodId:selectedFood.id,
                        food:selectedFood,
                        logId,
                        servings:servingAmount
                    })
                }
            )

            const data = await response.json()

            if (!response.ok) {
                setFoodAddError(data.message || "Could not add this food.")

                return
            }

            await fetchLog(selectedDate)
            closeFoodModal()
            setFoodSearch("")
            setFoodResults([])
        } catch {
            setFoodAddError("Could not add this food. Please try again.")
        } finally {
            setAddingFood(false)
        }
    }

    const handleDeleteFoodEntry = async (entryId: number) => {
        setDeletingEntryId(entryId)

        await apiFetch(`${BASEURL}/caltracker/deleteFoodEntry/${entryId}`,
            {
                method:"DELETE",
                credentials:"include",
                headers:{"Content-Type":"application/json"}
            }
        )

        await fetchLog(selectedDate)
        setDeletingEntryId(null)
    }

    return (
        <div className="min-h-screen bg-[#171B1F] text-[#F8FAFC] md:pl-64">
            <Navbar />

            <main className="mx-auto w-full max-w-7xl px-4 pb-6 pt-16 md:px-8 md:py-8">
                <section className="mb-6 overflow-hidden rounded-[28px] border border-[#2A3138] bg-[#1E242B] shadow-2xl shadow-black/20">
                    <div className="flex flex-col gap-7 p-5 sm:p-6 md:flex-row md:items-center md:justify-between md:p-8">
                        <div>
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#2DDE85]/25 bg-[#2DDE85]/10 px-3 py-1 text-sm font-medium text-[#2DDE85]">
                                <CalendarDays size={16} />
                                Daily nutrition
                            </div>

                            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                                Calorie Tracker
                            </h1>

                            <p className="mt-2 max-w-xl text-sm leading-6 text-[#94A3B8] md:text-base">
                                Track meals, servings, and macros with a clean daily view.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="flex items-center justify-between rounded-2xl border border-[#313A45] bg-[#171B1F] p-2">
                                <button
                                    onClick={() => changeDay(-1)}
                                    className="rounded-xl p-2 text-[#CBD5E1] transition hover:bg-[#2A3138] hover:text-white"
                                    aria-label="Previous day"
                                >
                                    <ChevronLeft size={20} />
                                </button>

                                <div className="min-w-40 px-4 text-center">
                                    <p className="text-sm font-semibold text-white">
                                        {formatDate(selectedDate)}
                                    </p>
                                    <p className="text-xs text-[#6B7280]">
                                        {selectedDate}
                                    </p>
                                </div>

                                <button
                                    onClick={() => changeDay(1)}
                                    className="rounded-xl p-2 text-[#CBD5E1] transition hover:bg-[#2A3138] hover:text-white"
                                    aria-label="Next day"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>

                            <button
                                onClick={openFoodModal}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2DDE85] px-5 py-3 font-semibold text-black shadow-lg shadow-[#2DDE85]/20 transition hover:bg-[#25C876] sm:w-auto"
                            >
                                <Plus size={18} />
                                Add Food
                            </button>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.05fr_1.95fr] lg:gap-5">
                    <div className="rounded-[24px] border border-[#2A3138] bg-[#1E242B] p-5 shadow-xl shadow-black/10 md:rounded-[28px] md:p-6">
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-[#94A3B8]">
                                Calories remaining
                            </p>

                            <span className="rounded-full bg-[#171B1F] px-2.5 py-1 text-xs font-semibold text-[#2DDE85]">
                                {calorieProgress}%
                            </span>
                        </div>

                        <div className="mt-3 flex items-end gap-2 md:mt-4">
                            <span className="text-4xl font-bold text-white md:text-5xl">
                                {remainingCalories}
                            </span>
                            <span className="pb-2 text-sm text-[#6B7280]">
                                cal
                            </span>
                        </div>

                        <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#171B1F] md:mt-6">
                            <div
                                className="h-full rounded-full bg-[#2DDE85] transition-all"
                                style={{ width: `${calorieProgress}%` }}
                            />
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                            <span className="text-[#94A3B8]">
                                {totals.calories} eaten
                            </span>
                            <span className="font-medium text-white">
                                {nutritionProfile.calories} goal
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 md:gap-4">
                        {macroCards.map((macro) => (
                            <div
                                key={macro.label}
                                className="rounded-[18px] border border-[#2A3138] bg-[#1E242B] p-3 shadow-xl shadow-black/10 md:rounded-[24px] md:p-5"
                            >
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <h3 className="text-xs font-medium text-[#94A3B8] md:text-sm">
                                        {macro.label}
                                    </h3>
                                    <span className="w-fit rounded-full bg-[#171B1F] px-2 py-0.5 text-[11px] font-semibold text-[#2DDE85] md:px-2.5 md:py-1 md:text-xs">
                                        {getProgress(macro.value, macro.target)}%
                                    </span>
                                </div>

                                <p className="mt-3 text-xl font-bold text-white md:mt-4 md:text-3xl">
                                    {macro.value}{macro.unit}
                                </p>

                                <p className="mt-1 text-xs text-[#6B7280] md:text-sm">
                                    of {macro.target}{macro.unit}
                                </p>

                                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#171B1F] md:mt-5 md:h-2">
                                    <div
                                        className="h-full rounded-full bg-[#2DDE85] transition-all"
                                        style={{ width: `${getProgress(macro.value, macro.target)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mt-6 rounded-[28px] border border-[#2A3138] bg-[#1E242B] p-5 shadow-xl shadow-black/10 md:p-6">
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                Food Entries
                            </h2>
                            <p className="mt-1 text-sm text-[#6B7280]">
                                {dailyLog?.FoodEntries?.length || 0} items logged for this day
                            </p>
                        </div>

                        <button
                            onClick={openFoodModal}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#313A45] px-4 py-2 text-sm font-semibold text-[#CBD5E1] transition hover:border-[#2DDE85] hover:text-[#2DDE85]"
                        >
                            <Plus size={16} />
                            Add item
                        </button>
                    </div>

                    {!dailyLog?.FoodEntries?.length ? (
                        <div className="rounded-2xl border border-dashed border-[#313A45] bg-[#171B1F] px-6 py-12 text-center">
                            <p className="font-semibold text-white">
                                No food logged yet.
                            </p>
                            <p className="mt-2 text-sm text-[#6B7280]">
                                Add your first meal to start building today&apos;s totals.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {dailyLog.FoodEntries.map((entry: FoodEntry) => {
                                const entryServings = Number(entry.servings) || 1
                                const calories = Math.round((Number(entry.Food.calories) || 0) * entryServings)
                                const protein = Math.round((Number(entry.Food.protein) || 0) * entryServings)
                                const carbs = Math.round((Number(entry.Food.carbs) || 0) * entryServings)
                                const fats = Math.round((Number(entry.Food.fats) || 0) * entryServings)

                                return (
                                    <div
                                        key={entry.id}
                                        className="grid gap-4 rounded-2xl border border-[#2A3138] bg-[#171B1F] p-4 transition hover:border-[#313A45] md:grid-cols-[1fr_auto_auto] md:items-center"
                                    >
                                        <div className="min-w-0">
                                            <h3 className="truncate font-semibold text-white">
                                                {entry.Food.name}
                                            </h3>

                                            <p className="mt-1 text-sm text-[#6B7280]">
                                                {entryServings} x {formatServing(entry.Food)} serving
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-4 gap-3 text-center text-sm md:min-w-[360px]">
                                            <div className="rounded-xl bg-[#1E242B] px-3 py-2">
                                                <p className="font-semibold text-white">{calories}</p>
                                                <p className="text-xs text-[#6B7280]">Cal</p>
                                            </div>
                                            <div className="rounded-xl bg-[#1E242B] px-3 py-2">
                                                <p className="font-semibold text-white">{protein}g</p>
                                                <p className="text-xs text-[#6B7280]">Protein</p>
                                            </div>
                                            <div className="rounded-xl bg-[#1E242B] px-3 py-2">
                                                <p className="font-semibold text-white">{carbs}g</p>
                                                <p className="text-xs text-[#6B7280]">Carbs</p>
                                            </div>
                                            <div className="rounded-xl bg-[#1E242B] px-3 py-2">
                                                <p className="font-semibold text-white">{fats}g</p>
                                                <p className="text-xs text-[#6B7280]">Fat</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleDeleteFoodEntry(entry.id)}
                                            disabled={deletingEntryId === entry.id}
                                            className="inline-flex items-center justify-center rounded-xl border border-[#313A45] p-3 text-[#94A3B8] transition hover:border-red-400/60 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                                            aria-label={`Delete ${entry.Food.name}`}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </section>
            </main>

            {showFoodModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-[#313A45] bg-[#1E242B] shadow-2xl shadow-black/40">
                        <div className="flex items-center justify-between border-b border-[#2A3138] px-6 py-5">
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    Add Food
                                </h2>
                                <p className="mt-1 text-sm text-[#6B7280]">
                                    Search foods and choose a serving size.
                                </p>
                            </div>

                            <button
                                onClick={closeFoodModal}
                                className="rounded-xl p-2 text-[#94A3B8] transition hover:bg-[#171B1F] hover:text-white"
                                aria-label="Close modal"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <div className="p-6">
                            {!selectedFood && (
                                <div className="relative">
                                    <Search
                                        size={18}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]"
                                    />
                                    <input
                                        value={foodSearch}
                                        onChange={(e) => setFoodSearch(e.target.value)}
                                        placeholder="Search foods..."
                                        className="w-full rounded-2xl border border-[#313A45] bg-[#171B1F] py-3 pl-11 pr-4 text-white outline-none transition placeholder:text-[#6B7280] focus:border-[#2DDE85]"
                                    />
                                </div>
                            )}

                            <div className="mt-5 max-h-[430px] overflow-y-auto pr-1">
                                {selectedFood ? (
                                    <div className="space-y-5">
                                        <button
                                            onClick={() => setSelectedFood(null)}
                                            className="inline-flex items-center gap-2 text-sm font-medium text-[#94A3B8] transition hover:text-white"
                                        >
                                            <ChevronLeft size={16} />
                                            Back to results
                                        </button>

                                        <div className="rounded-2xl border border-[#313A45] bg-[#171B1F] p-5">
                                            <h3 className="text-xl font-semibold text-white">
                                                {selectedFood.name}
                                            </h3>

                                            {selectedFood.brand_name && (
                                                <p className="mt-1 text-sm text-[#6B7280]">
                                                    {selectedFood.brand_name}
                                                </p>
                                            )}

                                            <div className="mt-5 rounded-2xl bg-[#1E242B] p-4">
                                                <p className="text-sm font-medium text-[#94A3B8]">
                                                    Serving unit
                                                </p>
                                                <p className="mt-1 text-lg font-semibold text-white">
                                                    1 serving = {formatServing(selectedFood)}
                                                </p>
                                            </div>

                                            <label className="mt-5 block text-sm font-medium text-[#CBD5E1]">
                                                Number of servings
                                            </label>

                                            <input
                                                type="number"
                                                min="0.25"
                                                step="0.25"
                                                value={servings}
                                                onChange={(e) => setServings(e.target.value)}
                                                className="mt-2 w-full rounded-2xl border border-[#313A45] bg-[#1E242B] px-4 py-3 text-white outline-none transition focus:border-[#2DDE85]"
                                            />

                                            <div className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                                                <div className="rounded-xl bg-[#1E242B] p-3">
                                                    <p className="font-semibold text-white">{Math.round((Number(selectedFood.calories) || 0) * (Number(servings) || 0))}</p>
                                                    <p className="text-xs text-[#6B7280]">Calories</p>
                                                </div>
                                                <div className="rounded-xl bg-[#1E242B] p-3">
                                                    <p className="font-semibold text-white">{Math.round((Number(selectedFood.protein) || 0) * (Number(servings) || 0))}g</p>
                                                    <p className="text-xs text-[#6B7280]">Protein</p>
                                                </div>
                                                <div className="rounded-xl bg-[#1E242B] p-3">
                                                    <p className="font-semibold text-white">{Math.round((Number(selectedFood.carbs) || 0) * (Number(servings) || 0))}g</p>
                                                    <p className="text-xs text-[#6B7280]">Carbs</p>
                                                </div>
                                                <div className="rounded-xl bg-[#1E242B] p-3">
                                                    <p className="font-semibold text-white">{Math.round((Number(selectedFood.fats) || 0) * (Number(servings) || 0))}g</p>
                                                    <p className="text-xs text-[#6B7280]">Fat</p>
                                                </div>
                                            </div>
                                        </div>

                                        {foodAddError && (
                                            <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                                                {foodAddError}
                                            </div>
                                        )}

                                        <button
                                            onClick={handleAddFood}
                                            disabled={addingFood || !Number.isFinite(Number(servings)) || Number(servings) <= 0}
                                            className="w-full rounded-2xl bg-[#2DDE85] py-3 font-semibold text-black shadow-lg shadow-[#2DDE85]/20 transition hover:bg-[#25C876] disabled:cursor-not-allowed disabled:bg-[#334155] disabled:text-[#94A3B8]"
                                        >
                                            {addingFood ? "Adding..." : "Add Food"}
                                        </button>
                                    </div>
                                ) : foodResults.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-[#313A45] bg-[#171B1F] px-6 py-14 text-center">
                                        <p className="font-semibold text-white">
                                            Search for a food to add.
                                        </p>
                                        <p className="mt-2 text-sm text-[#6B7280]">
                                            Results will include calories, macros, and serving units.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {foodResults.map((food) => (
                                            <button
                                                key={food.id || food.fdc_id || food.name}
                                                className="w-full rounded-2xl border border-transparent bg-[#171B1F] p-4 text-left transition hover:border-[#2DDE85]"
                                                onClick={()=>{handleFoodClick(food)}}
                                            >
                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                    <div>
                                                        <div className="font-semibold text-white">
                                                            {food.name}
                                                        </div>

                                                        {food.brand_name && (
                                                            <p className="mt-1 text-sm text-[#6B7280]">
                                                                {food.brand_name}
                                                            </p>
                                                        )}

                                                        <p className="mt-2 text-sm text-[#94A3B8]">
                                                            {food.calories} cal per {formatServing(food)}
                                                        </p>
                                                    </div>

                                                    <div className="flex gap-2 text-xs text-[#CBD5E1]">
                                                        <span className="rounded-full bg-[#1E242B] px-2.5 py-1">{food.protein}P</span>
                                                        <span className="rounded-full bg-[#1E242B] px-2.5 py-1">{food.carbs}C</span>
                                                        <span className="rounded-full bg-[#1E242B] px-2.5 py-1">{food.fats}F</span>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default CalorieTracker
