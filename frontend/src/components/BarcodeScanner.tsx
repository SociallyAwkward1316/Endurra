import { useEffect, useRef, useState } from "react"
import { BrowserMultiFormatReader } from "@zxing/browser"
import type { IScannerControls } from "@zxing/browser"
import { BarcodeFormat } from "@zxing/library"
import { ScanLine, X } from "lucide-react"

type BarcodeScannerProps = {
    onDetected: (barcode: string) => void
    onClose: () => void
}

const expandUpceToUpca = (barcode: string) => {
    if (barcode.length !== 8) {
        return barcode
    }

    const numberSystem = barcode[0]
    const digits = barcode.slice(1, 7)
    const checkDigit = barcode[7]
    const lastDigit = digits[5]

    if (["0", "1", "2"].includes(lastDigit)) {
        return `${numberSystem}${digits.slice(0, 2)}${lastDigit}0000${digits.slice(2, 5)}${checkDigit}`
    }

    if (lastDigit === "3") {
        return `${numberSystem}${digits.slice(0, 3)}00000${digits.slice(3, 5)}${checkDigit}`
    }

    if (lastDigit === "4") {
        return `${numberSystem}${digits.slice(0, 4)}00000${digits[4]}${checkDigit}`
    }

    return `${numberSystem}${digits.slice(0, 5)}0000${lastDigit}${checkDigit}`
}

function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const controlsRef = useRef<IScannerControls | null>(null)
    const detectedRef = useRef(false)
    const [error, setError] = useState("")

    useEffect(() => {
        const reader = new BrowserMultiFormatReader(undefined, {
            delayBetweenScanAttempts: 150,
            delayBetweenScanSuccess: 500
        })
        let active = true

        const startScanner = async () => {
            if (!videoRef.current) {
                return
            }

            try {
                controlsRef.current = await reader.decodeFromConstraints(
                    {
                        audio:false,
                        video:{
                            facingMode:{ideal:"environment"},
                            width:{ideal:1280},
                            height:{ideal:720}
                        }
                    },
                    videoRef.current,
                    (result) => {
                        if (!active || !result || detectedRef.current) {
                            return
                        }

                        const scannedBarcode = result.getText().replace(/\D/g, "")
                        const barcode = result.getBarcodeFormat() === BarcodeFormat.UPC_E
                            ? expandUpceToUpca(scannedBarcode)
                            : scannedBarcode

                        if (barcode.length < 8 || barcode.length > 13) {
                            return
                        }

                        detectedRef.current = true
                        controlsRef.current?.stop()
                        onDetected(barcode)
                    }
                )
            } catch {
                if (active) {
                    setError("Camera access is unavailable. Check your browser permission and try again.")
                }
            }
        }

        startScanner()

        return () => {
            active = false
            controlsRef.current?.stop()
            controlsRef.current = null
        }
    }, [onDetected])

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-white">Scan barcode</h3>
                    <p className="mt-1 text-sm text-[#94A3B8]">Center the UPC or EAN inside the frame.</p>
                </div>
                <button
                    onClick={onClose}
                    className="rounded-xl p-2 text-[#94A3B8] transition hover:bg-[#171B1F] hover:text-white"
                    aria-label="Close barcode scanner"
                >
                    <X size={21} />
                </button>
            </div>

            {error ? (
                <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-5 text-sm text-red-300">
                    {error}
                </div>
            ) : (
                <div className="relative aspect-[3/4] max-h-[58vh] overflow-hidden rounded-2xl bg-black">
                    <video
                        ref={videoRef}
                        className="h-full w-full object-cover"
                        autoPlay
                        muted
                        playsInline
                    />
                    <div className="pointer-events-none absolute inset-x-8 top-1/2 h-36 -translate-y-1/2 rounded-2xl border-2 border-[#2DDE85] shadow-[0_0_0_999px_rgba(0,0,0,0.35)]">
                        <span className="absolute inset-x-3 top-1/2 h-0.5 -translate-y-1/2 bg-[#2DDE85] shadow-[0_0_12px_#2DDE85]" />
                    </div>
                    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-xs font-semibold text-white backdrop-blur">
                        <ScanLine size={16} className="text-[#2DDE85]" />
                        Looking for barcode...
                    </div>
                </div>
            )}
        </div>
    )
}

export default BarcodeScanner
