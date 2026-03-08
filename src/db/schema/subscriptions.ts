import { pgTable, uuid, text, timestamp, boolean, integer, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().unique(),
  stripeCustomerId: text('stripe_customer_id').notNull(),
  stripeSubscriptionId: text('stripe_subscription_id').notNull(),
  status: text('status').notNull(), // 'active', 'canceled', 'past_due', etc.
  priceId: text('price_id'),
  amount: integer('amount'), // in cents
  interval: text('interval'), // 'month' or 'year'
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),
  cancelAt: timestamp('cancel_at'), // Stripe scheduled cancellation date
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const subscriptionsRelations = relations(subscriptions, ({ many }) => ({
  history: many(subscriptionHistory),
}))

export const subscriptionHistory = pgTable('subscription_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  stripeSubscriptionId: text('stripe_subscription_id').notNull(),
  eventType: text('event_type').notNull(), // 'created', 'updated', 'deleted'
  status: text('status').notNull(),
  priceId: text('price_id'),
  amount: integer('amount'), // in cents
  interval: text('interval'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),
  cancelAt: timestamp('cancel_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('sub_history_user_id_idx').on(table.userId),
  index('sub_history_stripe_sub_id_idx').on(table.stripeSubscriptionId),
])

export const subscriptionHistoryRelations = relations(subscriptionHistory, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [subscriptionHistory.userId],
    references: [subscriptions.userId],
  }),
}))

export type Subscription = typeof subscriptions.$inferSelect
export type NewSubscription = typeof subscriptions.$inferInsert
export type SubscriptionHistory = typeof subscriptionHistory.$inferSelect
export type NewSubscriptionHistory = typeof subscriptionHistory.$inferInsert
