import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core'

export const zohoIntegrations = pgTable('zoho_integrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().unique(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  orgId: text('org_id'),
  tokenExpiresAt: timestamp('token_expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('zoho_integrations_user_id_idx').on(table.userId),
])

export type ZohoIntegration = typeof zohoIntegrations.$inferSelect
export type NewZohoIntegration = typeof zohoIntegrations.$inferInsert
