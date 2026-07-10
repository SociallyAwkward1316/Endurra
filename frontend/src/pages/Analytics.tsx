import { useCallback, useEffect, useMemo, useState } from "react"
import { BarChart, LineChart, RadarChart } from "@mui/x-charts"
import {
    ArrowLeft,
    ArrowRight,
    ChartColumn,
    Dumbbell,
    Gauge,
    Search,
    Sparkles,
    Target,
    Trophy
} from "lucide-react"
import { useNavigate, useParams } from "react-router-dom"
import Navbar from "../components/Navbar"
import { BASEURL, apiFetch } from "../URL"

type MuscleFocus = {
    group: string
    sets: number
    exercises: number
    volume: number
}

type ExerciseSummary = {
    id: number
    name: string
    muscleGroup: string
    totalSets: number
    totalReps: number
    bestWeight: number
    totalVolume: number
    sessions: number
    lastPerformed: string | null
}

type AnalyticsOverview = {
    focus: MuscleFocus[]
    exercises: ExerciseSummary[]
    totals: {
        totalExercises: number
        totalSets: number
        totalVolume: number
        favoriteGroup: string | null
    }
}

type ProgressionPoint = {
    workoutId: number
    workoutName: string
    date: string
    sets: number
    totalReps: number
    bestWeight: number
    volume: number
}

type ExerciseSet = {
    id: number
    workoutId: number
    workoutName: string
    date: string
    setNumber: number
    weight: number
    reps: number
    volume: number
}

type ExerciseAnalytics = {
    exercise: {
        id: number
        name: string
        muscleGroup: string
    }
    totals: {
        totalSets: number
        totalReps: number
        bestWeight: number
        totalVolume: number
    }
    progression: ProgressionPoint[]
    sets: ExerciseSet[]
}

const chartSx = {
    "& text": {
        fill: "#94A3B8 !important",
        fontSize: 12,
    },
    "& .MuiChartsAxis-line": {
        stroke: "#313A45",
    },
    "& .MuiChartsAxis-tick": {
        stroke: "#313A45",
    },
    "& .MuiChartsGrid-line": {
        stroke: "#2A3138",
        strokeDasharray: "4 6",
    },
}

