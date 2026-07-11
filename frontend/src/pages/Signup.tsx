import { useMemo, useState } from "react"
import type { FormEvent } from "react"
import { CheckCircle2, Eye, EyeOff, Lock, Mail, User } from "lucide-react"
import { useNavigate } from "react-router-dom"
import Heropic from "../assets/SignUpAssets/Login:SignupHero.png"
import { BASEURL } from "../URL"
import { useAuthenticatedRedirect } from "../hooks/useAuthenticatedRedirect"

type PasswordRule = {
    label: string
    passes: boolean
}

function Signup () {
    const [email, setEmail] = useState("")
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const navigate = useNavigate()
    useAuthenticatedRedirect()

    const passwordRules: PasswordRule[] = useMemo(() => [
        {
            label: "At least 8 characters",
            passes: password.length >= 8
        },
        {
            label: "One uppercase letter",
            passes: /[A-Z]/.test(password)
        },
        {
            label: "One lowercase letter",
            passes: /[a-z]/.test(password)
        },
        {
            label: "One number",
            passes: /\d/.test(password)
        },
        {
            label: "Passwords match",
            passes: Boolean(password) && password === confirmPassword
        }
    ], [password, confirmPassword])

    const passwordIsValid = passwordRules.every((rule) => rule.passes)

    const validateForm = () => {
        if (!email.trim() || !username.trim() || !firstName.trim() || !lastName.trim()) {
            return "Fill out every field to create your account."
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            return "Enter a valid email address."
        }

        if (username.trim().length < 3) {
            return "Username must be at least 3 characters."
        }

        if (!passwordIsValid) {
            return "Your password does not meet the requirements yet."
        }

        return ""
    }

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault()
        setError("")

        const validationError = validateForm()

        if (validationError) {
            setError(validationError)

            return
        }

        setLoading(true)

        try {
            const response = await fetch(`${BASEURL}/auth/signup`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: email.trim(),
                        username: username.trim(),
                        first_name: firstName.trim(),
                        last_name: lastName.trim(),
                        password
                    })
                }
            )

            const data = await response.json()

            if (!response.ok) {
                setError(data.message || "Unable to create account. Please try again.")

                return
            }

            navigate("/login")
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
                        Build the discipline that creates results. Start with one account, then one logged day.
                    </p>

                    <img
                        src={Heropic}
                        alt="Endurra fitness preview"
                        className="my-10 w-full max-w-lg"
                    />

                    <div className="rounded-[28px] border border-[#2A3138] bg-[#1E242B] p-5">
                        <p className="text-sm font-semibold text-white">
                            Your first win is starting.
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                            Create a profile, set nutrition targets, and keep every workout visible.
                        </p>
                    </div>
                </div>
            </section>

            <section className="flex min-h-screen items-center justify-center px-5 py-10">
                <div className="w-full max-w-lg">
                    <div className="mb-8 text-center md:hidden">
                        <h1 className="text-4xl font-extrabold tracking-tight text-white">
                            ENDURRA
                        </h1>
                        <p className="mt-2 text-sm text-[#6B7280]">
                            Start your ascent.
                        </p>
                    </div>

                    <div className="rounded-[28px] border border-[#2A3138] bg-[#171B1F] p-6 shadow-2xl shadow-black/25 sm:p-8">
                        <div className="mb-7">
                            <p className="mb-2 text-sm font-semibold text-[#2DDE85]">
                                Create account
                            </p>

                            <h2 className="text-3xl font-bold text-white">
                                Sign up
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-[#94A3B8]">
                                Set up your account and start tracking workouts and nutrition.
                            </p>
                        </div>

                        {error && (
                            <div className="mb-5 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                                {error}
                            </div>
                        )}

                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="text-sm font-medium text-[#CBD5E1]" htmlFor="first_name">
                                        First name
                                    </label>
                                    <input
                                        id="first_name"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder="John"
                                        className="mt-2 w-full rounded-2xl border border-[#313A45] bg-[#1A1F25] px-4 py-3 text-[#F8FAFC] outline-none transition placeholder:text-[#6B7280] focus:border-[#2DDE85]"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-[#CBD5E1]" htmlFor="last_name">
                                        Last name
                                    </label>
                                    <input
                                        id="last_name"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder="Doe"
                                        className="mt-2 w-full rounded-2xl border border-[#313A45] bg-[#1A1F25] px-4 py-3 text-[#F8FAFC] outline-none transition placeholder:text-[#6B7280] focus:border-[#2DDE85]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-[#CBD5E1]" htmlFor="username">
                                    Username
                                </label>
                                <div className="relative mt-2">
                                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                                    <input
                                        id="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="JohnDoe123"
                                        className="w-full rounded-2xl border border-[#313A45] bg-[#1A1F25] py-3 pl-11 pr-4 text-[#F8FAFC] outline-none transition placeholder:text-[#6B7280] focus:border-[#2DDE85]"
                                    />
                                </div>
                            </div>

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

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="text-sm font-medium text-[#CBD5E1]" htmlFor="password">
                                        Password
                                    </label>
                                    <div className="relative mt-2">
                                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                                        <input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            autoComplete="new-password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Create password"
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

                                <div>
                                    <label className="text-sm font-medium text-[#CBD5E1]" htmlFor="confirm_password">
                                        Confirm
                                    </label>
                                    <div className="relative mt-2">
                                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                                        <input
                                            id="confirm_password"
                                            type={showConfirmPassword ? "text" : "password"}
                                            autoComplete="new-password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Repeat password"
                                            className="w-full rounded-2xl border border-[#313A45] bg-[#1A1F25] py-3 pl-11 pr-12 text-[#F8FAFC] outline-none transition placeholder:text-[#6B7280] focus:border-[#2DDE85]"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] transition hover:text-[#CBD5E1]"
                                            aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}
                                        >
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-[#2A3138] bg-[#111418] p-4">
                                <p className="mb-3 text-sm font-semibold text-[#CBD5E1]">
                                    Password requirements
                                </p>

                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    {passwordRules.map((rule) => (
                                        <div
                                            key={rule.label}
                                            className={`flex items-center gap-2 text-xs ${
                                                rule.passes ? "text-[#2DDE85]" : "text-[#6B7280]"
                                            }`}
                                        >
                                            <CheckCircle2 size={15} />
                                            {rule.label}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !passwordIsValid}
                                className="w-full rounded-2xl bg-[#2DDE85] py-3 font-semibold text-black shadow-lg shadow-[#2DDE85]/15 transition hover:bg-[#25C876] disabled:cursor-not-allowed disabled:bg-[#334155] disabled:text-[#94A3B8]"
                            >
                                {loading ? "Creating account..." : "Create Account"}
                            </button>
                        </form>

                        <p className="mt-6 text-center text-sm text-[#6B7280]">
                            Already have an account?{" "}
                            <button
                                className="font-semibold text-[#2DDE85] transition hover:text-[#25C876]"
                                onClick={() => navigate("/login")}
                            >
                                Log in
                            </button>
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Signup
