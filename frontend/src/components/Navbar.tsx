import { useEffect, useState } from "react"
import {
    Apple,
    ChartColumn,
    ChevronRight,
    Dumbbell,
    Flame,
    LayoutDashboard,
    LogOut,
    Menu,
    User,
    X
} from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { BASEURL, apiFetch } from "../URL"
import { fetchUserStreak, STREAKS_UPDATED_EVENT } from "../streaks"
import type { UserStreak } from "../streaks"

type NavItem = {
    label: string
    path: string
    icon: React.ComponentType<{ size?: number, className?: string }>
    disabled?: boolean
}

function Navbar() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [loggingOut, setLoggingOut] = useState(false)
    const [streak, setStreak] = useState<UserStreak | null>(null)
    const navigate = useNavigate()
    const location = useLocation()

    const navItems: NavItem[] = [
        {
            label: "Dashboard",
            path: "/dashboard",
            icon: LayoutDashboard
        },
        {
            label: "Workout Tracker",
            path: "/workoutDash",
            icon: Dumbbell
        },
        {
            label: "Cal Tracker",
            path: "/calorieTracker",
            icon: Apple
        },
        {
            label: "Analytics",
            path: "/analytics",
            icon: ChartColumn
        }
    ]

    useEffect(() => {
        const nutritionProfileCheck = async () => {
            const response = await apiFetch(`${BASEURL}/caltracker/getNutritionProfile`,
                {
                    method:"GET",
                    credentials:"include",
                    headers:{"Content-Type":"application/json"}
                }
            )

            if (response.status === 204) {
                navigate("/createNutritionProfile")
            }
        }
        nutritionProfileCheck()
    }, [navigate])

    useEffect(() => {
        const loadStreak = async () => {
            setStreak(await fetchUserStreak())
        }

        loadStreak()
        window.addEventListener(STREAKS_UPDATED_EVENT, loadStreak)

        return () => window.removeEventListener(STREAKS_UPDATED_EVENT, loadStreak)
    }, [])

    const handleNavigate = (path: string, disabled?: boolean) => {
        if (disabled) {
            return
        }

        navigate(path)
        setSidebarOpen(false)
    }

    const isActive = (path: string) => {
        if (path === "/workoutDash") {
            return location.pathname.startsWith("/workoutDash")
        }

        if (path === "/analytics") {
            return location.pathname.startsWith("/analytics")
        }

        return location.pathname === path
    }

    const handleLogout = async () => {
        if (loggingOut) {
            return
        }

        setLoggingOut(true)

        try {
            await fetch(`${BASEURL}/auth/logout`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" }
            })
        } finally {
            setSidebarOpen(false)
            navigate("/", { replace: true })
        }
    }

    return (
        <>
            <button
                className="fixed left-4 top-4 z-50 rounded-xl border border-[#2A3138] bg-[#111418]/95 p-2.5 text-[#CBD5E1] shadow-lg shadow-black/20 backdrop-blur md:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle navigation"
            >
                {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <div
                className="fixed right-4 top-4 z-30 flex h-11 items-center overflow-hidden rounded-xl border border-[#2A3138] bg-[#111418]/95 shadow-lg shadow-black/20 backdrop-blur md:hidden"
                aria-label={`Workout streak ${streak?.current_workout_streak || 0} days, nutrition streak ${streak?.current_calorie_streak || 0} days`}
            >
                <div className="flex h-full items-center gap-1.5 px-3" title="Workout streak">
                    <Dumbbell size={15} className="text-[#2DDE85]" />
                    <span className="text-sm font-bold text-white">{streak?.current_workout_streak || 0}</span>
                    <Flame size={13} className="text-orange-400" />
                </div>
                <div className="h-6 w-px bg-[#2A3138]" />
                <div className="flex h-full items-center gap-1.5 px-3" title="Nutrition streak">
                    <Apple size={15} className="text-[#2DDE85]" />
                    <span className="text-sm font-bold text-white">{streak?.current_calorie_streak || 0}</span>
                    <Flame size={13} className="text-orange-400" />
                </div>
            </div>

            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={`fixed left-0 top-0 z-50 h-screen w-72 border-r border-[#222A31] bg-[#111418] shadow-xl shadow-black/20 transition-transform duration-300 ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                } md:w-64 md:translate-x-0`}
            >
                <div className="flex h-full flex-col px-3 py-4">
                    <div className="mb-5 px-3 py-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#2DDE85]/25 bg-[#2DDE85]/10 text-sm font-black text-[#2DDE85]">
                                <Dumbbell size={20} />
                            </div>

                            <div>
                                <h1 className="text-lg font-extrabold tracking-tight text-white">
                                    ENDURRA
                                </h1>
                                <p className="text-[11px] font-medium text-[#4B5563]">
                                    Fitness tracking
                                </p>
                            </div>
                        </div>
                    </div>

                    <nav className="flex-1">
                        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3F4852]">
                            Menu
                        </p>

                        <ul className="space-y-1">
                            {navItems.map((item) => {
                                const active = isActive(item.path)
                                const Icon = item.icon

                                return (
                                    <li key={item.path}>
                                        <button
                                            onClick={() => handleNavigate(item.path, item.disabled)}
                                            disabled={item.disabled}
                                            className={`group relative flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition ${
                                                active
                                                    ? "bg-[#1A1F25] text-white"
                                                    : "text-[#8D98A6] hover:bg-[#171B1F] hover:text-[#CBD5E1]"
                                            } ${item.disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer"}`}
                                        >
                                            {active && (
                                                <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-[#2DDE85]" />
                                            )}

                                            <span className="flex items-center gap-3">
                                                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                                                    active
                                                        ? "bg-[#2DDE85]/10 text-[#2DDE85]"
                                                        : "text-[#6B7280] group-hover:text-[#94A3B8]"
                                                }`}>
                                                    <Icon size={18} />
                                                </span>
                                                <span className="text-sm font-medium">
                                                    {item.label}
                                                </span>
                                            </span>

                                            {!item.disabled && (
                                                <ChevronRight
                                                    size={15}
                                                    className={`transition ${
                                                        active ? "opacity-50" : "opacity-0 group-hover:opacity-40"
                                                    }`}
                                                />
                                            )}
                                        </button>
                                    </li>
                                )
                            })}
                        </ul>
                    </nav>

                    <div className="mt-5 border-t border-[#222A31] pt-4">
                        <div className="mb-3 grid grid-cols-2 gap-2 px-1">
                            <div className="rounded-xl border border-[#2DDE85]/20 bg-[#2DDE85]/8 px-3 py-2.5">
                                <div className="flex items-center gap-1.5 text-[#2DDE85]">
                                    <Dumbbell size={14} />
                                    <span className="text-[10px] font-semibold uppercase tracking-wide">Workout</span>
                                </div>
                                <p className="mt-1 text-lg font-bold text-white">
                                    {streak?.current_workout_streak || 0}
                                    <span className="ml-1 text-[10px] font-medium text-[#6B7280]">days</span>
                                </p>
                            </div>
                            <div className="rounded-xl border border-[#2DDE85]/20 bg-[#2DDE85]/8 px-3 py-2.5">
                                <div className="flex items-center gap-1.5 text-[#2DDE85]">
                                    <Apple size={14} />
                                    <span className="text-[10px] font-semibold uppercase tracking-wide">Nutrition</span>
                                </div>
                                <p className="mt-1 text-lg font-bold text-white">
                                    {streak?.current_calorie_streak || 0}
                                    <span className="ml-1 text-[10px] font-medium text-[#6B7280]">days</span>
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => handleNavigate("/profile")}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                                location.pathname === "/profile"
                                    ? "bg-[#1A1F25] text-white"
                                    : "text-[#8D98A6] hover:bg-[#171B1F] hover:text-[#CBD5E1]"
                            }`}
                        >
                            <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                                location.pathname === "/profile"
                                    ? "bg-[#2DDE85]/10 text-[#2DDE85]"
                                    : "text-[#6B7280]"
                            }`}>
                                <User size={18} />
                            </span>

                            <span>
                                <span className="block text-sm font-medium">Profile</span>
                                <span className="text-[11px] text-[#4B5563]">Account settings</span>
                            </span>
                        </button>

                        <button
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[#8D98A6] transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280]">
                                <LogOut size={18} />
                            </span>

                            <span>
                                <span className="block text-sm font-medium">
                                    {loggingOut ? "Logging out..." : "Log out"}
                                </span>
                                <span className="text-[11px] text-[#4B5563]">End this session</span>
                            </span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    )
}

export default Navbar
