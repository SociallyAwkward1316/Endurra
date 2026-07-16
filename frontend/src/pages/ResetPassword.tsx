import { useMemo, useState } from "react"
import type { FormEvent } from "react"
import { CheckCircle2, Eye, EyeOff, Lock } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { BASEURL } from "../URL"

type PasswordRule = {
    label: string
    passes: boolean
}

function ResetPassword() {
    const [searchParams] = useSearchParams()
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [complete, setComplete] = useState(false)
    const navigate = useNavigate()
    const token = searchParams.get("token") || ""

    const passwordRules: PasswordRule[] = useMemo(() => [
        {label:"At least 8 characters", passes:password.length >= 8},
        {label:"One uppercase letter", passes:/[A-Z]/.test(password)},
        {label:"One lowercase letter", passes:/[a-z]/.test(password)},
        {label:"One number", passes:/\d/.test(password)},
        {label:"Passwords match", passes:Boolean(password) && password === confirmPassword}
    ], [password, confirmPassword])
    const passwordIsValid = passwordRules.every((rule) => rule.passes)

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault()
        setError("")

        if (!token) {
            setError("This reset link is invalid or incomplete.")

            return
        }

        if (!passwordIsValid) {
            setError("Your password does not meet the requirements yet.")

            return
        }

        setLoading(true)

        try {
            const response = await fetch(`${BASEURL}/auth/reset-password`, {
                method:"POST",
                credentials:"include",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify({token, password, confirmPassword})
            })
            const data = await response.json()

            if (!response.ok) {
                setError(data.message || "Could not reset your password.")

                return
            }

            setComplete(true)
        } catch {
            setError("Could not connect to the server. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#111418] px-5 py-10 text-[#F8FAFC]">
            <section className="w-full max-w-md rounded-[28px] border border-[#2A3138] bg-[#171B1F] p-6 shadow-2xl shadow-black/25 sm:p-8">
                {complete ? (
                    <div className="text-center">
                        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#2DDE85]/10 text-[#2DDE85]">
                            <CheckCircle2 size={28} />
                        </div>
                        <h1 className="mt-5 text-3xl font-bold text-white">Password updated</h1>
                        <p className="mt-3 text-sm leading-6 text-[#94A3B8]">Your new password is ready. Log in to continue your ascent.</p>
                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                            className="mt-7 w-full rounded-2xl bg-[#2DDE85] py-3 font-semibold text-black transition hover:bg-[#25C876]"
                        >
                            Log in
                        </button>
                    </div>
                ) : (
                    <>
                        <p className="mb-2 text-sm font-semibold text-[#2DDE85]">Secure reset</p>
                        <h1 className="text-3xl font-bold text-white">Choose a new password</h1>
                        <p className="mt-3 text-sm leading-6 text-[#94A3B8]">Use a strong password you haven&apos;t used before.</p>

                        {error && (
                            <div className="mt-5 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
                        )}

                        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                            <div>
                                <label className="text-sm font-medium text-[#CBD5E1]" htmlFor="new-password">New password</label>
                                <div className="relative mt-2">
                                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                                    <input
                                        id="new-password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="new-password"
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                        className="w-full rounded-2xl border border-[#313A45] bg-[#1A1F25] py-3 pl-11 pr-12 text-white outline-none transition focus:border-[#2DDE85]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((current) => !current)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] transition hover:text-[#CBD5E1]"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-[#CBD5E1]" htmlFor="confirm-new-password">Confirm password</label>
                                <div className="relative mt-2">
                                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                                    <input
                                        id="confirm-new-password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="new-password"
                                        value={confirmPassword}
                                        onChange={(event) => setConfirmPassword(event.target.value)}
                                        className="w-full rounded-2xl border border-[#313A45] bg-[#1A1F25] py-3 pl-11 pr-4 text-white outline-none transition focus:border-[#2DDE85]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-2 rounded-2xl border border-[#2A3138] bg-[#111418]/60 p-4 sm:grid-cols-2">
                                {passwordRules.map((rule) => (
                                    <p key={rule.label} className={`flex items-center gap-2 text-xs ${rule.passes ? "text-[#2DDE85]" : "text-[#6B7280]"}`}>
                                        <CheckCircle2 size={14} />
                                        {rule.label}
                                    </p>
                                ))}
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !passwordIsValid || !token}
                                className="w-full rounded-2xl bg-[#2DDE85] py-3 font-semibold text-black shadow-lg shadow-[#2DDE85]/15 transition hover:bg-[#25C876] disabled:cursor-not-allowed disabled:bg-[#334155] disabled:text-[#94A3B8]"
                            >
                                {loading ? "Updating password..." : "Reset password"}
                            </button>

                            {!token && (
                                <button type="button" onClick={() => navigate("/forgot-password")} className="w-full text-sm font-semibold text-[#2DDE85]">
                                    Request a new reset link
                                </button>
                            )}
                        </form>
                    </>
                )}
            </section>
        </main>
    )
}

export default ResetPassword
