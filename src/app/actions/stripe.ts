'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { getSubscriptionByUserId } from '@/db/queries/subscriptions'

export interface SubscriptionDetails {
  isPro: boolean
  status: string | null
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
  priceId: string | null
  amount: number | null
  interval: string | null
}

const NO_SUB: SubscriptionDetails = {
  isPro: false,
  status: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  priceId: null,
  amount: null,
  interval: null,
}

export async function getUserSubscriptionStatus(_email: string, userId?: string): Promise<{ isPro: boolean }> {
  if (!userId) return { isPro: false }

  const sub = await getSubscriptionByUserId(userId)
  const isPro = sub?.status === 'active' || (
    sub?.cancelAtPeriodEnd === true && sub?.currentPeriodEnd !== null && sub.currentPeriodEnd > new Date()
  )
  return { isPro }
}

export async function getSubscriptionDetailsByUserId(userId: string): Promise<SubscriptionDetails> {
  const sub = await getSubscriptionByUserId(userId)
  if (!sub) return NO_SUB

  const isActiveOrCanceling = sub.status === 'active' || (
    sub.cancelAtPeriodEnd === true && sub.currentPeriodEnd !== null && sub.currentPeriodEnd > new Date()
  )

  return {
    isPro: isActiveOrCanceling,
    status: sub.status,
    currentPeriodEnd: sub.currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
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

      return {
        isPro: sub.status === 'active',
        status: sub.status,
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        priceId: item?.price?.id ?? null,
        amount: item?.price?.unit_amount ? item.price.unit_amount / 100 : null,
        interval: item?.price?.recurring?.interval ?? null,
      }
    }

    return NO_SUB
  }

  const sub = subscriptions.data[0]
  const item = sub.items.data[0]

  return {
    isPro: true,
    status: sub.status,
    currentPeriodEnd: item?.current_period_end ? new Date(item.current_period_end * 1000) : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    priceId: item?.price?.id ?? null,
    amount: item?.price?.unit_amount ? item.price.unit_amount / 100 : null,
    interval: item?.price?.recurring?.interval ?? null,
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

  const session = await stripe.billingPortal.sessions.create({
    customer: customers.data[0].id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/account`,
  })

  redirect(session.url)
}

export async function createCheckoutSessionAction(priceId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()

  if (error || !data?.claims) {
    redirect('/auth/sign-up')
  }

  const userId = data.claims.sub as string
  const email = typeof data.claims.email === 'string' ? data.claims.email : undefined

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/dashboard?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/pricing`,
    subscription_data: { metadata: { userId } },
    metadata: { userId },
  })

  if (!session.url) {
    throw new Error('Failed to create checkout session')
  }

  redirect(session.url)
}
