import Stripe from "stripe"
import supabase from "../supabase/supabase.js"

const PRO_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"])
const BILLING_USER_FIELDS = [
    "id",
    "email",
    "first_name",
    "last_name",
    "is_pro",
    "stripe_customer_id",
    "stripe_subscription_id",
    "subscription_status",
    "subscription_current_period_end"
].join(", ")

let stripeClient
let validatedPricePromise

export class BillingError extends Error {
    constructor(message, status = 500) {
        super(message)
        this.name = "BillingError"
        this.status = status
    }
}

const requireEnvironmentValue = (name) => {
    const value = process.env[name]?.trim()

    if (!value) {
        throw new BillingError(`${name} must be configured`, 503)
    }

    return value
}

const getStripe = () => {
    if (!stripeClient) {
        stripeClient = new Stripe(requireEnvironmentValue("STRIPE_SECRET_KEY"))
    }

    return stripeClient
}

const getFrontendUrl = () => requireEnvironmentValue("FRONTEND_URL").replace(/\/$/, "")
const getConfiguredPriceId = () => requireEnvironmentValue("STRIPE_PRICE_ID")

const stripeId = (value) => {
    if (!value) {
        return null
    }

    return typeof value === "string" ? value : value.id
}

const unixTimestampToIso = (timestamp) => {
    if (!timestamp || !Number.isFinite(timestamp)) {
        return null
    }

    return new Date(timestamp * 1000).toISOString()
}

const getSubscriptionPeriodEnd = (subscription) => {
    const itemPeriodEnds = subscription.items?.data
        ?.map((item) => item.current_period_end)
        .filter((value) => Number.isFinite(value)) || []

    return itemPeriodEnds.length > 0 ? Math.max(...itemPeriodEnds) : null
}

const subscriptionUsesConfiguredPrice = (subscription) => {
    const configuredPriceId = getConfiguredPriceId()

    return subscription.items?.data?.some((item) => item.price?.id === configuredPriceId) || false
}

export const validateConfiguredPrice = async () => {
    if (!validatedPricePromise) {
        validatedPricePromise = getStripe()
            .prices.retrieve(getConfiguredPriceId(), {expand:["product"]})
            .then((price) => {
                const product = price.product
                const productIsActive = typeof product === "string" || (!product.deleted && product.active)
                const isMonthlyPlan =
                    price.active &&
                    productIsActive &&
                    price.currency === "usd" &&
                    price.unit_amount === 699 &&
                    price.type === "recurring" &&
                    price.billing_scheme === "per_unit" &&
                    price.recurring?.interval === "month" &&
                    price.recurring?.interval_count === 1 &&
                    price.recurring?.usage_type === "licensed"

                if (!isMonthlyPlan) {
                    throw new BillingError(
                        "STRIPE_PRICE_ID must point to an active recurring price of $6.99 USD per month",
                        503
                    )
                }

                return price
            })
            .catch((error) => {
                validatedPricePromise = null
                throw error
            })
    }

    return validatedPricePromise
}

export const getBillingUser = async (userId) => {
    const user = await supabase
        .from("Users")
        .select(BILLING_USER_FIELDS)
        .eq("id", userId)
        .single()

    if (user.error || !user.data) {
        throw new BillingError(user.error?.message || "User not found", 404)
    }

    return user.data
}

const updateBillingUser = async (userId, fields) => {
    const updatedUser = await supabase
        .from("Users")
        .update(fields)
        .eq("id", userId)
        .select(BILLING_USER_FIELDS)
        .single()

    if (updatedUser.error || !updatedUser.data) {
        throw new BillingError(updatedUser.error?.message || "Could not update membership")
    }

    return updatedUser.data
}

const findUserForSubscription = async (subscription) => {
    const metadataUserId = subscription.metadata?.userId

    if (metadataUserId) {
        return getBillingUser(metadataUserId)
    }

    if (subscription.id) {
        const userBySubscription = await supabase
            .from("Users")
            .select(BILLING_USER_FIELDS)
            .eq("stripe_subscription_id", subscription.id)
            .maybeSingle()

        if (userBySubscription.error) {
            throw new BillingError(userBySubscription.error.message)
        }

        if (userBySubscription.data) {
            return userBySubscription.data
        }
    }

    const customerId = stripeId(subscription.customer)

    if (!customerId) {
        return null
    }

    const userByCustomer = await supabase
        .from("Users")
        .select(BILLING_USER_FIELDS)
        .eq("stripe_customer_id", customerId)
        .maybeSingle()

    if (userByCustomer.error) {
        throw new BillingError(userByCustomer.error.message)
    }

    return userByCustomer.data
}

export const syncSubscription = async (subscription) => {
    if (!subscriptionUsesConfiguredPrice(subscription)) {
        return null
    }

    const user = await findUserForSubscription(subscription)

    if (!user) {
        throw new BillingError(`No Endurra user found for Stripe subscription ${subscription.id}`)
    }

    return updateBillingUser(user.id, {
        stripe_customer_id:stripeId(subscription.customer),
        stripe_subscription_id:subscription.id,
        subscription_status:subscription.status,
        subscription_current_period_end:unixTimestampToIso(getSubscriptionPeriodEnd(subscription)),
        is_pro:PRO_SUBSCRIPTION_STATUSES.has(subscription.status)
    })
}

