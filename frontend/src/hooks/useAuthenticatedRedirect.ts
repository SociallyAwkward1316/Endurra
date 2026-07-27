import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { BASEURL } from "../URL"

export const useAuthenticatedRedirect = () => {
    const navigate = useNavigate()
    const [isCheckingSession, setIsCheckingSession] = useState(true)

    useEffect(() => {
        const controller = new AbortController()

        const checkSession = async () => {
            try {
                const response = await fetch(`${BASEURL}/auth/session`, {
                    method: "GET",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    signal: controller.signal
                })

                if (response.ok) {
                    navigate("/dashboard", { replace: true })

                    return
                }

                setIsCheckingSession(false)
            } catch (error) {
                if (!(error instanceof DOMException && error.name === "AbortError")) {
                    // A network failure should not prevent the auth form from being used.
                    setIsCheckingSession(false)
                }
            }
        }

        checkSession()

        return () => controller.abort()
    }, [navigate])

    return isCheckingSession
}
