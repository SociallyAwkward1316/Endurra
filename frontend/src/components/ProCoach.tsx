import { useEffect, useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
    ArrowRight,
    Bot,
    CalendarCheck2,
    ClipboardCheck,
    Crown,
    LoaderCircle,
    TrendingUp,
    Utensils,
    X
} from "lucide-react"
import { apiFetch, BASEURL } from "../URL"
import { MEMBERSHIP_UPDATED_EVENT } from "../membership"

type AnalysisType = "strength_trend" | "completed_workout" | "weekly_recap" | "daily_macros"

type CoachCard = {
    title: string
    detail: string
}

type StrengthTrendPoint = {
    date: string
    bestWeight: number
    reps: number
    volume: number
}

type StrengthTrendSeries = {
    name: string
    muscleGroup: string
    points: StrengthTrendPoint[]
}

type MacroValues = {
    calories: number
    protein: number
    carbs: number
    fats: number
}

type CoachResult = {
    analysisType: AnalysisType
    title: string
    summary?: string
    insights?: CoachCard[]
    recommendations?: CoachCard[]
    analysis?: string
    chart?: {
        type: "strength_trend"
        series: StrengthTrendSeries[]
    }
    macroSummary?: {
        date: string
        targets: MacroValues
        consumed: MacroValues
        remaining: MacroValues
    }
}

type AnalysisOption = {
    id: AnalysisType
    title: string
    description: string
    icon: LucideIcon
}

const analysisOptions: AnalysisOption[] = [
    {
        id:"strength_trend",
        title:"Strength Trend Analysis",
        description:"See where your lifts are progressing, holding steady, or ready for a change.",
        icon:TrendingUp
    },
    {
        id:"completed_workout",
        title:"Completed Workout Review",
        description:"Get focused feedback on your most recently logged workout and its training volume.",
        icon:ClipboardCheck
    },
    {
        id:"weekly_recap",
        title:"Weekly Coach Recap",
        description:"Review the last seven days of workouts, nutrition consistency, and practical next steps.",
        icon:CalendarCheck2
    },
    {
        id:"daily_macros",
        title:"Today's Macros & Meals",
        description:"See what macros remain today and get food and meal ideas that fit.",
        icon:Utensils
    }
]

const getLocalDate = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
}