const retrieveCurrentSubscription = async (subscription) => {
    try {
        return await getStripe().subscriptions.retrieve(subscription.id, {
            expand:["items.data.price.product"]
        })
    } catch (error) {
        if (error?.code === "resource_missing") {
            return subscription
        }

        throw error
    }
}

const getOrCreateStripeCustomer = async (user) => {
    if (user.stripe_customer_id) {
        await getStripe().customers.update(user.stripe_customer_id, {
            email:user.email,
            name:[user.first_name, user.last_name].filter(Boolean).join(" ") || undefined,
            metadata:{userId:String(user.id)}
        })

        return user.stripe_customer_id
    }

    const customer = await getStripe().customers.create(
        {
            email:user.email,
            name:[user.first_name, user.last_name].filter(Boolean).join(" ") || undefined,
            metadata:{userId:String(user.id)}
        },
        {idempotencyKey:`endurra-customer-${user.id}`}
    )

    await updateBillingUser(user.id, {stripe_customer_id:customer.id})

    return customer.id
}

const findExistingSubscription = async (customerId) => {
    const subscriptions = await getStripe().subscriptions.list({
        customer:customerId,
        status:"all",
        limit:100
    })

    return subscriptions.data.find((subscription) =>
        PRO_SUBSCRIPTION_STATUSES.has(subscription.status) && subscriptionUsesConfiguredPrice(subscription)
    )
}

const findOpenCheckoutSession = async (customerId, userId) => {
    const sessions = await getStripe().checkout.sessions.list({
        customer:customerId,
        status:"open",
        limit:20
    })

    return sessions.data.find((session) =>
        session.mode === "subscription" &&
        session.metadata?.userId === String(userId) &&
        session.metadata?.priceId === getConfiguredPriceId() &&
        session.url
    )
}

export const createCheckoutSession = async (userId) => {
    await validateConfiguredPrice()

    const user = await getBillingUser(userId)
    const customerId = await getOrCreateStripeCustomer(user)
    const existingSubscription = await findExistingSubscription(customerId)

    if (existingSubscription) {
        await syncSubscription(await retrieveCurrentSubscription(existingSubscription))
        throw new BillingError("Your Endurra Pro membership is already active.", 409)
    }

    const openSession = await findOpenCheckoutSession(customerId, user.id)

    if (openSession) {
        return openSession
    }

    return getStripe().checkout.sessions.create(
        {
            mode:"subscription",
            customer:customerId,
            client_reference_id:String(user.id),
            line_items:[{price:getConfiguredPriceId(), quantity:1}],
            allow_promotion_codes:true,
            success_url:`${getFrontendUrl()}/profile?billing=success`,
            cancel_url:`${getFrontendUrl()}/profile?billing=canceled`,
            metadata:{
                userId:String(user.id),
                priceId:getConfiguredPriceId()
            },
            subscription_data:{
                metadata:{
                    userId:String(user.id),
                    priceId:getConfiguredPriceId()
                }
            }
        },
        {idempotencyKey:`endurra-checkout-${user.id}-${new Date().toISOString().slice(0, 13)}`}
    )
}

export const createPortalSession = async (userId) => {
    const user = await getBillingUser(userId)

    if (!user.stripe_customer_id) {
        throw new BillingError("No Stripe membership is connected to this account yet.", 409)
    }

    return getStripe().billingPortal.sessions.create({
        customer:user.stripe_customer_id,
        return_url:`${getFrontendUrl()}/profile?section=membership`
    })
}

export const getBillingStatus = async (userId) => {
    const user = await getBillingUser(userId)

    return {
        isPro:Boolean(user.is_pro),
        subscriptionStatus:user.subscription_status,
        currentPeriodEnd:user.subscription_current_period_end,
        canManageBilling:Boolean(user.stripe_customer_id)
    }
}

export const constructStripeEvent = (payload, signature) => {
    if (!signature) {
        throw new BillingError("Missing Stripe signature", 400)
    }

    return getStripe().webhooks.constructEvent(
        payload,
        signature,
        requireEnvironmentValue("STRIPE_WEBHOOK_SECRET")
    )
}

export const processStripeEvent = async (event) => {
    const supportedEventTypes = [
        "checkout.session.completed",
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted"
    ]

    if (!supportedEventTypes.includes(event.type)) {
        return
    }

    await validateConfiguredPrice()

    if (event.type === "checkout.session.completed") {
        const session = event.data.object

        if (session.mode !== "subscription" || !session.subscription) {
            return
        }

        const subscription = await getStripe().subscriptions.retrieve(stripeId(session.subscription), {
            expand:["items.data.price.product"]
        })

        await syncSubscription(subscription)
        return
    }

    if (event.type !== "checkout.session.completed") {
        const subscription = await retrieveCurrentSubscription(event.data.object)
        await syncSubscription(subscription)
    }
}
