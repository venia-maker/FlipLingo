'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { getSubscriptionByUserId, upsertSubscription, createSubscriptionHistoryEntry, deleteSubscriptionByUserId } from '@/db/queries/subscriptions'

async function getBaseUrl(): Promise<string> {
  const h = await headers()
  const host = h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'https'
  if (host) return `${proto}://${host}`
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
}

export interface SubscriptionDetails {
  isPro: boolean
  status: string | null
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
  cancelAt: Date | null
  priceId: string | null
  amount: number | null
  interval: string | null
}

const NO_SUB: SubscriptionDetails = {
  isPro: false,
  status: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  cancelAt: null,
  priceId: null,
  amount: null,
  interval: null,
}

/** Check if subscription has a pending cancellation (either via cancel_at_period_end or cancel_at) */
function hasPendingCancellation(cancelAtPeriodEnd: boolean, cancelAt: Date | null): boolean {
  return cancelAtPeriodEnd || (cancelAt !== null && cancelAt > new Date())
}

export async function getUserSubscriptionStatus(email: string, userId?: string): Promise<{ isPro: boolean }> {
  if (!userId) return { isPro: false }

  let sub = await getSubscriptionByUserId(userId)

  // If no DB record, sync from Stripe as fallback (handles webhook failures / race conditions)
  if (!sub && email) {
    await syncSubscriptionFromStripe(userId, email)
    sub = await getSubscriptionByUserId(userId)
  }

  if (!sub) return { isPro: false }
  const pendingCancel = hasPendingCancellation(sub.cancelAtPeriodEnd, sub.cancelAt)
  const isPro = sub.status === 'active' || (
    pendingCancel && sub.currentPeriodEnd !== null && sub.currentPeriodEnd > new Date()
  )
  return { isPro }
}

export async function getSubscriptionDetailsByUserId(userId: string): Promise<SubscriptionDetails> {
  const sub = await getSubscriptionByUserId(userId)
  if (!sub) return NO_SUB

  // Refresh from Stripe to ensure we have the latest cancellation and billing data
  if (sub.stripeSubscriptionId) {
    try {
      const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId)

      if (typeof stripeSub !== 'object' || !('status' in stripeSub)) {
        // Subscription was deleted from Stripe
        return NO_SUB
      }

      const item = stripeSub.items.data[0]
      const periodEndTimestamp = item?.current_period_end ?? null
      const currentPeriodEnd = periodEndTimestamp
        ? new Date(periodEndTimestamp * 1000)
        : null
      const cancelAtPeriodEnd = stripeSub.cancel_at_period_end
      const cancelAt = stripeSub.cancel_at
        ? new Date(stripeSub.cancel_at * 1000)
        : null

      // Sync fresh data back to DB and record history
      const shared = {
        stripeSubscriptionId: stripeSub.id,
        status: stripeSub.status,
        priceId: item?.price?.id ?? null,
        amount: item?.price?.unit_amount ?? null,
        interval: item?.price?.recurring?.interval ?? null,
        currentPeriodEnd,
        cancelAtPeriodEnd,
        cancelAt,
      }

      await Promise.all([
        upsertSubscription({
          userId,
          stripeCustomerId: typeof stripeSub.customer === 'string'
            ? stripeSub.customer
            : stripeSub.customer.id,
          ...shared,
        }),
        createSubscriptionHistoryEntry({
          userId,
          eventType: 'sync',
          ...shared,
        }),
      ])

      const pendingCancel = hasPendingCancellation(cancelAtPeriodEnd, cancelAt)
      const isActiveOrCanceling = stripeSub.status === 'active' || (
        pendingCancel && currentPeriodEnd !== null && currentPeriodEnd > new Date()
      )

      return {
        isPro: isActiveOrCanceling,
        status: stripeSub.status,
        currentPeriodEnd,
        cancelAtPeriodEnd: pendingCancel,
        cancelAt,
        priceId: item?.price?.id ?? null,
        amount: item?.price?.unit_amount ? item.price.unit_amount / 100 : null,
        interval: item?.price?.recurring?.interval ?? null,
      }
    } catch {
      // Fall through to DB data if Stripe fetch fails
    }
  }

  const pendingCancel = hasPendingCancellation(sub.cancelAtPeriodEnd, sub.cancelAt)
  const isActiveOrCanceling = sub.status === 'active' || (
    pendingCancel && sub.currentPeriodEnd !== null && sub.currentPeriodEnd > new Date()
  )

  return {
    isPro: isActiveOrCanceling,
    status: sub.status,
    currentPeriodEnd: sub.currentPeriodEnd,
    cancelAtPeriodEnd: pendingCancel,
    cancelAt: sub.cancelAt,
    priceId: sub.priceId,
    amount: sub.amount ? sub.amount / 100 : null,
    interval: sub.interval,
  }
}

