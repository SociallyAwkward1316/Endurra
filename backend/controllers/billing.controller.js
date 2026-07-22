import {
    BillingError,
    constructStripeEvent,
    createCheckoutSession,
    createPortalSession,
    getBillingStatus,
    processStripeEvent
} from "../services/billing.services.js"

const respondToBillingError = (res, error, fallbackMessage) => {
    if (error instanceof BillingError) {
        return res.status(error.status).json({message:error.message})
    }

    console.error(fallbackMessage, error)
    return res.status(500).json({message:fallbackMessage})
}

export const checkoutController = async (req, res) => {
    try {
        const session = await createCheckoutSession(req.user.userId)

        return res.status(200).json({url:session.url})
    } catch (error) {
        return respondToBillingError(res, error, "Could not start Stripe Checkout.")
    }
}

export const portalController = async (req, res) => {
    try {
        const session = await createPortalSession(req.user.userId)

        return res.status(200).json({url:session.url})
    } catch (error) {
        return respondToBillingError(res, error, "Could not open the Stripe billing portal.")
    }
}

export const billingStatusController = async (req, res) => {
    try {
        const status = await getBillingStatus(req.user.userId)

        res.set("Cache-Control", "no-store")
        return res.status(200).json(status)
    } catch (error) {
        return respondToBillingError(res, error, "Could not load membership status.")
    }
}

export const stripeWebhookController = async (req, res) => {
    try {
        const event = constructStripeEvent(req.body, req.headers["stripe-signature"])
        await processStripeEvent(event)

        return res.status(200).json({received:true})
    } catch (error) {
        if (error instanceof BillingError && error.status === 400) {
            return res.status(400).json({message:error.message})
        }

        if (error?.type === "StripeSignatureVerificationError") {
            return res.status(400).json({message:"Invalid Stripe webhook signature"})
        }

        console.error("Could not process Stripe webhook", error)
        return res.status(500).json({message:"Could not process Stripe webhook"})
    }
}
