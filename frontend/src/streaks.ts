import { BASEURL, apiFetch } from "./URL"

export type UserStreak = {
    current_workout_streak: number
    best_workout_streak: number
    current_calorie_streak: number
    best_calorie_streak: number
    last_workout_date: string | null
    last_calorie_date: string | null
}

export const STREAKS_UPDATED_EVENT = "endurra:streaks-updated"

export const notifyStreaksUpdated = () => {
    window.dispatchEvent(new Event(STREAKS_UPDATED_EVENT))
}

export const getLocalDateKey = (date = new Date()) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
}

export const fetchUserStreak = async () => {
    const response = await apiFetch(
        `${BASEURL}/streaks?date=${encodeURIComponent(getLocalDateKey())}`,
        {
            method:"GET",
            credentials:"include",
            headers:{"Content-Type":"application/json"}
        }
    )

    if (!response.ok) {
        return null
    }

    const data = await response.json()

    return (data.streak || null) as UserStreak | null
}
