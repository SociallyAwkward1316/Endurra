import {
    Activity,
    Apple,
    ArrowRight,
    Camera,
    ChartNoAxesCombined,
    Check,
    ChevronLeft,
    ChevronRight,
    Crown,
    Dumbbell,
    Flame,
    Plus,
    ScanLine,
    Search,
    Target,
    Trophy
} from "lucide-react"
import { useNavigate } from "react-router-dom"

type FeatureCardProps = {
    icon: React.ComponentType<{size?: number, className?: string}>
    eyebrow: string
    title: string
    description: string
}

const freeFeatures = [
    "15 saved workouts",
    "15 calorie-tracking days",
    "Workout and nutrition tracking",
    "Streaks and progress analytics"
]

const proFeatures = [
    "Unlimited workout and nutrition history",
    "Muscle recovery estimates",
    "AI strength trends and workout reviews",
    "Weekly coaching and macro meal ideas"
]

function FeatureCard({icon:Icon, eyebrow, title, description}: FeatureCardProps) {
    return (
        <article className="group rounded-[24px] border border-[#252D34] bg-[#171C21] p-5 transition hover:-translate-y-1 hover:border-[#2DDE85]/35 hover:bg-[#1A2025] sm:p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#2DDE85]/20 bg-[#2DDE85]/10 text-[#2DDE85] transition group-hover:bg-[#2DDE85] group-hover:text-black">
                <Icon size={21} />
            </div>
            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#2DDE85]">{eyebrow}</p>
            <h3 className="mt-2 text-xl font-bold text-white">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-[#89949E]">{description}</p>
        </article>
    )
}

function Landing() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen overflow-hidden bg-[#111418] text-[#F8FAFC]">
            <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#111418]/85 backdrop-blur-xl">
                <nav
                    className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
                    aria-label="Main navigation"
                >
                    <button
                        type="button"
                        onClick={() => window.scrollTo({top:0, behavior:"smooth"})}
                        className="flex items-center gap-2.5"
                        aria-label="Endurra home"
                    >
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#2DDE85]/25 bg-[#2DDE85]/10 text-[#2DDE85]">
                            <Dumbbell size={19} />
                        </span>
                        <span className="text-lg font-black tracking-[0.08em] text-white">ENDURRA</span>
                    </button>

                    <div className="hidden items-center gap-7 text-sm font-semibold text-[#8D98A3] md:flex">
                        <a href="#features" className="transition hover:text-white">Features</a>
                        <a href="#nutrition" className="transition hover:text-white">Nutrition</a>
                        <a href="#principles" className="transition hover:text-white">Why Endurra</a>
                        <a href="#pricing" className="transition hover:text-white">Plans</a>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                            className="rounded-xl px-3 py-2 text-sm font-semibold text-[#B7C0C9] transition hover:bg-white/5 hover:text-white sm:px-4"
                        >
                            Log in
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate("/signup")}
                            className="rounded-xl bg-[#2DDE85] px-3.5 py-2.5 text-sm font-bold text-[#07150D] shadow-lg shadow-[#2DDE85]/15 transition hover:bg-[#25C876] sm:px-4"
                        >
                            Start free
                        </button>
                    </div>
                </nav>
            </header>

            <main>
                <section className="relative px-4 pb-20 pt-32 sm:px-6 sm:pb-24 sm:pt-40 lg:px-8 lg:pb-28">
                    <div className="pointer-events-none absolute left-1/2 top-0 h-[540px] w-[900px] -translate-x-1/2 rounded-full bg-[#2DDE85]/[0.07] blur-[120px]" />
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_80%)]" />

                    <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-[#2DDE85]/25 bg-[#2DDE85]/10 px-3 py-1.5 text-xs font-bold text-[#77EBA9]">
                                <Activity size={14} />
                                Fitness tracking, without the friction
                            </div>

                            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
                                Your fitness.
                                <span className="block text-[#2DDE85]">Clearly tracked.</span>
                            </h1>

                            <p className="mt-6 max-w-xl text-base leading-7 text-[#98A3AD] sm:text-lg sm:leading-8">
                                Endurra keeps workouts, nutrition, streaks, and progress in one calm place—so tracking takes seconds and the work stays the focus.
                            </p>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={() => navigate("/signup")}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2DDE85] px-6 py-3.5 font-bold text-[#07150D] shadow-xl shadow-[#2DDE85]/20 transition hover:-translate-y-0.5 hover:bg-[#25C876]"
                                >
                                    Create free account
                                    <ArrowRight size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate("/login")}
                                    className="inline-flex items-center justify-center rounded-2xl border border-[#303941] bg-[#171B1F] px-6 py-3.5 font-semibold text-white transition hover:border-[#2DDE85]/45 hover:bg-[#1C2228]"
                                >
                                    I already have an account
                                </button>
                            </div>

                            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-[#69747E]">
                                <span className="flex items-center gap-1.5"><Check size={14} className="text-[#2DDE85]" /> No card required</span>
                                <span className="flex items-center gap-1.5"><Check size={14} className="text-[#2DDE85]" /> 15 free workouts</span>
                                <span className="flex items-center gap-1.5"><Check size={14} className="text-[#2DDE85]" /> 15 nutrition days</span>
                            </div>
                        </div>

                        <div className="relative mx-auto w-full max-w-2xl lg:mx-0">
                            <div className="absolute -inset-8 rounded-[48px] bg-[#2DDE85]/[0.06] blur-3xl" />
                            <div className="relative overflow-hidden rounded-[30px] border border-[#303941] bg-[#171B1F] p-3 shadow-2xl shadow-black/50 sm:p-4">
                                <div className="rounded-[22px] border border-[#252D34] bg-[#1D2329] p-4 sm:p-5">
                                    <div className="flex items-center justify-between border-b border-[#2B333B] pb-4">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#69747E]">Today</p>
                                            <h2 className="mt-1 text-lg font-bold text-white">Your dashboard</h2>
                                        </div>
                                        <div className="flex items-center gap-2 rounded-xl bg-[#171B1F] px-3 py-2">
                                            <Flame size={15} className="text-[#2DDE85]" />
                                            <span className="text-xs font-bold text-white">12 day streak</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-3 sm:grid-cols-[1.08fr_0.92fr]">
                                        <div className="rounded-[18px] border border-[#2A323A] bg-[#171B1F] p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2DDE85]/10 text-[#2DDE85]">
                                                        <Dumbbell size={16} />
                                                    </span>
                                                    <span className="text-xs font-bold text-white">Push day</span>
                                                </div>
                                                <span className="text-[10px] font-semibold text-[#67727D]">4 exercises</span>
                                            </div>

                                            <div className="mt-4 space-y-3">
                                                {[
                                                    ["Bench press", "275 lb"],
                                                    ["Incline press", "90 lb"],
                                                    ["Tricep pushdown", "105 lb"]
                                                ].map(([exercise, weight]) => (
                                                    <div key={exercise} className="flex items-center justify-between text-xs">
                                                        <span className="text-[#8E99A4]">{exercise}</span>
                                                        <span className="font-semibold text-white">{weight}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#2DDE85]/10 px-3 py-2">
                                                <Trophy size={14} className="text-[#2DDE85]" />
                                                <span className="text-[11px] font-bold text-[#8CF0B7]">New personal record</span>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="rounded-[18px] border border-[#2A323A] bg-[#171B1F] p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Apple size={15} className="text-[#2DDE85]" />
                                                        <span className="text-xs font-bold text-white">Nutrition</span>
                                                    </div>
                                                    <span className="text-[10px] text-[#69747E]">1,820 / 2,300</span>
                                                </div>
                                                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#272E35]">
                                                    <div className="h-full w-[79%] rounded-full bg-[#2DDE85]" />
                                                </div>
                                                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                                                    {[
                                                        ["168g", "Protein"],
                                                        ["194g", "Carbs"],
                                                        ["58g", "Fat"]
                                                    ].map(([value, label]) => (
                                                        <div key={label}>
                                                            <p className="text-[11px] font-bold text-white">{value}</p>
                                                            <p className="mt-0.5 text-[9px] text-[#5F6A74]">{label}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="rounded-[18px] border border-[#2A323A] bg-[#171B1F] p-4">
                                                <div className="flex items-center gap-2">
                                                    <Crown size={14} className="text-[#2DDE85]" />
                                                    <span className="text-xs font-bold text-white">Muscle recovery</span>
                                                </div>
                                                <div className="mt-3 space-y-2.5">
                                                    {[
                                                        ["Chest", "8h", "78%"],
                                                        ["Triceps", "3h", "90%"]
                                                    ].map(([muscle, hours, width]) => (
                                                        <div key={muscle}>
                                                            <div className="flex justify-between text-[10px]">
                                                                <span className="font-semibold text-[#9BA5AE]">{muscle}</span>
                                                                <span className="text-[#69747E]">{hours} left</span>
                                                            </div>
                                                            <div className="mt-1 h-1 overflow-hidden rounded-full bg-[#272E35]">
                                                                <div className="h-full rounded-full bg-[#2DDE85]" style={{width}} />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-2xl border border-[#303941] bg-[#1D2329]/95 px-4 py-3 shadow-xl shadow-black/30 backdrop-blur sm:flex">
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2DDE85]/10 text-[#2DDE85]">
                                    <Target size={17} />
                                </span>
                                <div>
                                    <p className="text-[10px] font-semibold text-[#68737D]">Weekly consistency</p>
                                    <p className="mt-0.5 text-sm font-bold text-white">5 of 6 goals complete</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="features" className="scroll-mt-24 border-y border-white/[0.06] bg-[#14181C] px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
                    <div className="mx-auto w-full max-w-7xl">
                        <div className="max-w-2xl">
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#2DDE85]">Built for real life</p>
                            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
                                The useful parts of tracking. None of the clutter.
                            </h2>
                            <p className="mt-4 text-base leading-7 text-[#8D98A3]">
                                Endurra keeps every action direct, every screen focused, and every result easy to understand.
                            </p>
                        </div>

                        <div className="mt-10 grid gap-4 md:grid-cols-3">
                            <FeatureCard
                                icon={Dumbbell}
                                eyebrow="Fast logging"
                                title="Track a set in seconds"
                                description="Add exercises, weights, and reps without fighting a spreadsheet-sized interface."
                            />
                            <FeatureCard
                                icon={Apple}
                                eyebrow="One daily view"
                                title="Nutrition that stays clear"
                                description="Search foods, save favorites, scan barcodes, and see calories and macros update immediately."
                            />
                            <FeatureCard
                                icon={ChartNoAxesCombined}
                                eyebrow="Useful progress"
                                title="See what is changing"
                                description="Review monthly trends, personal records, streaks, and the training history behind the numbers."
                            />
                        </div>
                    </div>
                </section>

                <section id="nutrition" className="relative scroll-mt-20 overflow-hidden border-b border-white/[0.06] px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
                    <div className="pointer-events-none absolute -right-40 top-20 h-[520px] w-[520px] rounded-full bg-[#2DDE85]/[0.07] blur-[120px]" />
                    <div className="relative mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-center lg:gap-16">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-[#2DDE85]/25 bg-[#2DDE85]/10 px-3 py-1.5 text-xs font-bold text-[#77EBA9]">
                                <Apple size={14} />
                                Calorie tracking, made faster
                            </div>

                            <h2 className="mt-5 text-3xl font-black tracking-[-0.035em] text-white sm:text-5xl">
                                See the whole day.
                                <span className="block text-[#2DDE85]">Log food your way.</span>
                            </h2>

                            <p className="mt-5 max-w-xl text-base leading-7 text-[#8D98A3]">
                                Calories, protein, carbs, and fat stay visible in one focused daily view. Search normally, scan a package, or use a meal photo to move from food to useful numbers faster.
                            </p>

                            <div className="mt-7 space-y-3">
                                <article className="flex gap-4 rounded-[22px] border border-[#2A323A] bg-[#171C21] p-4">
                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#2DDE85]/10 text-[#2DDE85]">
                                        <ScanLine size={21} />
                                    </span>
                                    <div>
                                        <h3 className="font-bold text-white">Scan the barcode</h3>
                                        <p className="mt-1 text-sm leading-6 text-[#7F8A94]">
                                            Point your phone at a UPC or EAN barcode to find serving information and macros without typing the product name.
                                        </p>
                                    </div>
                                </article>

                                <article className="flex gap-4 rounded-[22px] border border-[#2DDE85]/25 bg-[#19231E] p-4 shadow-lg shadow-[#2DDE85]/[0.04]">
                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#2DDE85] text-[#07150D]">
                                        <Camera size={21} />
                                    </span>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-bold text-white">AI meal-photo estimate</h3>
                                            <span className="rounded-full bg-[#2DDE85]/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#77EBA9]">AI assisted</span>
                                        </div>
                                        <p className="mt-1 text-sm leading-6 text-[#91A098]">
                                            Take a food photo to estimate calories and macros, review the portion, then add the result to your day.
                                        </p>
                                    </div>
                                </article>
                            </div>

                            <button
                                type="button"
                                onClick={() => navigate("/signup")}
                                className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#2DDE85] transition hover:text-[#77EBA9]"
                            >
                                Start tracking nutrition
                                <ArrowRight size={16} />
                            </button>
                        </div>

                        <div className="relative mx-auto w-full max-w-3xl">
                            <div className="absolute -inset-6 rounded-[42px] bg-[#2DDE85]/[0.06] blur-3xl" />
                            <div className="relative overflow-hidden rounded-[30px] border border-[#303941] bg-[#171B1F] p-2.5 shadow-2xl shadow-black/50 sm:p-4">
                                <div className="rounded-[22px] border border-[#293139] bg-[#1E242B] p-4 sm:p-5">
                                    <div className="flex flex-col gap-4 border-b border-[#2B333B] pb-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#2DDE85]">
                                                <Apple size={12} />
                                                Daily nutrition
                                            </p>
                                            <h3 className="mt-1.5 text-xl font-black text-white">Calorie Tracker</h3>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center rounded-xl border border-[#313A45] bg-[#171B1F] p-1">
                                                <span className="rounded-lg p-1.5 text-[#6F7B85]"><ChevronLeft size={14} /></span>
                                                <span className="px-2 text-[11px] font-semibold text-white">Today</span>
                                                <span className="rounded-lg p-1.5 text-[#6F7B85]"><ChevronRight size={14} /></span>
                                            </div>
                                            <span className="flex items-center gap-1.5 rounded-xl bg-[#2DDE85] px-3 py-2 text-[11px] font-bold text-[#07150D]">
                                                <Plus size={13} />
                                                Add food
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-3 sm:grid-cols-[0.9fr_1.1fr]">
                                        <div className="rounded-[18px] border border-[#2A323A] bg-[#171B1F] p-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="text-[11px] font-medium text-[#84909A]">Calories remaining</p>
                                                    <p className="mt-2 text-3xl font-black tracking-tight text-white">480 <span className="text-xs font-medium text-[#69747E]">cal</span></p>
                                                </div>
                                                <span className="rounded-full bg-[#2DDE85]/10 px-2 py-1 text-[10px] font-bold text-[#2DDE85]">79%</span>
                                            </div>
                                            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#272E35]">
                                                <div className="h-full w-[79%] rounded-full bg-[#2DDE85]" />
                                            </div>
                                            <div className="mt-2.5 flex justify-between text-[10px] text-[#65717B]">
                                                <span>1,820 eaten</span>
                                                <span className="font-semibold text-white">2,300 goal</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                ["Protein", "168g", "88%"],
                                                ["Carbs", "194g", "75%"],
                                                ["Fat", "58g", "83%"]
                                            ].map(([label, value, progress]) => (
                                                <div key={label} className="rounded-[16px] border border-[#2A323A] bg-[#171B1F] p-3">
                                                    <p className="text-[9px] font-medium text-[#7B8791] sm:text-[10px]">{label}</p>
                                                    <p className="mt-2 text-base font-black text-white sm:text-lg">{value}</p>
                                                    <div className="mt-3 h-1 overflow-hidden rounded-full bg-[#272E35]">
                                                        <div className="h-full rounded-full bg-[#2DDE85]" style={{width:progress}} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                        <div className="rounded-[18px] border border-[#2A323A] bg-[#171B1F] p-3.5">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2DDE85]/10 text-[#2DDE85]">
                                                        <ScanLine size={17} />
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-xs font-bold text-white">Greek yogurt</p>
                                                        <p className="mt-0.5 text-[10px] text-[#66727C]">Barcode matched · 1 cup</p>
                                                    </div>
                                                </div>
                                                <p className="shrink-0 text-xs font-bold text-white">140 cal</p>
                                            </div>
                                            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                                                {["20g P", "9g C", "0g F"].map((macro) => (
                                                    <span key={macro} className="rounded-lg bg-[#20262C] px-1.5 py-1.5 text-[9px] font-semibold text-[#9AA5AE]">{macro}</span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="rounded-[18px] border border-[#2DDE85]/20 bg-[#19231E] p-3.5">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2DDE85] text-[#07150D]">
                                                        <Camera size={17} />
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-xs font-bold text-white">Chicken rice bowl</p>
                                                        <p className="mt-0.5 text-[10px] text-[#75847B]">AI photo estimate · reviewed</p>
                                                    </div>
                                                </div>
                                                <p className="shrink-0 text-xs font-bold text-white">620 cal</p>
                                            </div>
                                            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                                                {["48g P", "72g C", "16g F"].map((macro) => (
                                                    <span key={macro} className="rounded-lg bg-[#2DDE85]/[0.08] px-1.5 py-1.5 text-[9px] font-semibold text-[#A8DABA]">{macro}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex flex-col gap-2 rounded-[16px] border border-[#2A323A] bg-[#171B1F] p-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-2 text-[11px] text-[#84909A]">
                                            <Search size={14} className="text-[#2DDE85]" />
                                            Search foods or choose a faster way to log
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#303941] px-2.5 py-1.5 text-[10px] font-bold text-[#C4CDD5] sm:flex-none">
                                                <ScanLine size={12} />
                                                Scan
                                            </span>
                                            <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#2DDE85] px-2.5 py-1.5 text-[10px] font-bold text-[#07150D] sm:flex-none">
                                                <Camera size={12} />
                                                Meal photo
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="principles" className="scroll-mt-24 px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
                    <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#2DDE85]">What Endurra stands for</p>
                            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
                                Progress should feel simple enough to repeat.
                            </h2>
                            <p className="mt-5 text-base leading-7 text-[#8D98A3]">
                                The best tracker is the one you keep using. Endurra is designed around consistency, clarity, and proof that your work is adding up.
                            </p>
                            <button
                                type="button"
                                onClick={() => navigate("/signup")}
                                className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#2DDE85] transition hover:text-[#77EBA9]"
                            >
                                Start building your history
                                <ArrowRight size={16} />
                            </button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            {[
                                {
                                    number:"01",
                                    title:"Clarity over complexity",
                                    description:"The information you need, arranged around the decision you are making now."
                                },
                                {
                                    number:"02",
                                    title:"Consistency over perfection",
                                    description:"Streaks and fast logging make the next honest action easier to take."
                                },
                                {
                                    number:"03",
                                    title:"Proof over guesswork",
                                    description:"Your history, trends, and records show what is actually moving forward."
                                }
                            ].map((principle) => (
                                <article key={principle.number} className="rounded-[24px] border border-[#252D34] bg-[#171B1F] p-5 sm:min-h-64 sm:p-6">
                                    <span className="text-xs font-black tracking-[0.18em] text-[#2DDE85]">{principle.number}</span>
                                    <h3 className="mt-12 text-xl font-bold leading-7 text-white sm:mt-16">{principle.title}</h3>
                                    <p className="mt-3 text-sm leading-6 text-[#7F8A94]">{principle.description}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="pricing" className="scroll-mt-24 bg-[#14181C] px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
                    <div className="mx-auto w-full max-w-6xl">
                        <div className="mx-auto max-w-2xl text-center">
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#2DDE85]">Free versus Pro</p>
                            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
                                Start free. Upgrade when your history grows.
                            </h2>
                            <p className="mt-4 text-base leading-7 text-[#8D98A3]">
                                Learn the workflow without paying. Pro removes the limits and adds deeper coaching.
                            </p>
                        </div>

                        <div className="mt-10 grid items-stretch gap-4 lg:grid-cols-2">
                            <article className="flex flex-col rounded-[28px] border border-[#2A323A] bg-[#1A1F24] p-6 sm:p-8">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7E8994]">Free</p>
                                        <h3 className="mt-2 text-2xl font-black text-white">Build the habit</h3>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-4xl font-black text-white">$0</span>
                                        <p className="text-xs text-[#66717B]">forever</p>
                                    </div>
                                </div>

                                <p className="mt-5 text-sm leading-6 text-[#89949E]">
                                    Everything needed to start tracking consistently and see your early progress.
                                </p>

                                <div className="mt-6 flex-1 space-y-3">
                                    {freeFeatures.map((feature) => (
                                        <div key={feature} className="flex items-center gap-3 text-sm text-[#C8D0D7]">
                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[#94A3B8]">
                                                <Check size={13} strokeWidth={3} />
                                            </span>
                                            {feature}
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => navigate("/signup")}
                                    className="mt-8 w-full rounded-2xl border border-[#36404A] bg-[#20262C] px-5 py-3 font-bold text-white transition hover:border-[#2DDE85]/45 hover:bg-[#252D34]"
                                >
                                    Start free
                                </button>
                            </article>

                            <article className="relative flex flex-col overflow-hidden rounded-[28px] border border-[#2DDE85]/35 bg-[#19231E] p-6 shadow-2xl shadow-[#2DDE85]/[0.06] sm:p-8">
                                <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#2DDE85]/10 blur-3xl" />
                                <div className="relative flex items-start justify-between gap-4">
                                    <div>
                                        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#2DDE85]">
                                            <Crown size={14} />
                                            Endurra Pro
                                        </p>
                                        <h3 className="mt-2 text-2xl font-black text-white">Keep everything</h3>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-4xl font-black text-white">$6.99</span>
                                        <p className="text-xs text-[#6E7B74]">per month</p>
                                    </div>
                                </div>

                                <p className="relative mt-5 text-sm leading-6 text-[#9BA8A0]">
                                    Unlimited history plus recovery insights and an AI coach that understands your tracking.
                                </p>

                                <div className="relative mt-6 flex-1 space-y-3">
                                    {proFeatures.map((feature) => (
                                        <div key={feature} className="flex items-center gap-3 text-sm text-[#D8E1DC]">
                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2DDE85]/10 text-[#2DDE85]">
                                                <Check size={13} strokeWidth={3} />
                                            </span>
                                            {feature}
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => navigate("/signup")}
                                    className="relative mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2DDE85] px-5 py-3 font-bold text-[#07150D] shadow-lg shadow-[#2DDE85]/20 transition hover:bg-[#25C876]"
                                >
                                    Create account
                                    <ArrowRight size={17} />
                                </button>
                            </article>
                        </div>
                    </div>
                </section>

                <section className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
                    <div className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-[32px] border border-[#2DDE85]/25 bg-[#19231E] px-6 py-12 text-center shadow-2xl shadow-black/20 sm:px-10 sm:py-16">
                        <div className="pointer-events-none absolute left-1/2 top-0 h-52 w-[600px] -translate-x-1/2 rounded-full bg-[#2DDE85]/10 blur-[90px]" />
                        <div className="relative">
                            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#2DDE85]/20 bg-[#2DDE85]/10 text-[#2DDE85]">
                                <Flame size={22} />
                            </span>
                            <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-black tracking-tight text-white sm:text-5xl">
                                Make your work visible.
                            </h2>
                            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#98A59E]">
                                One workout. One meal. One honest day at a time. Endurra keeps the evidence.
                            </p>
                            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={() => navigate("/signup")}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2DDE85] px-6 py-3.5 font-bold text-[#07150D] transition hover:bg-[#25C876]"
                                >
                                    Get started free
                                    <ArrowRight size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate("/login")}
                                    className="rounded-2xl border border-[#354139] bg-black/10 px-6 py-3.5 font-semibold text-white transition hover:border-[#2DDE85]/45 hover:bg-black/20"
                                >
                                    Log in
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t border-white/[0.06] px-4 py-8 sm:px-6 lg:px-8">
                <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                    <div className="flex items-center justify-center gap-2 sm:justify-start">
                        <Dumbbell size={16} className="text-[#2DDE85]" />
                        <span className="text-sm font-black tracking-[0.08em] text-white">ENDURRA</span>
                    </div>
                    <p className="text-xs text-[#59636D]">Fitness tracking built through discipline.</p>
                    <div className="flex justify-center gap-5 text-xs font-semibold text-[#77828C] sm:justify-end">
                        <button type="button" onClick={() => navigate("/login")} className="transition hover:text-white">Log in</button>
                        <button type="button" onClick={() => navigate("/signup")} className="transition hover:text-white">Sign up</button>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Landing
