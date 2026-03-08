import { cache } from 'react'
import { desc, eq } from 'drizzle-orm'

import { db } from '@/db'
import { subscriptions, subscriptionHistory } from '@/db/schema'

export const getSubscriptionByUserId = cache(async (userId: string) => {
  const [sub] = await db.select({
    id: subscriptions.id,
    userId: subscriptions.userId,
    stripeCustomerId: subscriptions.stripeCustomerId,
    stripeSubscriptionId: subscriptions.stripeSubscriptionId,
    status: subscriptions.status,
    priceId: subscriptions.priceId,
    amount: subscriptions.amount,
    interval: subscriptions.interval,
    currentPeriodEnd: subscriptions.currentPeriodEnd,
    cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
    cancelAt: subscriptions.cancelAt,
    createdAt: subscriptions.createdAt,
    updatedAt: subscriptions.updatedAt,
  }).from(subscriptions).where(eq(subscriptions.userId, userId))

  return sub ?? null
})

export async function upsertSubscription(values: {
  userId: string
  stripeCustomerId: string
  stripeSubscriptionId: string
  status: string
  priceId: string | null
  amount: number | null
  interval: string | null
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
  cancelAt: Date | null
}) {
  const [result] = await db.insert(subscriptions)
    .values({
      ...values,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        stripeCustomerId: values.stripeCustomerId,
        stripeSubscriptionId: values.stripeSubscriptionId,
        status: values.status,
        priceId: values.priceId,
        amount: values.amount,
        interval: values.interval,
        currentPeriodEnd: values.currentPeriodEnd,
        cancelAtPeriodEnd: values.cancelAtPeriodEnd,
        cancelAt: values.cancelAt,
        updatedAt: new Date(),
      },
    })
    .returning({ id: subscriptions.id })

  return result
}

export async function deleteSubscriptionByUserId(userId: string) {
  await db.delete(subscriptions).where(eq(subscriptions.userId, userId))
}

export async function createSubscriptionHistoryEntry(values: {
  userId: string
  stripeSubscriptionId: string
  eventType: string
  status: string
  priceId: string | null
  amount: number | null
  interval: string | null
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
  cancelAt: Date | null
}) {
  const [result] = await db.insert(subscriptionHistory)
    .values(values)
    .returning({ id: subscriptionHistory.id })

  return result
}

export const getSubscriptionHistoryByUserId = cache(async (userId: string, limit = 20, offset = 0) => {
  return db.select({
    id: subscriptionHistory.id,
    userId: subscriptionHistory.userId,
    stripeSubscriptionId: subscriptionHistory.stripeSubscriptionId,
    eventType: subscriptionHistory.eventType,
    status: subscriptionHistory.status,
    priceId: subscriptionHistory.priceId,
    amount: subscriptionHistory.amount,
    interval: subscriptionHistory.interval,
    currentPeriodEnd: subscriptionHistory.currentPeriodEnd,
    cancelAtPeriodEnd: subscriptionHistory.cancelAtPeriodEnd,
    cancelAt: subscriptionHistory.cancelAt,
    createdAt: subscriptionHistory.createdAt,
  })
    .from(subscriptionHistory)
    .where(eq(subscriptionHistory.userId, userId))
    .orderBy(desc(subscriptionHistory.createdAt))
    .limit(limit)
    .offset(offset)
})
