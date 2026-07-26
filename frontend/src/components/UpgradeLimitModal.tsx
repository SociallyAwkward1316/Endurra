import { Check, Crown, LoaderCircle, X } from "lucide-react"
import { useState } from "react"
import { BASEURL, apiFetch } from "../URL"

type UpgradeLimitModalProps = {
    open: boolean
    limitType: "workouts" | "calorieDays" | "aiFood"
    onClose: () => void
}

const limitCopy = {
    workouts:{
        eyebrow:"Workout limit reached",
        title:"You used all 15 free workouts",
        description:"Keep your training history growing without deleting past progress."
    },
    calorieDays:{
        eyebrow:"Nutrition limit reached",
        title:"You used all 15 free tracking days",
        description:"Keep logging meals and macros every day with unlimited nutrition tracking."
    },
    aiFood:{
        eyebrow:"Endurra Pro feature",
        title:"Log a meal from one photo",
        description:"Get an editable AI estimate of the food, portions, calories, and macros visible in your meal."
    }
}

const proFeatures = [
    "Unlimited workout and calorie tracking",
    "Muscle recovery estimates",
    "AI strength trends and workout reviews",
    "AI meal-photo estimates and macro meal ideas"
]

function UpgradeLimitModal({open, limitType, onClose}: UpgradeLimitModalProps) {
    const [checkoutLoading, setCheckoutLoading] = useState(false)
    const [checkoutError, setCheckoutError] = useState("")
    const copy = limitCopy[limitType]

    const handleClose = () => {
        if (checkoutLoading) {
            return
        }

        setCheckoutError("")
        onClose()
    }

    const startCheckout = async () => {
        if (checkoutLoading) {
            return
        }

        setCheckoutLoading(true)
        setCheckoutError("")

        try {
            const response = await apiFetch(`${BASEURL}/billing/checkout`, {
                method:"POST",
                credentials:"include",
                headers:{"Content-Type":"application/json"}
            })
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || "Could not open Stripe Checkout.")
            }

            if (!data.url || typeof data.url !== "string") {
                throw new Error("Stripe did not return a checkout URL.")
            }

            window.location.assign(data.url)
        } catch (error) {
            setCheckoutError(error instanceof Error ? error.message : "Could not open Stripe Checkout.")
            setCheckoutLoading(false)
        }
    }

    if (!open) {
        return null
    }

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    handleClose()
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="upgrade-limit-title"
                className="w-full max-w-md overflow-hidden rounded-[26px] border border-[#2DDE85]/25 bg-[#1E242B] shadow-2xl shadow-black/50"
            >
                <div className="flex items-start justify-between border-b border-[#2A3138] px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2DDE85]/10 text-[#2DDE85]">
                            <Crown size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#2DDE85]">
                                {copy.eyebrow}
                            </p>
                            <h2 id="upgrade-limit-title" className="mt-0.5 text-lg font-bold text-white">
                                Upgrade to Endurra Pro
                            </h2>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={checkoutLoading}
                        className="rounded-lg p-2 text-[#7E8994] transition hover:bg-[#171B1F] hover:text-white disabled:opacity-50"
                        aria-label="Close upgrade modal"
                    >
                        <X size={19} />
                    </button>
                </div>

                <div className="p-5">
                    <h3 className="text-xl font-bold text-white">{copy.title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-[#94A3B8]">{copy.description}</p>

                    <div className="mt-5 space-y-2.5">
                        {proFeatures.map((feature) => (
                            <div key={feature} className="flex items-center gap-2.5 text-sm text-[#D4DADF]">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2DDE85]/10 text-[#2DDE85]">
                                    <Check size={13} strokeWidth={3} />
                                </span>
                                {feature}
                            </div>
                        ))}
                    </div>

                    <div className="mt-5 flex items-end gap-1 border-t border-[#2A3138] pt-5">
                        <span className="text-3xl font-black tracking-tight text-white">$6.99</span>
                        <span className="pb-1 text-sm text-[#6B7280]">/ month</span>
                    </div>

                    <button
                        type="button"
                        onClick={startCheckout}
                        disabled={checkoutLoading}
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2DDE85] px-5 py-3 font-bold text-black shadow-lg shadow-[#2DDE85]/20 transition hover:bg-[#25C876] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {checkoutLoading ? <LoaderCircle size={18} className="animate-spin" /> : <Crown size={18} />}
                        {checkoutLoading ? "Opening Stripe..." : "Subscribe with Stripe"}
                    </button>

                    <p className="mt-2 text-center text-[11px] text-[#59636D]">
                        Recurring monthly subscription. Cancel anytime through Stripe.
                    </p>

                    {checkoutError && (
                        <p className="mt-3 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200">
                            {checkoutError}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default UpgradeLimitModal
