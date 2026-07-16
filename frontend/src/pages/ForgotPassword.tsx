import { useState } from "react"
import type { FormEvent } from "react"
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { BASEURL } from "../URL"
import { useAuthenticatedRedirect } from "../hooks/useAuthenticatedRedirect"

function ForgotPassword() {
    const [email, setEmail] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const navigate = useNavigate()

    useAuthenticatedRedirect()

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault()
        setError("")

        const trimmedEmail = email.trim()

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            setError("Enter a valid email address.")

            return
        }

        setLoading(true)

        try {
            const response = await fetch(`${BASEURL}/auth/forgot-password`, {
                method:"POST",
                credentials:"include",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify({email:trimmedEmail})
            })

            if (!response.ok) {
                throw new Error("Request failed")
            }

            setSubmitted(true)
        } catch {
            setError("Could not request a reset link. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#111418] px-5 py-10 text-[#F8FAFC]">
            <section className="w-full max-w-md rounded-[28px] border border-[#2A3138] bg-[#171B1F] p-6 shadow-2xl shadow-black/25 sm:p-8">
                <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-[#94A3B8] transition hover:text-white"
                >
                    <ArrowLeft size={17} />
                    Back to login
                </button>

                {submitted ? (
                    <div className="text-center">
                        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#2DDE85]/10 text-[#2DDE85]">
                            <CheckCircle2 size={28} />
                        </div>
                        <h1 className="mt-5 text-3xl font-bold text-white">Check your inbox</h1>
                        <p className="mt-3 text-sm leading-6 text-[#94A3B8]">
                            If an account exists for <span className="font-semibold text-[#CBD5E1]">{email.trim()}</span>, we sent a reset link. It expires in 15 minutes.
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                            className="mt-7 w-full rounded-2xl bg-[#2DDE85] py-3 font-semibold text-black transition hover:bg-[#25C876]"
                        >
                            Return to login
                        </button>
                    </div>
                ) : (
                    <>
                        <p className="mb-2 text-sm font-semibold text-[#2DDE85]">Account recovery</p>
                        <h1 className="text-3xl font-bold text-white">Forgot your password?</h1>
                        <p className="mt-3 text-sm leading-6 text-[#94A3B8]">
                            Enter your account email and we&apos;ll send you a secure reset link.
                        </p>

                        {error && (
                            <div className="mt-5 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                                {error}
                            </div>
                        )}

                        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                            <div>
                                <label className="text-sm font-medium text-[#CBD5E1]" htmlFor="reset-email">Email</label>
                                <div className="relative mt-2">
                                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                                    <input
                                        id="reset-email"
                                        type="email"
                                        autoComplete="email"
                                        autoFocus
                                        value={email}
                                        onChange={(event) => setEmail(event.target.value)}
                                        placeholder="john@example.com"
                                        className="w-full rounded-2xl border border-[#313A45] bg-[#1A1F25] py-3 pl-11 pr-4 text-white outline-none transition placeholder:text-[#6B7280] focus:border-[#2DDE85]"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-2xl bg-[#2DDE85] py-3 font-semibold text-black shadow-lg shadow-[#2DDE85]/15 transition hover:bg-[#25C876] disabled:cursor-not-allowed disabled:bg-[#334155] disabled:text-[#94A3B8]"
                            >
                                {loading ? "Sending link..." : "Send reset link"}
                            </button>
                        </form>
                    </>
                )}
            </section>
        </main>
    )
}

export default ForgotPassword
