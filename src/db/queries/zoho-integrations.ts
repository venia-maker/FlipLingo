import { cache } from 'react'
import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { zohoIntegrations } from '@/db/schema'

export const getZohoIntegrationByUserId = cache(async (userId: string) => {
  const [integration] = await db.select({
    id: zohoIntegrations.id,
    userId: zohoIntegrations.userId,
    accessToken: zohoIntegrations.accessToken,
    refreshToken: zohoIntegrations.refreshToken,
    orgId: zohoIntegrations.orgId,
    tokenExpiresAt: zohoIntegrations.tokenExpiresAt,
    createdAt: zohoIntegrations.createdAt,
    updatedAt: zohoIntegrations.updatedAt,
  }).from(zohoIntegrations).where(eq(zohoIntegrations.userId, userId))

  return integration ?? null
})

export async function upsertZohoIntegration(values: {
  userId: string
  accessToken: string
  refreshToken: string
  orgId?: string | null
  tokenExpiresAt: Date
}) {
  const [result] = await db.insert(zohoIntegrations)
    .values({
      ...values,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: zohoIntegrations.userId,
      set: {
        accessToken: values.accessToken,
        refreshToken: values.refreshToken,
        orgId: values.orgId ?? undefined,
        tokenExpiresAt: values.tokenExpiresAt,
        updatedAt: new Date(),
      },
    })
    .returning({ id: zohoIntegrations.id })

  return result
}

export async function updateZohoTokens(
  userId: string,
  accessToken: string,
  tokenExpiresAt: Date,
) {
  const [result] = await db.update(zohoIntegrations)
    .set({ accessToken, tokenExpiresAt, updatedAt: new Date() })
    .where(eq(zohoIntegrations.userId, userId))
    .returning({ id: zohoIntegrations.id })

  return result ?? null
}

export async function deleteZohoIntegration(userId: string) {
  await db.delete(zohoIntegrations).where(eq(zohoIntegrations.userId, userId))
}
