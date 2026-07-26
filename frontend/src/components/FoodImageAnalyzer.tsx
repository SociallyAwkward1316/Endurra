import { Camera, ChevronLeft, ImagePlus, LoaderCircle, ShieldCheck, X } from "lucide-react"
import { useEffect, useRef, useState, type ChangeEvent } from "react"
import { BASEURL, apiFetch } from "../URL"

export type FoodImageAnalysis = {
    mealName: string
    items: Array<{
        name: string
        portion: string
        calories: number
        protein: number
        carbs: number
        fats: number
    }>
    totals: {
        calories: number
        protein: number
        carbs: number
        fats: number
    }
    confidence: number
    reviewReason: string
}

export type FoodImageResult = {
    analysisId: number
    analysis: FoodImageAnalysis
    food: {
        analysis_id: number
        name: string
        brand_name: string
        serving_size: number
        serving_unit: string
        calories: number
        protein: number
        carbs: number
        fats: number
        source: "ai_image"
    }
}

type FoodImageAnalyzerProps = {
    onCancel: () => void
    onAnalyzed: (result: FoodImageResult) => void
    onUpgradeRequired: () => void
}

const MAX_FILE_SIZE = 8 * 1024 * 1024
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

function FoodImageAnalyzer({onCancel, onAnalyzed, onUpgradeRequired}: FoodImageAnalyzerProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [file, setFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState("")
    const [note, setNote] = useState("")
    const [error, setError] = useState("")
    const [analyzing, setAnalyzing] = useState(false)

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl)
            }
        }
    }, [previewUrl])

    const chooseImage = () => {
        if (!analyzing) {
            inputRef.current?.click()
        }
    }

    const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
        const nextFile = event.target.files?.[0]

        event.target.value = ""
        setError("")

        if (!nextFile) {
            return
        }

        if (!ALLOWED_TYPES.has(nextFile.type)) {
            setError("Choose a JPEG, PNG, or WebP meal photo.")
            return
        }

        if (nextFile.size > MAX_FILE_SIZE) {
            setError("Meal photos must be 8 MB or smaller.")
            return
        }

        if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
        }

        setFile(nextFile)
        setPreviewUrl(URL.createObjectURL(nextFile))
    }

    const removeImage = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
        }

        setFile(null)
        setPreviewUrl("")
        setError("")
    }

    const analyzeImage = async () => {
        if (!file || analyzing) {
            return
        }

        setAnalyzing(true)
        setError("")

        try {
            const body = new FormData()
            body.append("image", file)
            body.append("note", note.trim().slice(0, 300))

            const response = await apiFetch(`${BASEURL}/caltracker/food-image/analyze`, {
                method:"POST",
                credentials:"include",
                body
            })
            const data = await response.json()

            if (response.status === 403) {
                onUpgradeRequired()
                return
            }

            if (!response.ok || !data.food || !data.analysis) {
                setError(data.message || "Could not analyze that meal photo.")
                return
            }

            onAnalyzed(data as FoodImageResult)
        } catch {
            setError("Could not analyze that meal photo. Please try again.")
        } finally {
            setAnalyzing(false)
        }
    }

    return (
        <div className="space-y-5">
            <button
                type="button"
                onClick={onCancel}
                disabled={analyzing}
                className="inline-flex items-center gap-2 text-sm font-medium text-[#94A3B8] transition hover:text-white disabled:opacity-40"
            >
                <ChevronLeft size={16} />
                Back to food options
            </button>

            <div>
                <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2DDE85]/10 text-[#2DDE85]">
                        <Camera size={21} />
                    </span>
                    <div>
                        <h3 className="text-xl font-bold text-white">Analyze a meal photo</h3>
                        <p className="mt-0.5 text-xs text-[#6B7280]">AI estimate · review before adding</p>
                    </div>
                </div>

                <p className="mt-3 text-sm leading-6 text-[#94A3B8]">
                    Use a bright photo with the full plate visible. Add portion or ingredient details for a better estimate.
                </p>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFile}
                className="hidden"
            />

            {previewUrl ? (
                <div className="relative overflow-hidden rounded-[22px] border border-[#313A45] bg-[#171B1F]">
                    <img
                        src={previewUrl}
                        alt="Selected meal"
                        className="h-56 w-full object-cover sm:h-64"
                    />
                    <button
                        type="button"
                        onClick={removeImage}
                        disabled={analyzing}
                        className="absolute right-3 top-3 rounded-xl border border-white/15 bg-black/65 p-2 text-white backdrop-blur transition hover:bg-black/80 disabled:opacity-40"
                        aria-label="Remove selected meal photo"
                    >
                        <X size={17} />
                    </button>
                    <button
                        type="button"
                        onClick={chooseImage}
                        disabled={analyzing}
                        className="absolute bottom-3 left-3 rounded-xl border border-white/15 bg-black/65 px-3 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-black/80 disabled:opacity-40"
                    >
                        Choose another
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={chooseImage}
                    className="flex min-h-48 w-full flex-col items-center justify-center rounded-[22px] border border-dashed border-[#3A4650] bg-[#171B1F] px-6 text-center transition hover:border-[#2DDE85]/70 hover:bg-[#19221E]"
                >
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2DDE85]/10 text-[#2DDE85]">
                        <ImagePlus size={23} />
                    </span>
                    <span className="mt-4 font-semibold text-white">Take or choose a meal photo</span>
                    <span className="mt-1 text-xs text-[#6B7280]">JPEG, PNG, or WebP · up to 8 MB</span>
                </button>
            )}

            <div>
                <div className="flex items-center justify-between gap-3">
                    <label htmlFor="food-image-note" className="text-sm font-semibold text-[#CBD5E1]">
                        Help improve the estimate
                    </label>
                    <span className="text-[11px] text-[#5F6A74]">{note.length}/300</span>
                </div>
                <textarea
                    id="food-image-note"
                    value={note}
                    onChange={(event) => setNote(event.target.value.slice(0, 300))}
                    disabled={analyzing}
                    rows={3}
                    placeholder="Example: 6 oz chicken, 1 cup rice, light sauce, cooked with olive oil."
                    className="mt-2 w-full resize-none rounded-2xl border border-[#313A45] bg-[#171B1F] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#5F6A74] focus:border-[#2DDE85] disabled:opacity-50"
                />
            </div>

            <div className="flex items-start gap-2 rounded-2xl border border-[#2DDE85]/15 bg-[#2DDE85]/[0.06] px-4 py-3 text-xs leading-5 text-[#8EAA99]">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#2DDE85]" />
                Endurra never writes the photo to storage. It is resized in backend memory, analyzed, and discarded; only the nutrition estimate and your optional note are saved.
            </div>

            {error && (
                <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                </div>
            )}

            <button
                type="button"
                onClick={analyzeImage}
                disabled={!file || analyzing}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2DDE85] px-5 py-3 font-bold text-black shadow-lg shadow-[#2DDE85]/20 transition hover:bg-[#25C876] disabled:cursor-not-allowed disabled:bg-[#334155] disabled:text-[#94A3B8]"
            >
                {analyzing ? <LoaderCircle size={19} className="animate-spin" /> : <Camera size={19} />}
                {analyzing ? "Analyzing meal..." : "Analyze meal"}
            </button>
        </div>
    )
}

export default FoodImageAnalyzer
