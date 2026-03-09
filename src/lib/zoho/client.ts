import { ZOHO_DESK_API_BASE } from './config'
import { getValidAccessToken } from '@/app/actions/zoho'
import { db } from '@/db'
import { zohoIntegrations } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { decryptToken } from '@/lib/crypto'

type ZohoFetchOptions = {
  method?: string
  body?: Record<string, unknown>
  headers?: Record<string, string>
}

export async function zohoFetch<T = unknown>(
  userId: string,
  path: string,
  options: ZohoFetchOptions = {}
): Promise<T> {
  const integration = await db
    .select({ orgId: zohoIntegrations.orgId, accessToken: zohoIntegrations.accessToken })
    .from(zohoIntegrations)
    .where(eq(zohoIntegrations.userId, userId))
    .limit(1)
    .then((rows) => rows[0])

  if (!integration) {
    throw new Error('Zoho Desk is not connected')
  }

  const accessToken = await getValidAccessToken(userId)
  const orgId = integration.orgId

  const makeRequest = async (token: string): Promise<Response> => {
    return fetch(`${ZOHO_DESK_API_BASE}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json',
        ...(orgId ? { orgId } : {}),
        ...options.headers,
      },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    })
  }

  let response = await makeRequest(accessToken)

  if (response.status === 401) {
    const refreshedToken = await getValidAccessToken(userId)
    response = await makeRequest(refreshedToken)
  }

  if (!response.ok) {
    const errorText = await response.text()
    if (response.status === 403 && errorText.includes('SCOPE_MISMATCH')) {
      throw new Error('Zoho permissions need updating. Please disconnect and reconnect Zoho Desk in your account settings.')
    }
    throw new Error(`Zoho API error (${response.status}): ${errorText}`)
  }

  return response.json() as Promise<T>
}
