import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

import { stripe } from '@/lib/stripe'
import { upsertSubscription, createSubscriptionHistoryEntry } from '@/db/queries/subscriptions'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? ''

async function resolveUserId(subscription: Stripe.Subscription): Promise<string | null> {
  // 1. Check subscription metadata
  if (subscription.metadata?.userId) {
    return subscription.metadata.userId
  }

  // 2. Fallback: look up Supabase user by customer email
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id
  const customer = await stripe.customers.retrieve(customerId)
  if (customer.deleted || !customer.email) return null

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  )

  const { data } = await supabase.auth.admin.listUsers()
  const user = data?.users?.find((u) => u.email === customer.email)
  if (!user) return null

  // Backfill the userId onto the Stripe subscription for future webhooks
  await stripe.subscriptions.update(subscription.id, {
    metadata: { userId: user.id },
  })

  return user.id
}

async function syncSubscription(subscription: Stripe.Subscription, eventType: string) {
  const userId = await resolveUserId(subscription)
  if (!userId) return

  const item = subscription.items.data[0]
  const currentPeriodEnd = item?.current_period_end
    ? new Date(item.current_period_end * 1000)
    : null
  const cancelAt = subscription.cancel_at
    ? new Date(subscription.cancel_at * 1000)
    : null

  const shared = {
    stripeSubscriptionId: subscription.id,
    status: subscription.status,
    priceId: item?.price?.id ?? null,
    amount: item?.price?.unit_amount ?? null,
    interval: item?.price?.recurring?.interval ?? null,
    currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    cancelAt,
  }

  await Promise.all([
    upsertSubscription({
      userId,
      stripeCustomerId: typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer.id,
      ...shared,
    }),
    createSubscriptionHistoryEntry({
      userId,
      eventType,
      ...shared,
    }),
  ])
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature || !webhookSecret) {
    console.error('[Stripe Webhook] Missing signature or STRIPE_WEBHOOK_SECRET')
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Stripe Webhook] Verification failed:', message)
    return NextResponse.json({ error: `Webhook verification failed: ${message}` }, { status: 400 })
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const eventType = event.type.replace('customer.subscription.', '')
      await syncSubscription(subscription, eventType)
      break
    }

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.subscription) {
        const subId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription.id

        // Backfill userId metadata on the subscription
        if (session.metadata?.userId) {
          await stripe.subscriptions.update(subId, {
            metadata: { userId: session.metadata.userId },
          })
        }

        // Also sync the subscription to DB immediately
        const subscription = await stripe.subscriptions.retrieve(subId)
        await syncSubscription(subscription, 'created')
      }
      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}
