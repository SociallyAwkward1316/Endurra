import "dotenv/config"
import { Resend } from "resend"

const escapeHtml = (value = "") => value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")

export const sendPasswordResetEmail = async ({to, firstName, resetUrl}) => {
    const from = process.env.RESEND_FROM_EMAIL

    if (!process.env.RESEND_API_KEY || !from) {
        throw new Error("RESEND_API_KEY and RESEND_FROM_EMAIL must be configured")
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const safeName = escapeHtml(firstName || "there")
    const safeResetUrl = escapeHtml(resetUrl)
    const {data, error} = await resend.emails.send({
        from,
        to:[to],
        subject:"Reset your Endurra password",
        text:`Hi ${firstName || "there"}, reset your Endurra password here: ${resetUrl}\n\nThis link expires in 15 minutes. If you did not request it, you can ignore this email.`,
        html:`
            <div style="background:#111418;color:#f8fafc;font-family:Arial,sans-serif;padding:32px">
                <div style="background:#171b1f;border:1px solid #2a3138;border-radius:20px;margin:0 auto;max-width:520px;padding:32px">
                    <p style="color:#2dde85;font-size:12px;font-weight:700;letter-spacing:2px;margin:0 0 16px">ENDURRA</p>
                    <h1 style="font-size:26px;margin:0 0 16px">Reset your password</h1>
                    <p style="color:#cbd5e1;line-height:1.6">Hi ${safeName}, we received a request to reset your password.</p>
                    <a href="${safeResetUrl}" style="background:#2dde85;border-radius:12px;color:#000;display:inline-block;font-weight:700;margin:12px 0 20px;padding:13px 20px;text-decoration:none">Choose a new password</a>
                    <p style="color:#94a3b8;font-size:13px;line-height:1.6">This link expires in 15 minutes. If you did not request a reset, you can safely ignore this email.</p>
                </div>
            </div>
        `
    })

    if (error) {
        throw new Error(`Resend rejected the password reset email: ${error.message}`)
    }

    return data
}
