import { useState } from "react"
import type { FormEvent } from "react"
import { Eye, EyeOff, Lock, Mail } from "lucide-react"
import { useNavigate } from "react-router-dom"
import Heropic from "../assets/SignUpAssets/Login:SignupHero.png"
import { BASEURL } from "../URL"
import { useAuthenticatedRedirect } from "../hooks/useAuthenticatedRedirect"

function Login () {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const navigate = useNavigate()
    useAuthenticatedRedirect()

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault()
        setError("")

        if (!email.trim() || !password) {
            setError("Enter your email and password to continue.")

            return
        }

        setLoading(true)

        try {
            const response = await fetch(`${BASEURL}/auth/login`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: email.trim(),
                        password
                    })
                }
            )

            const data = await response.json()

            if (!response.ok) {
                setError(data.message || "Unable to log in. Please try again.")

                return
            }

            navigate("/dashboard")
        } catch {
            setError("Could not connect to the server. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#111418] text-[#F8FAFC] md:grid md:grid-cols-[1.05fr_0.95fr]">
            <section className="hidden min-h-screen flex-col justify-center overflow-hidden bg-[#171B1F] px-10 py-12 md:flex">
                <div className="mx-auto w-full max-w-xl">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-[#2DDE85]">
                        Fitness tracking reimagined
                    </p>

                    <h1 className="text-5xl font-extrabold tracking-tight text-white lg:text-6xl">
                        ENDURRA
                    </h1>

                    <p className="mt-4 max-w-md text-lg leading-8 text-[#94A3B8]">
                        Every workout logged. Every improvement measured. Every day made visible.
                    </p>

                    <img
                        src={Heropic}
                        alt="Endurra fitness preview"
                        className="my-10 w-full max-w-lg"
                    />

                    <div className="grid grid-cols-3 gap-3">
                        {["Train", "Track", "Ascend"].map((item) => (
                            <div
                                key={item}
                                className="rounded-2xl border border-[#2A3138] bg-[#1E242B] px-4 py-3 text-center text-sm font-semibold text-[#CBD5E1]"
                            >
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="flex min-h-screen items-center justify-center px-5 py-10">
                <div className="w-full max-w-md">
                    <div className="mb-8 text-center md:hidden">
                        <h1 className="text-4xl font-extrabold tracking-tight text-white">
                            ENDURRA
                        </h1>
                        <p className="mt-2 text-sm text-[#6B7280]">
                            Continue your ascent.
                        </p>
                    </div>

                    <div className="rounded-[28px] border border-[#2A3138] bg-[#171B1F] p-6 shadow-2xl shadow-black/25 sm:p-8">
                        <div className="mb-7">
                            <p className="mb-2 text-sm font-semibold text-[#2DDE85]">
                                Welcome back
                            </p>

                            <h2 className="text-3xl font-bold text-white">
                                Log in
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-[#94A3B8]">
                                Access your dashboard, workouts, and nutrition profile.
                            </p>
                        </div>

                        {error && (
                            <div className="mb-5 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                                {error}
                            </div>
                        )}

                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div>
                                <label className="text-sm font-medium text-[#CBD5E1]" htmlFor="email">
                                    Email
                                </label>
                                <div className="relative mt-2">
                                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                                    <input
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="john@example.com"
                                        className="w-full rounded-2xl border border-[#313A45] bg-[#1A1F25] py-3 pl-11 pr-4 text-[#F8FAFC] outline-none transition placeholder:text-[#6B7280] focus:border-[#2DDE85]"
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between gap-3">
                                    <label className="text-sm font-medium text-[#CBD5E1]" htmlFor="password">
                                        Password
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => navigate("/forgot-password")}
                                        className="text-xs font-semibold text-[#2DDE85] transition hover:text-[#25C876]"
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                                <div className="relative mt-2">
                                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        className="w-full rounded-2xl border border-[#313A45] bg-[#1A1F25] py-3 pl-11 pr-12 text-[#F8FAFC] outline-none transition placeholder:text-[#6B7280] focus:border-[#2DDE85]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] transition hover:text-[#CBD5E1]"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-2xl bg-[#2DDE85] py-3 font-semibold text-black shadow-lg shadow-[#2DDE85]/15 transition hover:bg-[#25C876] disabled:cursor-not-allowed disabled:bg-[#334155] disabled:text-[#94A3B8]"
                            >
                                {loading ? "Logging in..." : "Log In"}
                            </button>
                        </form>

                        <p className="mt-6 text-center text-sm text-[#6B7280]">
                            Don&apos;t have an account?{" "}
                            <button
                                className="font-semibold text-[#2DDE85] transition hover:text-[#25C876]"
                                onClick={() => navigate("/")}
                            >
                                Sign up
                            </button>
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Login