export async function getUserSubscriptionDetails(email: string): Promise<SubscriptionDetails> {
  const customers = await stripe.customers.list({ email, limit: 1 })
  if (customers.data.length === 0) return NO_SUB

  const subscriptions = await stripe.subscriptions.list({
    customer: customers.data[0].id,
    status: 'active',
    limit: 1,
  })

  if (subscriptions.data.length === 0) {
    // Check for canceled-but-still-active-until-period-end subscriptions
    const allSubs = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      limit: 1,
    })

    if (allSubs.data.length > 0) {
      const sub = allSubs.data[0]
      const item = sub.items.data[0]
      const periodEnd = item?.current_period_end ?? null

      const cancelAt = sub.cancel_at ? new Date(sub.cancel_at * 1000) : null
      return {
        isPro: sub.status === 'active',
        status: sub.status,
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
        cancelAtPeriodEnd: hasPendingCancellation(sub.cancel_at_period_end, cancelAt),
        cancelAt,
        priceId: item?.price?.id ?? null,
        amount: item?.price?.unit_amount ? item.price.unit_amount / 100 : null,
        interval: item?.price?.recurring?.interval ?? null,
      }
    }

    return NO_SUB
  }

  const sub = subscriptions.data[0]
  const item = sub.items.data[0]

  const cancelAt = sub.cancel_at ? new Date(sub.cancel_at * 1000) : null
  return {
    isPro: true,
    status: sub.status,
    currentPeriodEnd: item?.current_period_end ? new Date(item.current_period_end * 1000) : null,
    cancelAtPeriodEnd: hasPendingCancellation(sub.cancel_at_period_end, cancelAt),
    cancelAt,
    priceId: item?.price?.id ?? null,
    amount: item?.price?.unit_amount ? item.price.unit_amount / 100 : null,
    interval: item?.price?.recurring?.interval ?? null,
  }
}

/** Sync subscription from Stripe to DB (used after checkout and as webhook fallback) */
export async function syncSubscriptionFromStripe(userId: string, email: string): Promise<void> {
  try {
    const customers = await stripe.customers.list({ email, limit: 1 })
    if (customers.data.length === 0) {
      // No Stripe customer — clean up any stale DB record
      await deleteSubscriptionByUserId(userId)
      return
    }

    // Fetch all subscriptions (including canceled) to get accurate status
    const subs = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      limit: 1,
    })

    if (subs.data.length === 0) {
      // No active subscription found — the subscription was fully canceled.
      // Delete the stale DB record so the user is correctly shown as Free.
      await deleteSubscriptionByUserId(userId)
      return
    }

    const sub = subs.data[0]
    const item = sub.items.data[0]
    const currentPeriodEnd = item?.current_period_end
      ? new Date(item.current_period_end * 1000)
      : null
    const cancelAt = sub.cancel_at
      ? new Date(sub.cancel_at * 1000)
      : null

    const shared = {
      stripeSubscriptionId: sub.id,
      status: sub.status,
      priceId: item?.price?.id ?? null,
      amount: item?.price?.unit_amount ?? null,
      interval: item?.price?.recurring?.interval ?? null,
      currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      cancelAt,
    }

    await Promise.all([
      upsertSubscription({
        userId,
        stripeCustomerId: customers.data[0].id,
        ...shared,
      }),
      createSubscriptionHistoryEntry({
        userId,
        eventType: 'sync',
        ...shared,
      }),
    ])

    // Backfill userId onto the Stripe subscription metadata
    if (!sub.metadata?.userId) {
      await stripe.subscriptions.update(sub.id, {
        metadata: { userId },
      })
    }
  } catch (e) {
    console.error('[Stripe] syncSubscriptionFromStripe failed:', e)
  }
}

export async function createBillingPortalSession() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()

  if (error || !data?.claims) {
    redirect('/auth/login')
  }

  const email = typeof data.claims.email === 'string' ? data.claims.email : undefined
  if (!email) throw new Error('No email found')

  const customers = await stripe.customers.list({ email, limit: 1 })
  if (customers.data.length === 0) {
    throw new Error('No Stripe customer found')
  }

  const baseUrl = await getBaseUrl()
  const session = await stripe.billingPortal.sessions.create({
    customer: customers.data[0].id,
    return_url: `${baseUrl}/account`,
  })

  redirect(session.url)
}

export async function createCheckoutSessionAction(priceId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()

  if (error || !data?.claims) {
    redirect('/auth/sign-up')
  }

  if (!priceId) {
    redirect('/pricing?error=checkout_failed')
  }

  const userId = data.claims.sub as string
  const email = typeof data.claims.email === 'string' ? data.claims.email : undefined

  const baseUrl = await getBaseUrl()

  let checkoutUrl: string | null = null
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/dashboard?checkout=success`,
      cancel_url: `${baseUrl}/pricing`,
      subscription_data: { metadata: { userId } },
      metadata: { userId },
    })
    checkoutUrl = session.url
  } catch (e) {
    console.error('[Stripe] Checkout session creation failed:', e)
  }

  if (!checkoutUrl) {
    redirect('/pricing?error=checkout_failed')
  }

  redirect(checkoutUrl)
}