function Analytics() {
    const navigate = useNavigate()
    const { exerciseId } = useParams()
    const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
    const [exerciseAnalytics, setExerciseAnalytics] = useState<ExerciseAnalytics | null>(null)
    const [search, setSearch] = useState("")
    const [loading, setLoading] = useState(true)
    const [detailLoading, setDetailLoading] = useState(false)

    const fetchOverview = useCallback(async () => {
        setLoading(true)

        const response = await apiFetch(`${BASEURL}/analytics/overview`, {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" }
        })

        const data = await response.json()
        setOverview(data.data || null)
        setLoading(false)
    }, [])

    const fetchExerciseAnalytics = useCallback(async (selectedExerciseId: string) => {
        setDetailLoading(true)

        const response = await apiFetch(`${BASEURL}/analytics/exercise/${selectedExerciseId}`, {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" }
        })

        if (response.status === 404) {
            setExerciseAnalytics(null)
            setDetailLoading(false)

            return
        }

        const data = await response.json()
        setExerciseAnalytics(data.data || null)
        setDetailLoading(false)
    }, [])

    useEffect(() => {
        const loadOverview = async () => {
            await fetchOverview()
        }

        loadOverview()
    }, [fetchOverview])

    useEffect(() => {
        const loadExerciseAnalytics = async () => {
            if (!exerciseId) {
                setExerciseAnalytics(null)

                return
            }

            await fetchExerciseAnalytics(exerciseId)
        }

        loadExerciseAnalytics()
    }, [exerciseId, fetchExerciseAnalytics])

    const focus = overview?.focus || []
    const hasFocusData = focus.some((group) => group.sets > 0)
    const maxRadarValue = Math.max(...focus.map((group) => group.sets), 5)

    const filteredExercises = useMemo(() => {
        const exercises = overview?.exercises || []
        const normalizedSearch = search.trim().toLowerCase()

        if (!normalizedSearch) {
            return exercises
        }

        return exercises.filter((exercise) =>
            `${exercise.name} ${exercise.muscleGroup}`.toLowerCase().includes(normalizedSearch)
        )
    }, [overview, search])

    const topExercise = overview?.exercises[0]

    const progression = useMemo(() => {
        return (exerciseAnalytics?.progression || [])
            .slice()
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    }, [exerciseAnalytics])

    const sortedSets = useMemo(() => {
        return (exerciseAnalytics?.sets || [])
            .slice()
            .sort((a, b) => {
                const dateComparison = new Date(a.date).getTime() - new Date(b.date).getTime()

                if (dateComparison !== 0) {
                    return dateComparison
                }

                return a.setNumber - b.setNumber
            })
    }, [exerciseAnalytics])

    const recentStrengthSets = sortedSets.slice(-5)
    const strengthSetLabels = recentStrengthSets.map((set) => `${formatShortDate(set.date)} #${set.setNumber}`)
    const strengthSetWeights = recentStrengthSets.map((set) => set.weight)
    const strengthSetDescription = recentStrengthSets.length
        ? `Your last ${recentStrengthSets.length >= 5 ? "5" : recentStrengthSets.length} logged sets for this exercise.`
        : "Add sets for this exercise and your recent strength line will show up here."
    const progressionLabels = progression.map((point) => formatShortDate(point.date))
    const volumeData = progression.map((point) => point.volume)
    const setHistory = sortedSets.slice().reverse()

    if (exerciseId) {
        return (
            <div className="min-h-screen bg-[#171B1F] text-[#F8FAFC] md:pl-64">
                <Navbar />

                <main className="mx-auto w-full max-w-7xl px-4 pb-6 pt-16 md:px-8 md:py-8">
                    <button
                        onClick={() => navigate("/analytics")}
                        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[#94A3B8] transition hover:text-white"
                    >
                        <ArrowLeft size={16} />
                        Back to analytics
                    </button>

                    {detailLoading ? (
                        <div className="rounded-[28px] border border-[#2A3138] bg-[#1E242B] p-8 text-[#94A3B8]">
                            Loading exercise analytics...
                        </div>
                    ) : exerciseAnalytics ? (
                        <>
                            <section className="mb-6 overflow-hidden rounded-[28px] border border-[#2A3138] bg-[#1E242B] shadow-2xl shadow-black/20">
                                <div className="flex flex-col gap-7 p-5 sm:p-6 md:flex-row md:items-center md:justify-between md:p-8">
                                    <div>
                                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#2DDE85]/25 bg-[#2DDE85]/10 px-3 py-1 text-sm font-medium text-[#2DDE85]">
                                            <Trophy size={16} />
                                            Progressive sets
                                        </div>

                                        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                                            {exerciseAnalytics.exercise.name}
                                        </h1>

                                        <p className="mt-2 text-sm leading-6 text-[#94A3B8] md:text-base">
                                            Tracking strength, set volume, and reps across your logged workouts.
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-[#313A45] bg-[#171B1F] px-5 py-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6B7280]">
                                            Focus area
                                        </p>
                                        <p className="mt-2 text-2xl font-bold text-[#2DDE85]">
                                            {exerciseAnalytics.exercise.muscleGroup}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-4">
                                <MetricCard className="col-span-2 xl:col-span-1" label="Best weight" value={`${exerciseAnalytics.totals.bestWeight} lb`} icon={Gauge} />
                                <MetricCard label="Total sets" value={exerciseAnalytics.totals.totalSets.toString()} icon={Dumbbell} />
                                <MetricCard label="Total reps" value={exerciseAnalytics.totals.totalReps.toString()} icon={Target} />
                                <MetricCard className="col-span-2 md:col-span-1" label="Total volume" value={`${formatNumber(exerciseAnalytics.totals.totalVolume)} lb`} icon={ChartColumn} />
                            </section>

                            <section className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                                <div className="rounded-[28px] border border-[#2A3138] bg-[#1E242B] p-5 shadow-xl shadow-black/10 md:p-6">
                                    <div className="mb-4">
                                        <h2 className="text-2xl font-bold text-white">Strength progression</h2>
                                        <p className="mt-1 text-sm text-[#6B7280]">
                                            {strengthSetDescription}
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-[#2A3138] bg-[#171B1F] p-2">
                                        {strengthSetLabels.length ? (
                                            <LineChart
                                                xAxis={[{ scaleType: "point", data: strengthSetLabels }]}
                                                series={[
                                                    {
                                                        data: strengthSetWeights,
                                                        color: "#2DDE85",
                                                        area: true,
                                                        curve: "monotoneX",
                                                        showMark: true,
                                                    },
                                                ]}
                                                height={330}
                                                grid={{ horizontal: true }}
                                                margin={{ left: 46, right: 20, top: 28, bottom: 32 }}
                                                sx={{
                                                    ...chartSx,
                                                    "& .MuiLineElement-root": {
                                                        strokeWidth: 4,
                                                    },
                                                    "& .MuiAreaElement-root": {
                                                        fill: "#2DDE8530",
                                                    },
                                                    "& .MuiMarkElement-root": {
                                                        stroke: "#171B1F",
                                                        strokeWidth: 3,
                                                        fill: "#2DDE85",
                                                    },
                                                }}
                                            />
                                        ) : (
                                            <EmptyChartState title="No sets yet" text="Add sets for this exercise and your progression line will show up here." />
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-[28px] border border-[#2A3138] bg-[#1E242B] p-5 shadow-xl shadow-black/10 md:p-6">
                                    <div className="mb-4">
                                        <h2 className="text-2xl font-bold text-white">Volume by workout</h2>
                                        <p className="mt-1 text-sm text-[#6B7280]">
                                            Weight multiplied by reps for every logged session.
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-[#2A3138] bg-[#171B1F] p-2">
                                        {progressionLabels.length ? (
                                            <BarChart
                                                xAxis={[{ scaleType: "band", data: progressionLabels }]}
                                                series={[{ data: volumeData, color: "#2DDE85" }]}
                                                height={330}
                                                grid={{ horizontal: true }}
                                                margin={{ left: 52, right: 18, top: 28, bottom: 32 }}
                                                sx={chartSx}
                                            />
                                        ) : (
                                            <EmptyChartState title="No volume yet" text="Once sets are logged, this will compare total volume workout by workout." />
                                        )}
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-[28px] border border-[#2A3138] bg-[#1E242B] p-5 shadow-xl shadow-black/10 md:p-6">
                                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">Set history</h2>
                                        <p className="mt-1 text-sm text-[#6B7280]">
                                            Every logged set for this exercise.
                                        </p>
                                    </div>
                                </div>

                                {setHistory.length ? (
                                    <>
                                    <div className="grid grid-cols-1 gap-3 sm:hidden">
                                        {setHistory.map((set) => (
                                            <div
                                                key={set.id}
                                                className="rounded-2xl border border-[#2A3138] bg-[#171B1F] p-4"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="font-semibold text-white">{set.workoutName}</p>
                                                        <p className="mt-1 text-sm text-[#6B7280]">{formatShortDate(set.date)}</p>
                                                    </div>

                                                    <span className="rounded-full bg-[#2DDE85]/10 px-3 py-1 text-xs font-semibold text-[#2DDE85]">
                                                        Set #{set.setNumber}
                                                    </span>
                                                </div>

                                                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                                                    <div>
                                                        <p className="text-xs text-[#6B7280]">Weight</p>
                                                        <p className="mt-1 font-bold text-white">{set.weight} lb</p>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs text-[#6B7280]">Reps</p>
                                                        <p className="mt-1 font-bold text-white">{set.reps}</p>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs text-[#6B7280]">Volume</p>
                                                        <p className="mt-1 font-bold text-white">{formatNumber(set.volume)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="hidden overflow-hidden rounded-2xl border border-[#2A3138] sm:block">
                                        <div className="grid grid-cols-5 bg-[#171B1F] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
                                            <span>Workout</span>
                                            <span>Date</span>
                                            <span>Set</span>
                                            <span>Weight</span>
                                            <span>Reps</span>
                                        </div>

                                        {setHistory.map((set) => (
                                            <div
                                                key={set.id}
                                                className="grid grid-cols-5 border-t border-[#2A3138] px-4 py-4 text-sm text-[#CBD5E1]"
                                            >
                                                <span className="truncate font-semibold text-white">{set.workoutName}</span>
                                                <span>{formatShortDate(set.date)}</span>
                                                <span>#{set.setNumber}</span>
                                                <span>{set.weight} lb</span>
                                                <span>{set.reps}</span>
                                            </div>
                                        ))}
                                    </div>
                                    </>
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-[#313A45] bg-[#171B1F] px-6 py-12 text-center">
                                        <p className="font-semibold text-white">No set history yet.</p>
                                        <p className="mt-2 text-sm text-[#6B7280]">
                                            Add sets from the workout tracker to start seeing progression here.
                                        </p>
                                    </div>
                                )}
                            </section>
                        </>
                    ) : (
                        <div className="rounded-[28px] border border-dashed border-[#313A45] bg-[#1E242B] px-6 py-16 text-center">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2DDE85]/10 text-[#2DDE85]">
                                <Search size={26} />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Exercise not found</h2>
                            <p className="mt-2 text-sm text-[#6B7280]">
                                This exercise does not have analytics for your account yet.
                            </p>
                        </div>
                    )}
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
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#2DDE85]/25 bg-[#2DDE85]/10 px-3 py-1 text-sm font-medium text-[#2DDE85]">
                                <Sparkles size={16} />
                                Training analytics
                            </div>

                            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                                Analytics
                            </h1>

                            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#94A3B8] md:text-base">
                                See what muscle groups you naturally focus on, then open any exercise to track progressive sets over time.
                            </p>
                        </div>

                        <button
                            onClick={() => navigate("/workoutDash")}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2DDE85] px-5 py-3 font-semibold text-black shadow-lg shadow-[#2DDE85]/20 transition hover:bg-[#25C876] sm:w-auto"
                        >
                            <Dumbbell size={18} />
                            Log workout
                        </button>
                    </div>
                </section>

                <section className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-4">
                    <MetricCard className="col-span-2 xl:col-span-1" label="Tracked exercises" value={(overview?.totals.totalExercises || 0).toString()} icon={Dumbbell} />
                    <MetricCard label="Total sets" value={(overview?.totals.totalSets || 0).toString()} icon={Target} />
                    <MetricCard label="Main focus" value={overview?.totals.favoriteGroup || "Not enough data"} icon={Trophy} />
                    <MetricCard className="col-span-2 md:col-span-1" label="Total volume" value={`${formatNumber(overview?.totals.totalVolume || 0)} lb`} icon={ChartColumn} />
                </section>

                <section className="mb-6 grid grid-cols-1 gap-5 xl:grid-cols-[0.95fr_1.05fr]">
                    <div className="rounded-[28px] border border-[#2A3138] bg-[#1E242B] p-5 shadow-xl shadow-black/10 md:p-6">
                        <div className="mb-4">
                            <h2 className="text-2xl font-bold text-white">Muscle group focus</h2>
                            <p className="mt-1 text-sm text-[#6B7280]">
                                Radar view based on sets logged across your workouts.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-[#2A3138] bg-[#171B1F] p-2">
                            {loading ? (
                                <div className="flex min-h-[350px] items-center justify-center text-[#94A3B8]">
                                    Loading analytics...
                                </div>
                            ) : hasFocusData ? (
                                <RadarChart
                                    radar={{
                                        metrics: focus.map((group) => group.group),
                                        max: maxRadarValue,
                                        labelGap: 10,
                                    }}
                                    series={[
                                        {
                                            label: "Sets",
                                            data: focus.map((group) => group.sets),
                                            color: "#2DDE85",
                                            fillArea: true,
                                        },
                                    ]}
                                    height={350}
                                    hideLegend
                                    margin={{ left: 40, right: 40, top: 44, bottom: 44 }}
                                    sx={{
                                        ...chartSx,
                                        "& .MuiRadarSeriesPlot-area": {
                                            fillOpacity: 0.28,
                                        },
                                        "& .MuiRadarSeriesPlot-line": {
                                            strokeWidth: 3,
                                        },
                                    }}
                                />
                            ) : (
                                <EmptyChartState
                                    title="Start working out!"
                                    text="Log a few exercises and this radar will show whether you lean toward chest, back, shoulders, arms, or legs."
                                />
                            )}
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-[#2A3138] bg-[#1E242B] p-5 shadow-xl shadow-black/10 md:p-6">
                        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white">Exercise search</h2>
                                <p className="mt-1 text-sm text-[#6B7280]">
                                    Choose an exercise to open the progression dashboard.
                                </p>
                            </div>

                            <div className="relative w-full lg:max-w-sm">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search exercises..."
                                    className="w-full rounded-2xl border border-[#313A45] bg-[#171B1F] py-3 pl-11 pr-4 text-white outline-none transition placeholder:text-[#6B7280] focus:border-[#2DDE85]"
                                />
                            </div>
                        </div>

                        {filteredExercises.length ? (
                            <div className="grid max-h-[430px] grid-cols-1 gap-3 overflow-y-auto pr-1">
                                {filteredExercises.map((exercise) => (
                                    <button
                                        key={exercise.id}
                                        onClick={() => navigate(`/analytics/exercise/${exercise.id}`)}
                                        className="group rounded-[22px] border border-[#2A3138] bg-[#171B1F] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#2DDE85] hover:shadow-xl hover:shadow-black/20"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-lg font-bold text-white">{exercise.name}</p>
                                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#6B7280]">
                                                    <span className="rounded-full bg-[#2DDE85]/10 px-2.5 py-1 text-[#2DDE85]">
                                                        {exercise.muscleGroup}
                                                    </span>
                                                    <span>{exercise.totalSets} sets</span>
                                                    <span>{exercise.sessions} sessions</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="hidden rounded-2xl border border-[#313A45] px-4 py-2 text-right sm:block">
                                                    <p className="text-xs text-[#6B7280]">Best</p>
                                                    <p className="font-bold text-white">{exercise.bestWeight} lb</p>
                                                </div>
                                                <ArrowRight size={18} className="text-[#6B7280] transition group-hover:text-[#2DDE85]" />
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-[#313A45] bg-[#171B1F] px-6 py-14 text-center">
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2DDE85]/10 text-[#2DDE85]">
                                    <Search size={26} />
                                </div>
                                <p className="font-semibold text-white">
                                    {overview?.exercises.length ? "No exercises match that search." : "No exercise history yet."}
                                </p>
                                <p className="mt-2 text-sm text-[#6B7280]">
                                    {overview?.exercises.length
                                        ? "Try a different exercise or muscle group."
                                        : "Add exercises and sets from the workout tracker to unlock analytics."}
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                {topExercise && (
                    <section className="rounded-[28px] border border-[#2A3138] bg-[#1E242B] p-5 shadow-xl shadow-black/10 md:p-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#171B1F] px-3 py-1 text-sm font-medium text-[#2DDE85]">
                                    <Trophy size={16} />
                                    Most logged
                                </div>
                                <h2 className="text-2xl font-bold text-white">{topExercise.name}</h2>
                                <p className="mt-1 text-sm text-[#6B7280]">
                                    {topExercise.totalSets} total sets across {topExercise.sessions} sessions.
                                </p>
                            </div>

                            <button
                                onClick={() => navigate(`/analytics/exercise/${topExercise.id}`)}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#313A45] px-5 py-3 font-semibold text-[#CBD5E1] transition hover:border-[#2DDE85] hover:text-[#2DDE85]"
                            >
                                Open progression
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    </section>
                )}
            </main>
        </div>
    )
}

type MetricCardProps = {
    label: string
    value: string
    icon: React.ComponentType<{ size?: number, className?: string }>
    className?: string
}

function MetricCard({ label, value, icon: Icon, className = "" }: MetricCardProps) {
    return (
        <div className={`${className} rounded-[22px] border border-[#2A3138] bg-[#1E242B] p-4 shadow-xl shadow-black/10 md:rounded-[24px] md:p-5`}>
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-[#94A3B8] md:text-sm">{label}</p>
                <Icon size={18} className="shrink-0 text-[#2DDE85] md:size-5" />
            </div>
            <p className="mt-2 truncate text-xl font-bold text-white md:mt-3 md:text-3xl">{value}</p>
        </div>
    )
}

type EmptyChartStateProps = {
    title: string
    text: string
}

function EmptyChartState({ title, text }: EmptyChartStateProps) {
    return (
        <div className="flex min-h-[330px] flex-col items-center justify-center px-6 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2DDE85]/10 text-[#2DDE85]">
                <Dumbbell size={30} />
            </div>
            <h3 className="text-2xl font-bold text-white">{title}</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#6B7280]">{text}</p>
        </div>
    )
}

function formatShortDate(date: string) {
    return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
    })
}

function formatNumber(value: number) {
    return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 0
    }).format(value)
}

export default Analytics
