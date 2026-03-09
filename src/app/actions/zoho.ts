'use server'

import { createClient } from '@/lib/supabase/server'
import { encryptToken, decryptToken } from '@/lib/crypto'
import {
  getZohoIntegrationByUserId,
  upsertZohoIntegration,
  updateZohoTokens,
  deleteZohoIntegration,
} from '@/db/queries/zoho-integrations'
import { getUserSubscriptionStatus } from '@/app/actions/stripe'
import {
  ZOHO_CLIENT_ID,
  ZOHO_CLIENT_SECRET,
  ZOHO_REDIRECT_URI,
  ZOHO_AUTH_URL,
  ZOHO_TOKEN_URL,
  ZOHO_DESK_API_BASE,
  ZOHO_SCOPES,
} from '@/lib/zoho/config'

async function getAuthenticatedUserId(): Promise<string> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) {
    throw new Error('Not authenticated')
  }
  return data.claims.sub as string
}

async function requirePro(userId: string): Promise<void> {
  const { isPro } = await getUserSubscriptionStatus('', userId)
  if (!isPro) {
    throw new Error('Pro subscription required for Zoho Desk integration')
  }
}

export async function getZohoAuthUrl(): Promise<string> {
  const userId = await getAuthenticatedUserId()
  await requirePro(userId)

  const params = new URLSearchParams({
    scope: ZOHO_SCOPES,
    client_id: ZOHO_CLIENT_ID,
    response_type: 'code',
    access_type: 'offline',
    redirect_uri: ZOHO_REDIRECT_URI,
    prompt: 'consent',
  })

  return `${ZOHO_AUTH_URL}?${params.toString()}`
}

export async function exchangeZohoCode(code: string): Promise<{ success: boolean; error?: string }> {
  const userId = await getAuthenticatedUserId()
  await requirePro(userId)

  const tokenResponse = await fetch(ZOHO_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET,
      redirect_uri: ZOHO_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text()
    return { success: false, error: `Token exchange failed: ${errorText}` }
  }

  const tokenData = await tokenResponse.json() as {
    access_token: string
    refresh_token: string
    expires_in: number
    error?: string
  }

  if (tokenData.error) {
    return { success: false, error: tokenData.error }
  }

  const encryptedAccess = encryptToken(tokenData.access_token)
  const encryptedRefresh = encryptToken(tokenData.refresh_token)
  const tokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000)

  await upsertZohoIntegration({
    userId,
    accessToken: encryptedAccess,
    refreshToken: encryptedRefresh,
    tokenExpiresAt,
  })

  // Fetch org ID
  try {
    const orgResponse = await fetch(`${ZOHO_DESK_API_BASE}/organizations`, {
      headers: { Authorization: `Zoho-oauthtoken ${tokenData.access_token}` },
    })
    if (orgResponse.ok) {
      const orgData = await orgResponse.json() as { data: Array<{ id: string }> }
      if (orgData.data?.[0]?.id) {
        await upsertZohoIntegration({
          userId,
          accessToken: encryptedAccess,
          refreshToken: encryptedRefresh,
          orgId: orgData.data[0].id,
          tokenExpiresAt,
        })
      }
    }
  } catch {
    // Org ID fetch is optional, continue without it
  }

  return { success: true }
}

export async function disconnectZoho(): Promise<void> {
  const userId = await getAuthenticatedUserId()
  await deleteZohoIntegration(userId)
}

export async function getZohoConnectionStatus(): Promise<{
  connected: boolean
  orgId: string | null
}> {
  const userId = await getAuthenticatedUserId()
  const integration = await getZohoIntegrationByUserId(userId)

  if (!integration) {
    return { connected: false, orgId: null }
  }

  return { connected: true, orgId: integration.orgId }
}

export async function getValidAccessToken(userId: string): Promise<string> {
  const integration = await getZohoIntegrationByUserId(userId)
  if (!integration) {
    throw new Error('Zoho Desk is not connected')
  }

  const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000)

  if (integration.tokenExpiresAt > fiveMinutesFromNow) {
    return decryptToken(integration.accessToken)
  }

  return refreshZohoToken(userId)
}

export async function refreshZohoToken(userId: string): Promise<string> {
  const integration = await getZohoIntegrationByUserId(userId)
  if (!integration) {
    throw new Error('Zoho Desk is not connected')
  }

  const refreshToken = decryptToken(integration.refreshToken)

  const response = await fetch(ZOHO_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: ZOHO_CLIENT_ID,
      client_secret: ZOHO_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to refresh Zoho token')
  }

  const data = await response.json() as {
    access_token: string
    expires_in: number
  }

  const encryptedAccess = encryptToken(data.access_token)
  const tokenExpiresAt = new Date(Date.now() + data.expires_in * 1000)

  await updateZohoTokens(userId, encryptedAccess, tokenExpiresAt)

  return data.access_token
}