const AnalysisContent = ({content}: {content: string}) => (
    <div className="space-y-2 text-sm leading-6 text-[#CBD5E1]">
        {content.split("\n").map((line, index) => {
            const cleanedLine = line.replace(/\*\*/g, "").trim()

            if (!cleanedLine) {
                return <div key={index} className="h-1" />
            }

            if (cleanedLine.startsWith("### ") || cleanedLine.startsWith("## ") || cleanedLine.startsWith("# ")) {
                return (
                    <h4 key={index} className="pt-2 text-base font-bold text-white">
                        {cleanedLine.replace(/^#{1,3}\s+/, "")}
                    </h4>
                )
            }

            if (/^[-*]\s+/.test(cleanedLine)) {
                return (
                    <div key={index} className="flex gap-2.5 pl-1">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2DDE85]" />
                        <p>{cleanedLine.replace(/^[-*]\s+/, "")}</p>
                    </div>
                )
            }

            return <p key={index}>{cleanedLine}</p>
        })}
    </div>
)

const formatNumber = (value: number) => new Intl.NumberFormat(undefined, {
    maximumFractionDigits:1
}).format(value)

const MacroSummary = ({summary}: {summary: NonNullable<CoachResult["macroSummary"]>}) => {
    const macroRows: Array<{key: keyof MacroValues, label: string, unit: string}> = [
        {key:"calories", label:"Calories", unit:"kcal"},
        {key:"protein", label:"Protein", unit:"g"},
        {key:"carbs", label:"Carbs", unit:"g"},
        {key:"fats", label:"Fat", unit:"g"}
    ]

    return (
        <div className="rounded-2xl border border-[#2DDE85]/20 bg-[#111814] p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2DDE85]">Today&apos;s balance</p>
                    <p className="mt-1 text-xs text-[#6B7280]">{summary.date}</p>
                </div>
                <Utensils size={19} className="text-[#2DDE85]" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                {macroRows.map(({key, label, unit}) => {
                    const target = summary.targets[key] || 0
                    const consumed = summary.consumed[key] || 0
                    const remaining = summary.remaining[key] || 0
                    const progress = target > 0 ? Math.min(Math.max((consumed / target) * 100, 0), 100) : 0

                    return (
                        <div key={key} className="rounded-xl border border-[#28312D] bg-[#171B1F] p-3.5">
                            <div className="flex items-baseline justify-between gap-3">
                                <span className="text-xs font-semibold text-[#94A3B8]">{label}</span>
                                <span className={`text-xs font-bold ${remaining >= 0 ? "text-[#2DDE85]" : "text-amber-300"}`}>
                                    {formatNumber(Math.abs(remaining))} {unit} {remaining >= 0 ? "left" : "over"}
                                </span>
                            </div>
                            <div className="mt-2 flex items-end gap-1 text-white">
                                <span className="text-xl font-black">{formatNumber(consumed)}</span>
                                <span className="pb-0.5 text-xs text-[#56616E]">/ {formatNumber(target)} {unit}</span>
                            </div>
                            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#27302C]">
                                <div
                                    className={`h-full rounded-full ${remaining >= 0 ? "bg-[#2DDE85]" : "bg-amber-300"}`}
                                    style={{width:`${progress}%`}}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

const StrengthTrendChart = ({series}: {series: StrengthTrendSeries[]}) => {
    const [selectedName, setSelectedName] = useState(series[0]?.name || "")
    const selectedSeries = series.find((item) => item.name === selectedName) || series[0]

    if (!selectedSeries?.points.length) {
        return null
    }

    const width = 640
    const height = 230
    const padding = {top:20, right:24, bottom:42, left:52}
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom
    const weights = selectedSeries.points.map((point) => point.bestWeight)
    const lowestWeight = Math.min(...weights)
    const highestWeight = Math.max(...weights)
    const weightPadding = Math.max((highestWeight - lowestWeight) * 0.2, 5)
    const minWeight = Math.max(0, Math.floor((lowestWeight - weightPadding) / 5) * 5)
    const maxWeight = Math.max(minWeight + 10, Math.ceil((highestWeight + weightPadding) / 5) * 5)
    const weightRange = maxWeight - minWeight
    const xForIndex = (index: number) => selectedSeries.points.length === 1
        ? padding.left + (chartWidth / 2)
        : padding.left + ((index / (selectedSeries.points.length - 1)) * chartWidth)
    const yForWeight = (weight: number) =>
        padding.top + chartHeight - (((weight - minWeight) / weightRange) * chartHeight)
    const linePoints = selectedSeries.points
        .map((point, index) => `${xForIndex(index)},${yForWeight(point.bestWeight)}`)
        .join(" ")
    const gridValues = Array.from({length:5}, (_, index) => maxWeight - ((weightRange / 4) * index))
    const firstPoint = selectedSeries.points[0]
    const latestPoint = selectedSeries.points[selectedSeries.points.length - 1]
    const change = latestPoint.bestWeight - firstPoint.bestWeight

    return (
        <div className="overflow-hidden rounded-2xl border border-[#2DDE85]/20 bg-[#111814]">
            <div className="flex flex-col gap-4 border-b border-[#28312D] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2DDE85]">Best weight trend</p>
                    <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-xl font-black text-white">{formatNumber(latestPoint.bestWeight)} lb</span>
                        <span className={`text-xs font-bold ${change >= 0 ? "text-[#2DDE85]" : "text-amber-300"}`}>
                            {change >= 0 ? "+" : ""}{formatNumber(change)} lb
                        </span>
                    </div>
                </div>

                <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
                    {series.map((item) => (
                        <button
                            key={item.name}
                            type="button"
                            onClick={() => setSelectedName(item.name)}
                            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                                item.name === selectedSeries.name
                                    ? "border-[#2DDE85]/50 bg-[#2DDE85]/12 text-[#2DDE85]"
                                    : "border-[#313A45] bg-[#171B1F] text-[#7E8A98] hover:text-white"
                            }`}
                        >
                            {item.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="overflow-x-auto px-2 pb-3 pt-2 sm:px-4">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="min-w-[560px] w-full"
                    role="img"
                    aria-label={`${selectedSeries.name} best weight by workout`}
                >
                    {gridValues.map((value) => {
                        const y = yForWeight(value)

                        return (
                            <g key={value}>
                                <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#2A3138" strokeWidth="1" />
                                <text x={padding.left - 10} y={y + 4} fill="#647180" fontSize="11" textAnchor="end">
                                    {formatNumber(value)}
                                </text>
                            </g>
                        )
                    })}

                    {selectedSeries.points.length > 1 && (
                        <polyline
                            points={linePoints}
                            fill="none"
                            stroke="#2DDE85"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    )}

                    {selectedSeries.points.map((point, index) => {
                        const x = xForIndex(index)
                        const y = yForWeight(point.bestWeight)
                        const date = new Intl.DateTimeFormat(undefined, {month:"short", day:"numeric"})
                            .format(new Date(`${point.date}T12:00:00`))

                        return (
                            <g key={`${point.date}-${index}`}>
                                <circle cx={x} cy={y} r="6" fill="#111814" stroke="#2DDE85" strokeWidth="4">
                                    <title>{`${point.date}: ${formatNumber(point.bestWeight)} lb × ${formatNumber(point.reps)}`}</title>
                                </circle>
                                <text x={x} y={height - 14} fill="#647180" fontSize="11" textAnchor="middle">
                                    {date}
                                </text>
                            </g>
                        )
                    })}
                </svg>
            </div>
        </div>
    )
}

const CoachResultContent = ({result}: {result: CoachResult}) => {
    const insightLabel = result.analysisType === "daily_macros" ? "Macro priorities" : "Key takeaways"
    const recommendationLabel = result.analysisType === "daily_macros" ? "Meal ideas" : "Next moves"

    return (
        <div className="space-y-5">
            {result.summary && (
                <p className="rounded-xl border border-[#2A3138] bg-[#111418] px-4 py-3 text-sm leading-6 text-[#CBD5E1]">
                    {result.summary}
                </p>
            )}

            {result.macroSummary && <MacroSummary summary={result.macroSummary} />}
            {result.chart?.type === "strength_trend" && <StrengthTrendChart series={result.chart.series} />}

            <div className="grid gap-4 md:grid-cols-2">
                {!!result.insights?.length && (
                    <section>
                        <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#647180]">
                            {insightLabel}
                        </h4>
                        <div className="space-y-2.5">
                            {result.insights.map((item, index) => (
                                <div key={`${item.title}-${index}`} className="rounded-xl border border-[#2A3138] bg-[#111418] p-3.5">
                                    <p className="text-sm font-bold text-white">{item.title}</p>
                                    <p className="mt-1.5 text-xs leading-5 text-[#94A3B8]">{item.detail}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {!!result.recommendations?.length && (
                    <section>
                        <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#647180]">
                            {recommendationLabel}
                        </h4>
                        <div className="space-y-2.5">
                            {result.recommendations.map((item, index) => (
                                <div key={`${item.title}-${index}`} className="rounded-xl border border-[#2DDE85]/15 bg-[#111814] p-3.5">
                                    <div className="flex gap-3">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#2DDE85]/12 text-xs font-black text-[#2DDE85]">
                                            {index + 1}
                                        </span>
                                        <div>
                                            <p className="text-sm font-bold text-white">{item.title}</p>
                                            <p className="mt-1.5 text-xs leading-5 text-[#94A3B8]">{item.detail}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    )
}

function ProCoach() {
    const [isPro, setIsPro] = useState(false)
    const [open, setOpen] = useState(false)
    const [selectedType, setSelectedType] = useState<AnalysisType>("strength_trend")
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<CoachResult | null>(null)
    const [error, setError] = useState("")

    useEffect(() => {
        let active = true

        const loadMembership = async () => {
            try {
                const response = await apiFetch(`${BASEURL}/auth/session`, {
                    method:"GET",
                    headers:{"Content-Type":"application/json"}
                })
                const data = await response.json()

                if (active && response.ok) {
                    setIsPro(data.isPro === true)
                }
            } catch {
                if (active) {
                    setIsPro(false)
                }
            }
        }

        loadMembership()
        window.addEventListener(MEMBERSHIP_UPDATED_EVENT, loadMembership)

        return () => {
            active = false
            window.removeEventListener(MEMBERSHIP_UPDATED_EVENT, loadMembership)
        }
    }, [])

    useEffect(() => {
        if (!open) {
            return
        }

        const previousOverflow = document.body.style.overflow
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !loading) {
                setOpen(false)
            }
        }

        document.body.style.overflow = "hidden"
        window.addEventListener("keydown", closeOnEscape)

        return () => {
            document.body.style.overflow = previousOverflow
            window.removeEventListener("keydown", closeOnEscape)
        }
    }, [open, loading])

    const selectAnalysis = (analysisType: AnalysisType) => {
        if (loading) {
            return
        }

        setSelectedType(analysisType)
        setResult(null)
        setError("")
    }

    const generateAnalysis = async () => {
        if (loading) {
            return
        }

        setLoading(true)
        setError("")
        setResult(null)

        try {
            const response = await apiFetch(`${BASEURL}/coach/analyze`, {
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify({
                    analysisType:selectedType,
                    localDate:getLocalDate(),
                    timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,
                    utcOffsetMinutes:-new Date().getTimezoneOffset()
                })
            })
            const data = await response.json()

            if (!response.ok) {
                setError(data.message || "Your coach could not complete that analysis.")
                return
            }

            setResult(data)
        } catch {
            setError("Could not connect to your coach. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    if (!isPro) {
        return null
    }

    const selectedOption = analysisOptions.find((option) => option.id === selectedType) || analysisOptions[0]

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="group fixed bottom-5 right-4 z-30 flex items-center gap-2 rounded-2xl border border-[#2DDE85]/35 bg-[#17221D]/95 px-4 py-3 text-sm font-bold text-white shadow-2xl shadow-black/40 backdrop-blur transition hover:-translate-y-0.5 hover:border-[#2DDE85]/70 hover:bg-[#1A2A21] focus:outline-none focus:ring-2 focus:ring-[#2DDE85]/60 md:bottom-7 md:right-7"
                aria-label="Open Endurra AI Coach"
            >
                <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-[#2DDE85] text-[#08110C] shadow-lg shadow-[#2DDE85]/20">
                    <Bot size={18} />
                </span>
                <span className="hidden sm:block">AI Coach</span>
                <Crown size={14} className="hidden text-amber-300 sm:block" />
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-[70] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-5"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget && !loading) {
                            setOpen(false)
                        }
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="coach-modal-title"
                        className="max-h-[92vh] w-full overflow-y-auto rounded-t-[28px] border border-[#2A3138] bg-[#111418] shadow-2xl shadow-black/60 sm:max-w-3xl sm:rounded-[28px]"
                    >
                        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#242B32] bg-[#111418]/95 px-5 py-5 backdrop-blur sm:px-7">
                            <div className="flex items-center gap-3">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#2DDE85]/25 bg-[#2DDE85]/10 text-[#2DDE85]">
                                    <Bot size={23} />
                                </span>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 id="coach-modal-title" className="text-xl font-extrabold text-white">
                                            Endurra Coach
                                        </h2>
                                        <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">
                                            Pro
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-[#7E8A98] sm:text-sm">
                                        AI guidance based on your logged training and nutrition.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                disabled={loading}
                                className="rounded-xl border border-[#2A3138] p-2 text-[#7E8A98] transition hover:bg-[#1A1F25] hover:text-white disabled:opacity-40"
                                aria-label="Close coach"
                            >
                                <X size={19} />
                            </button>
                        </div>

                        <div className="space-y-6 p-5 sm:p-7">
                            <div>
                                <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#56616E]">
                                    Choose your analysis
                                </p>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {analysisOptions.map((option) => {
                                        const Icon = option.icon
                                        const selected = option.id === selectedType

                                        return (
                                            <button
                                                key={option.id}
                                                type="button"
                                                onClick={() => selectAnalysis(option.id)}
                                                disabled={loading}
                                                className={`rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                                    selected
                                                        ? "border-[#2DDE85]/55 bg-[#2DDE85]/10 shadow-lg shadow-[#2DDE85]/5"
                                                        : "border-[#2A3138] bg-[#171B1F] hover:border-[#3A444E] hover:bg-[#1A1F25]"
                                                }`}
                                            >
                                                <span className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${
                                                    selected ? "bg-[#2DDE85] text-[#08110C]" : "bg-[#222930] text-[#94A3B8]"
                                                }`}>
                                                    <Icon size={18} />
                                                </span>
                                                <span className="block text-sm font-bold text-white">
                                                    {option.title}
                                                </span>
                                                <span className="mt-1.5 block text-xs leading-5 text-[#7E8A98]">
                                                    {option.description}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {(loading || result || error) && (
                                <div className="rounded-2xl border border-[#2A3138] bg-[#171B1F] p-5 sm:p-6">
                                    {loading && (
                                        <div className="flex min-h-36 flex-col items-center justify-center text-center">
                                            <LoaderCircle size={28} className="animate-spin text-[#2DDE85]" />
                                            <p className="mt-4 font-semibold text-white">Reviewing your tracked data...</p>
                                            <p className="mt-1 text-xs text-[#6B7280]">This can take a few seconds.</p>
                                        </div>
                                    )}

                                    {!loading && error && (
                                        <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                                            {error}
                                        </div>
                                    )}

                                    {!loading && result && (
                                        <div>
                                            <div className="mb-4 flex items-center gap-2 border-b border-[#2A3138] pb-4">
                                                <Bot size={17} className="text-[#2DDE85]" />
                                                <h3 className="font-bold text-white">{result.title}</h3>
                                            </div>
                                            {result.summary
                                                ? <CoachResultContent result={result} />
                                                : <AnalysisContent content={result.analysis || ""} />
                                            }
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-[#242B32] pt-5 sm:flex-row sm:items-center">
                                <p className="max-w-md text-[11px] leading-5 text-[#56616E]">
                                    AI coaching can make mistakes. Use it as guidance, not medical advice, and stop training if you feel pain.
                                </p>
                                <button
                                    type="button"
                                    onClick={generateAnalysis}
                                    disabled={loading}
                                    className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#2DDE85] px-5 py-3 text-sm font-bold text-[#07100B] shadow-lg shadow-[#2DDE85]/15 transition hover:bg-[#25C876] disabled:cursor-not-allowed disabled:bg-[#334155] disabled:text-[#94A3B8]"
                                >
                                    {loading ? "Analyzing..." : result ? "Run again" : `Analyze ${selectedOption.title.replace(" Analysis", "").replace("Completed ", "")}`}
                                    {!loading && <ArrowRight size={16} />}
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </>
    )
}

export default ProCoach
