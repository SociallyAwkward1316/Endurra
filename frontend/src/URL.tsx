
const configuredBaseUrl = import.meta.env.VITE_BASEURL?.trim()

if (!configuredBaseUrl) {
    throw new Error("VITE_BASEURL must be configured before starting the app")
}

export const BASEURL = configuredBaseUrl.replace(/\/$/, "")

let refreshRequest: Promise<Response> | null = null

const redirectToLogin = () => {
    if (window.location.pathname !== "/login") {
        window.location.href = "/login"
    }
}

const refreshAccessToken = async () => {
    if (!refreshRequest) {
        refreshRequest = fetch(`${BASEURL}/auth/refresh`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            }
        }).finally(() => {
            refreshRequest = null
        })
    }

    return refreshRequest
}

export const apiFetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const requestInit = {
        ...init,
        credentials: init.credentials || "include"
    } satisfies RequestInit

    const response = await fetch(input, requestInit)

    if (response.status !== 401) {
        return response
    }

    const refreshResponse = await refreshAccessToken()

    if (!refreshResponse.ok) {
        redirectToLogin()

        return response
    }

    const retryResponse = await fetch(input, requestInit)

    if (retryResponse.status === 401) {
        redirectToLogin()
    }

    return retryResponse
}
