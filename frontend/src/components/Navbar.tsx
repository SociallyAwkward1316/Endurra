import { useEffect, useState } from "react"
import {
    Apple,
    ChartColumn,
    ChevronRight,
    Dumbbell,
    LayoutDashboard,
    Menu,
    User,
    X
} from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { BASEURL, apiFetch } from "../URL"

type NavItem = {
    label: string
    path: string
    icon: React.ComponentType<{ size?: number, className?: string }>
    disabled?: boolean
}

function Navbar() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
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

    return (
        <>
            <button
                className="fixed left-4 top-4 z-50 rounded-xl border border-[#2A3138] bg-[#111418]/95 p-2.5 text-[#CBD5E1] shadow-lg shadow-black/20 backdrop-blur md:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle navigation"
            >
                {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

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
                    </div>
                </div>
            </aside>
        </>
    )
}

export default Navbar
