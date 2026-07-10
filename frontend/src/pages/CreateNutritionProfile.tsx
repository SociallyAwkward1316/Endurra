import { useState } from "react"
import Navbar from "../components/Navbar"
import { BASEURL, apiFetch } from "../URL"
import { useNavigate } from "react-router-dom"

function CreateNutritionProfile() {

    const [gender, setGender] = useState("male")
    const [weight, setWeight] = useState("")
    const [height, setHeight] = useState("")
    const [age, setAge] = useState<number>()

    const [goal, setGoal] = useState("maintain")
    const [goalAdjustment, setGoalAdjustment] = useState("0")

    const [activityLevel, setActivityLevel] = useState("moderately_active")

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const navigate = useNavigate()
    const handleSubmit = async () => {

        try {

            setLoading(true)
            setError("")

            const response = await apiFetch(
                `${BASEURL}/caltracker/createNutritionProfile`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        gender,
                        weight,
                        height,
                        age,
                        goal,
                        goalAdjustment,
                        activityLevel
                    })
                }
            )

            const data = await response.json()

            if (!response.ok) {
                setError(data.message || "Failed to create profile")
                return
            }

            navigate("/dashboard")

        } catch {

            setError("Something went wrong.")

        } finally {

            setLoading(false)

        }
    }

    return (
        <div className="min-h-screen bg-[#171B1F] md:pl-64">

            <Navbar />

            <div className="max-w-3xl mx-auto px-6 py-10">

                <div className="mb-8">

                    <h1 className="text-4xl font-bold text-[#F8FAFC]">
                        Nutrition Profile
                    </h1>

                    <p className="text-[#6B7280] mt-2">
                        Create your nutrition profile so Endurra can
                        calculate calories and macro goals.
                    </p>

                </div>

                <div className="
                    bg-[#1E242B]
                    border
                    border-[#2A3138]
                    rounded-3xl
                    p-8
                    space-y-6
                ">

                    {/* Gender */}

                    <div>

                        <label className="
                            block
                            text-[#CBD5E1]
                            mb-2
                            font-medium
                        ">
                            Gender
                        </label>

                        <select
                            value={gender}
                            onChange={(e) =>
                                setGender(e.target.value)
                            }
                            className="
                                w-full
                                bg-[#111418]
                                border
                                border-[#313A45]
                                rounded-xl
                                px-4
                                py-3
                                text-white
                            "
                        >
                            <option value="male">
                                Male
                            </option>

                            <option value="female">
                                Female
                            </option>

                        </select>

                    </div>

                    {/* Weight */}

                    <div>

                        <label className="
                            block
                            text-[#CBD5E1]
                            mb-2
                            font-medium
                        ">
                            Weight (lbs)
                        </label>

                        <input
                            type="number"
                            value={weight}
                            onChange={(e) =>
                                setWeight(e.target.value)
                            }
                            placeholder="210"
                            className="
                                w-full
                                bg-[#111418]
                                border
                                border-[#313A45]
                                rounded-xl
                                px-4
                                py-3
                                text-white
                            "
                        />

                    </div>

                    {/* Height */}

                    <div>

                        <label className="
                            block
                            text-[#CBD5E1]
                            mb-2
                            font-medium
                        ">
                            Height (inches)
                        </label>

                        <input
                            type="number"
                            value={height}
                            onChange={(e) =>
                                setHeight(e.target.value)
                            }
                            placeholder="72"
                            className="
                                w-full
                                bg-[#111418]
                                border
                                border-[#313A45]
                                rounded-xl
                                px-4
                                py-3
                                text-white
                            "
                        />

                    </div>

                    <div>

                        <label className="
                            block
                            text-[#CBD5E1]
                            mb-2
                            font-medium
                        ">
                            Age
                        </label>

                        <input
                            type="number"
                            value={age}
                            onChange={(e) =>
                                setAge(Number(e.target.value))
                            }
                            placeholder="19"
                            className="
                                w-full
                                bg-[#111418]
                                border
                                border-[#313A45]
                                rounded-xl
                                px-4
                                py-3
                                text-white
                            "
                        />

                    </div>

                    {/* Goal */}

                    <div>

                        <label className="
                            block
                            text-[#CBD5E1]
                            mb-2
                            font-medium
                        ">
                            Goal
                        </label>

                        <select
                            value={goal}
                            onChange={(e) => {

                                setGoal(e.target.value)

                                if (
                                    e.target.value ===
                                    "maintain"
                                ) {
                                    setGoalAdjustment("0")
                                }
                            }}
                            className="
                                w-full
                                bg-[#111418]
                                border
                                border-[#313A45]
                                rounded-xl
                                px-4
                                py-3
                                text-white
                            "
                        >
                            <option value="cut">
                                Cut
                            </option>

                            <option value="maintain">
                                Maintain
                            </option>

                            <option value="bulk">
                                Bulk
                            </option>

                        </select>

                    </div>

                    {/* Goal Adjustment */}

                    <div>

                        <label className="
                            block
                            text-[#CBD5E1]
                            mb-2
                            font-medium
                        ">
                            Daily Calorie Adjustment
                        </label>

                        <input
                            disabled={
                                goal === "maintain"
                            }
                            type="number"
                            value={goalAdjustment}
                            onChange={(e) =>
                                setGoalAdjustment(
                                    e.target.value
                                )
                            }
                            placeholder="250"
                            className="
                                w-full
                                bg-[#111418]
                                border
                                border-[#313A45]
                                rounded-xl
                                px-4
                                py-3
                                text-white
                                disabled:opacity-50
                            "
                        />

                        <p className="
                            text-[#6B7280]
                            text-sm
                            mt-2
                        ">
                            Example:
                            Cut = -250 calories,
                            Bulk = +250 calories
                        </p>

                    </div>

                    {/* Activity Level */}

                    <div>

                        <label className="
                            block
                            text-[#CBD5E1]
                            mb-2
                            font-medium
                        ">
                            Activity Level
                        </label>

                        <select
                            value={activityLevel}
                            onChange={(e) =>
                                setActivityLevel(
                                    e.target.value
                                )
                            }
                            className="
                                w-full
                                bg-[#111418]
                                border
                                border-[#313A45]
                                rounded-xl
                                px-4
                                py-3
                                text-white
                            "
                        >
                            <option value="sedentary">
                                Sedentary
                            </option>

                            <option value="lightly_active">
                                Lightly Active
                            </option>

                            <option value="moderately_active">
                                Moderately Active
                            </option>

                            <option value="very_active">
                                Very Active
                            </option>

                            <option value="extremely_active">
                                Extremely Active
                            </option>

                        </select>

                    </div>

                    {error && (

                        <div className="
                            bg-red-500/10
                            border
                            border-red-500
                            text-red-400
                            rounded-xl
                            p-3
                        ">
                            {error}
                        </div>

                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="
                            w-full
                            bg-[#2DDE85]
                            hover:bg-[#24C775]
                            text-black
                            font-semibold
                            py-4
                            rounded-2xl
                            transition-all
                            cursor-pointer
                        "
                    >
                        {loading
                            ? "Creating..."
                            : "Create Nutrition Profile"}
                    </button>

                </div>

            </div>

        </div>
    )
}

export default CreateNutritionProfile
