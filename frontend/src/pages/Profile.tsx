import { useCallback, useEffect, useState } from "react"
import { Activity, Bot, ChartNoAxesCombined, Check, CreditCard, Crown, Dumbbell, LoaderCircle, Save, Target, User } from "lucide-react"
import Navbar from "../components/Navbar"
import { BASEURL, apiFetch } from "../URL"
import { useLocation, useNavigate } from "react-router-dom"
import { MEMBERSHIP_UPDATED_EVENT } from "../membership"

type UserProfile = {
    id: number
    username: string
    email: string
    first_name: string
    last_name: string
    is_pro?: boolean
    created_at?: string
}

type BillingStatus = {
    isPro: boolean
    subscriptionStatus: string | null
    currentPeriodEnd: string | null
    canManageBilling: boolean
}

type NutritionProfile = {
    id?: number
    height: number | string
    weight: number | string
    gender: string
    age: number | string
    goal_selection: string
    goal_selection2: number | string
    activity_level: string
    calories: number
    protein: number
    carbs: number
    fats: number
}

function Profile() {
    const navigate = useNavigate()
    const location = useLocation()
    const [user, setUser] = useState<UserProfile | null>(null)
    const [nutritionProfile, setNutritionProfile] = useState<NutritionProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [savingUser, setSavingUser] = useState(false)
    const [savingNutrition, setSavingNutrition] = useState(false)
    const [userMessage, setUserMessage] = useState("")
    const [nutritionMessage, setNutritionMessage] = useState("")
    const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null)
    const [billingLoading, setBillingLoading] = useState(true)
    const [billingAction, setBillingAction] = useState<"checkout" | "portal" | null>(null)
    const [billingMessage, setBillingMessage] = useState("")

    const fetchProfile = useCallback(async () => {
        setLoading(true)

        const response = await apiFetch(`${BASEURL}/profile`, {
            method: "GET",
            credentials: "include",
            headers: { "Content-Type": "application/json" }
        })

        const data = await response.json()

        setUser(data.user || null)
        setNutritionProfile(data.nutritionProfile || null)
        setLoading(false)
    }, [])

    const fetchBillingStatus = useCallback(async (showLoading = true) => {
        if (showLoading) {
            setBillingLoading(true)
        }

        try {
            const response = await apiFetch(`${BASEURL}/billing/status`, {
                method: "GET",
                credentials: "include",
                headers: { "Content-Type": "application/json" }
            })
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || "Could not load membership status.")
            }

            setBillingStatus(data)
            return data as BillingStatus
        } catch (error) {
            setBillingMessage(error instanceof Error ? error.message : "Could not load membership status.")
            return null
        } finally {
            if (showLoading) {
                setBillingLoading(false)
            }
        }
    }, [])

    useEffect(() => {
        const loadProfile = async () => {
            await Promise.all([fetchProfile(), fetchBillingStatus()])
        }

        loadProfile()
    }, [fetchBillingStatus, fetchProfile])

    useEffect(() => {
        const params = new URLSearchParams(location.search)
        const billingResult = params.get("billing")
        const shouldFocusMembership = billingResult || params.get("section") === "membership"
        let canceled = false

        if (shouldFocusMembership) {
            window.setTimeout(() => {
                document.getElementById("membership")?.scrollIntoView({behavior:"smooth", block:"center"})
            }, 100)
        }

        if (billingResult === "canceled") {
            window.setTimeout(() => setBillingMessage("Checkout canceled. Nothing was charged."), 0)
        }

        if (billingResult === "success") {
            window.setTimeout(() => setBillingMessage("Payment received. Activating Endurra Pro..."), 0)

            const confirmMembership = async () => {
                for (let attempt = 0; attempt < 6 && !canceled; attempt += 1) {
                    const status = await fetchBillingStatus(false)

                    if (status?.isPro) {
                        await apiFetch(`${BASEURL}/auth/session`, {
                            method:"GET",
                            credentials:"include",
                            headers:{"Content-Type":"application/json"}
                        })

                        if (!canceled) {
                            setUser((currentUser) => currentUser ? {...currentUser, is_pro:true} : currentUser)
                            setBillingMessage("Endurra Pro is active. Your AI Coach is ready.")
                            window.dispatchEvent(new Event(MEMBERSHIP_UPDATED_EVENT))
                        }

                        return
                    }

                    await new Promise((resolve) => window.setTimeout(resolve, 1500))
                }

                if (!canceled) {
                    setBillingMessage("Payment succeeded. Stripe is still confirming your membership; refresh in a moment.")
                }
            }

            confirmMembership()
        }

        return () => {
            canceled = true
        }
    }, [fetchBillingStatus, location.search])

    const updateUserField = (field: keyof UserProfile, value: string) => {
        if (!user) {
            return
        }

        setUser({
            ...user,
            [field]: value
        })
    }

    const updateNutritionField = (field: keyof NutritionProfile, value: string) => {
        if (!nutritionProfile) {
            return
        }

        setNutritionProfile({
            ...nutritionProfile,
            [field]: value
        })
    }

    const handleUserSave = async () => {
        if (!user) {
            return
        }

        setSavingUser(true)
        setUserMessage("")

        const response = await apiFetch(`${BASEURL}/profile/user`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: user.username,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name
            })
        })

        const data = await response.json()

        if (!response.ok) {
            setUserMessage(data.message || "Could not update account info.")
            setSavingUser(false)

            return
        }

        setUser(data.user)
        setUserMessage("Account info updated.")
        setSavingUser(false)
    }

    const handleNutritionSave = async () => {
        if (!nutritionProfile) {
            return
        }

        setSavingNutrition(true)
        setNutritionMessage("")

        const response = await apiFetch(`${BASEURL}/profile/nutrition`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nutritionProfile)
        })

        const data = await response.json()

        if (!response.ok) {
            setNutritionMessage(data.message || "Could not update nutrition profile.")
            setSavingNutrition(false)

            return
        }

        setNutritionProfile(data.nutritionProfile)
        setNutritionMessage("Nutrition profile updated.")
        setSavingNutrition(false)
    }

    const redirectToBillingUrl = async (path: "checkout" | "portal") => {
        setBillingAction(path)
        setBillingMessage("")

        try {
            const response = await apiFetch(`${BASEURL}/billing/${path}`, {
                method:"POST",
                credentials:"include",
                headers:{"Content-Type":"application/json"}
            })
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || "Could not open Stripe billing.")
            }

            if (!data.url || typeof data.url !== "string") {
                throw new Error("Stripe did not return a billing URL.")
            }

            window.location.assign(data.url)
        } catch (error) {
            setBillingMessage(error instanceof Error ? error.message : "Could not open Stripe billing.")
            setBillingAction(null)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#171B1F] text-[#F8FAFC] md:pl-64">
                <Navbar />
                <main className="mx-auto w-full max-w-7xl px-4 pb-6 pt-16 md:px-8 md:py-8">
                    <div className="rounded-[28px] border border-[#2A3138] bg-[#1E242B] p-8 text-[#94A3B8]">
                        Loading profile...
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
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#2DDE85]/25 bg-[#2DDE85]/10 px-3 py-1 text-sm font-medium text-[#2DDE85]">
                                <User size={16} />
                                Profile
                            </div>

                            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                                Account Settings
                            </h1>

                            <p className="mt-2 max-w-xl text-sm leading-6 text-[#94A3B8] md:text-base">
                                Manage your account details and nutrition targets.
                            </p>
                        </div>
                    </div>
                </section>

                <section
                    id="membership"
                    className="relative mb-6 overflow-hidden rounded-[28px] border border-[#2DDE85]/25 bg-[#1E242B] shadow-xl shadow-black/10"
                >
                    <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#2DDE85]/10 blur-3xl" />
                    <div className="relative grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center lg:p-8">
                        <div>
                            <div className="mb-4 flex flex-wrap items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#2DDE85]/25 bg-[#2DDE85]/10 text-[#2DDE85]">
                                    <Crown size={23} />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2DDE85]">Membership</p>
                                    <h2 className="text-2xl font-bold text-white sm:text-3xl">Endurra Pro</h2>
                                </div>
                                {!billingLoading && (
                                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                        billingStatus?.isPro || user?.is_pro
                                            ? "border-[#2DDE85]/30 bg-[#2DDE85]/10 text-[#2DDE85]"
                                            : "border-[#313A45] bg-[#171B1F] text-[#94A3B8]"
                                    }`}>
                                        {billingStatus?.isPro || user?.is_pro ? "Active" : "Free plan"}
                                    </span>
                                )}
                            </div>

                            <p className="max-w-2xl text-sm leading-6 text-[#94A3B8] sm:text-base">
                                Turn your workout and nutrition history into focused coaching you can actually use.
                            </p>

                            <div className="mt-5 grid gap-3 sm:grid-cols-3">
                                <MembershipFeature icon={ChartNoAxesCombined} label="Strength Trend Analysis" />
                                <MembershipFeature icon={Dumbbell} label="Completed Workout Review" />
                                <MembershipFeature icon={Bot} label="Weekly Coach Recap" />
                            </div>
                        </div>

                        <div className="min-w-full rounded-2xl border border-[#313A45] bg-[#171B1F]/90 p-5 lg:min-w-[280px]">
                            <div className="flex items-end gap-1">
                                <span className="text-4xl font-black tracking-tight text-white">$6.99</span>
                                <span className="pb-1 text-sm text-[#6B7280]">/ month</span>
                            </div>
                            <p className="mt-2 text-xs leading-5 text-[#6B7280]">
                                Recurring monthly membership. Manage or cancel through Stripe at any time.
                            </p>

                            {billingStatus?.currentPeriodEnd && billingStatus.isPro && (
                                <p className="mt-3 flex items-center gap-2 text-xs text-[#94A3B8]">
                                    <Check size={14} className="text-[#2DDE85]" />
                                    Current billing period through {new Intl.DateTimeFormat(undefined, {dateStyle:"medium"}).format(new Date(billingStatus.currentPeriodEnd))}
                                </p>
                            )}

                            {billingStatus?.subscriptionStatus && (
                                <p className="mt-2 text-xs capitalize text-[#6B7280]">
                                    Stripe status: {billingStatus.subscriptionStatus.replaceAll("_", " ")}
                                </p>
                            )}

                            {billingStatus?.isPro || user?.is_pro ? (
                                billingStatus?.canManageBilling ? (
                                    <button
                                        onClick={() => redirectToBillingUrl("portal")}
                                        disabled={billingAction !== null}
                                        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#3A4652] bg-[#232A32] px-5 py-3 font-semibold text-white transition hover:border-[#2DDE85]/45 hover:bg-[#29323B] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {billingAction === "portal" ? <LoaderCircle size={18} className="animate-spin" /> : <CreditCard size={18} />}
                                        {billingAction === "portal" ? "Opening Stripe..." : "Manage billing"}
                                    </button>
                                ) : (
                                    <div className="mt-5 rounded-2xl border border-[#2DDE85]/20 bg-[#2DDE85]/8 px-4 py-3 text-sm text-[#B7F7D3]">
                                        Your Pro access is active. This account is not connected to a Stripe subscription.
                                    </div>
                                )
                            ) : (
                                <button
                                    onClick={() => redirectToBillingUrl("checkout")}
                                    disabled={billingLoading || billingAction !== null}
                                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2DDE85] px-5 py-3 font-bold text-black shadow-lg shadow-[#2DDE85]/20 transition hover:bg-[#25C876] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {billingAction === "checkout" ? <LoaderCircle size={18} className="animate-spin" /> : <Crown size={18} />}
                                    {billingAction === "checkout" ? "Opening checkout..." : "Upgrade with Stripe"}
                                </button>
                            )}

                            {billingMessage && (
                                <p className={`mt-3 text-sm ${
                                    billingMessage.includes("active") || billingMessage.includes("received")
                                        ? "text-[#2DDE85]"
                                        : billingMessage.includes("canceled") || billingMessage.includes("confirming")
                                            ? "text-amber-300"
                                            : "text-red-300"
                                }`}>
                                    {billingMessage}
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                    <div className="rounded-[28px] border border-[#2A3138] bg-[#1E242B] p-5 shadow-xl shadow-black/10 md:p-6">
                        <div className="mb-5 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2DDE85]/10 text-[#2DDE85]">
                                <User size={22} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">User info</h2>
                                <p className="text-sm text-[#6B7280]">Name, username, and email.</p>
                            </div>
                        </div>

                        {user && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <ProfileInput label="First name" value={user.first_name} onChange={(value) => updateUserField("first_name", value)} />
                                    <ProfileInput label="Last name" value={user.last_name} onChange={(value) => updateUserField("last_name", value)} />
                                </div>

                                <ProfileInput label="Username" value={user.username} onChange={(value) => updateUserField("username", value)} />
                                <ProfileInput label="Email" type="email" value={user.email} onChange={(value) => updateUserField("email", value)} />

                                {userMessage && (
                                    <p className={`text-sm ${userMessage.includes("updated") ? "text-[#2DDE85]" : "text-red-300"}`}>
                                        {userMessage}
                                    </p>
                                )}

                                <button
                                    onClick={handleUserSave}
                                    disabled={savingUser}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2DDE85] px-5 py-3 font-semibold text-black shadow-lg shadow-[#2DDE85]/20 transition hover:bg-[#25C876] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                                >
                                    <Save size={18} />
                                    {savingUser ? "Saving..." : "Save user info"}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="rounded-[28px] border border-[#2A3138] bg-[#1E242B] p-5 shadow-xl shadow-black/10 md:p-6">
                        <div className="mb-5 flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2DDE85]/10 text-[#2DDE85]">
                                <Target size={22} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Nutrition profile</h2>
                                <p className="text-sm text-[#6B7280]">Update your targets when your goals change.</p>
                            </div>
                        </div>

                        {!nutritionProfile ? (
                            <div className="rounded-2xl border border-dashed border-[#313A45] bg-[#171B1F] px-6 py-12 text-center">
                                <p className="font-semibold text-white">No nutrition profile yet.</p>
                                <p className="mt-2 text-sm text-[#6B7280]">Create one to unlock calories and macro targets.</p>
                                <button
                                    onClick={() => navigate("/createNutritionProfile")}
                                    className="mt-6 rounded-2xl bg-[#2DDE85] px-5 py-3 font-semibold text-black transition hover:bg-[#25C876]"
                                >
                                    Create profile
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                    <ProfileStat label="Calories" value={nutritionProfile.calories} />
                                    <ProfileStat label="Protein" value={`${nutritionProfile.protein}g`} />
                                    <ProfileStat label="Carbs" value={`${nutritionProfile.carbs}g`} />
                                    <ProfileStat label="Fat" value={`${nutritionProfile.fats}g`} />
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <ProfileInput label="Weight (lbs)" type="number" value={nutritionProfile.weight} onChange={(value) => updateNutritionField("weight", value)} />
                                    <ProfileInput label="Height (inches)" type="number" value={nutritionProfile.height} onChange={(value) => updateNutritionField("height", value)} />
                                    <ProfileInput label="Age" type="number" value={nutritionProfile.age} onChange={(value) => updateNutritionField("age", value)} />

                                    <label className="block">
                                        <span className="mb-2 block text-sm font-medium text-[#CBD5E1]">Gender</span>
                                        <select
                                            value={nutritionProfile.gender}
                                            onChange={(event) => updateNutritionField("gender", event.target.value)}
                                            className="w-full rounded-2xl border border-[#313A45] bg-[#171B1F] px-4 py-3 text-white outline-none transition focus:border-[#2DDE85]"
                                        >
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                        </select>
                                    </label>

                                    <label className="block">
                                        <span className="mb-2 block text-sm font-medium text-[#CBD5E1]">Goal</span>
                                        <select
                                            value={nutritionProfile.goal_selection}
                                            onChange={(event) => updateNutritionField("goal_selection", event.target.value)}
                                            className="w-full rounded-2xl border border-[#313A45] bg-[#171B1F] px-4 py-3 text-white outline-none transition focus:border-[#2DDE85]"
                                        >
                                            <option value="maintain">Maintain</option>
                                            <option value="bulk">Bulk</option>
                                            <option value="cut">Cut</option>
                                        </select>
                                    </label>

                                    <ProfileInput label="Goal adjustment" type="number" value={nutritionProfile.goal_selection2} onChange={(value) => updateNutritionField("goal_selection2", value)} />

                                    <label className="block sm:col-span-2">
                                        <span className="mb-2 block text-sm font-medium text-[#CBD5E1]">Activity level</span>
                                        <select
                                            value={nutritionProfile.activity_level}
                                            onChange={(event) => updateNutritionField("activity_level", event.target.value)}
                                            className="w-full rounded-2xl border border-[#313A45] bg-[#171B1F] px-4 py-3 text-white outline-none transition focus:border-[#2DDE85]"
                                        >
                                            <option value="sedentary">Sedentary</option>
                                            <option value="lightly_active">Lightly active</option>
                                            <option value="moderately_active">Moderately active</option>
                                            <option value="very_active">Very active</option>
                                            <option value="extremely_active">Extremely active</option>
                                        </select>
                                    </label>
                                </div>

                                {nutritionMessage && (
                                    <p className={`text-sm ${nutritionMessage.includes("updated") ? "text-[#2DDE85]" : "text-red-300"}`}>
                                        {nutritionMessage}
                                    </p>
                                )}

                                <button
                                    onClick={handleNutritionSave}
                                    disabled={savingNutrition}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2DDE85] px-5 py-3 font-semibold text-black shadow-lg shadow-[#2DDE85]/20 transition hover:bg-[#25C876] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                                >
                                    <Activity size={18} />
                                    {savingNutrition ? "Updating..." : "Update nutrition"}
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    )
}

type ProfileInputProps = {
    label: string
    value: string | number | undefined
    type?: string
    onChange: (value: string) => void
}

function ProfileInput({ label, value, type = "text", onChange }: ProfileInputProps) {
    return (
        <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#CBD5E1]">{label}</span>
            <input
                type={type}
                value={value ?? ""}
                onChange={(event) => onChange(event.target.value)}
                className="w-full rounded-2xl border border-[#313A45] bg-[#171B1F] px-4 py-3 text-white outline-none transition placeholder:text-[#6B7280] focus:border-[#2DDE85]"
            />
        </label>
    )
}

type ProfileStatProps = {
    label: string
    value: string | number
}

type MembershipFeatureProps = {
    icon: React.ComponentType<{ size?: number, className?: string }>
    label: string
}

function MembershipFeature({ icon: Icon, label }: MembershipFeatureProps) {
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-[#2A3138] bg-[#171B1F]/75 px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#2DDE85]/10 text-[#2DDE85]">
                <Icon size={17} />
            </span>
            <span className="text-sm font-medium leading-5 text-[#CBD5E1]">{label}</span>
        </div>
    )
}

function ProfileStat({ label, value }: ProfileStatProps) {
    return (
        <div className="rounded-2xl border border-[#2A3138] bg-[#171B1F] p-3">
            <p className="text-xs text-[#6B7280]">{label}</p>
            <p className="mt-1 text-lg font-bold text-white">{value}</p>
        </div>
    )
}

export default Profile
