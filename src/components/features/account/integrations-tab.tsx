'use client'

import { useState, useEffect, useTransition } from 'react'
import { ExternalLink, Unplug, Plug } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getZohoAuthUrl, getZohoConnectionStatus, disconnectZoho } from '@/app/actions/zoho'

interface IntegrationsTabProps {
  isPro: boolean
}

export function IntegrationsTab({ isPro }: IntegrationsTabProps) {
  const [connected, setConnected] = useState(false)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!isPro) {
      setLoading(false)
      return
    }

    getZohoConnectionStatus()
      .then((status) => {
        setConnected(status.connected)
        setOrgId(status.orgId)
      })
      .catch(() => {
        // Ignore errors
      })
      .finally(() => setLoading(false))
  }, [isPro])

  function handleConnect() {
    startTransition(async () => {
      const url = await getZohoAuthUrl()
      window.location.href = url
    })
  }

  function handleDisconnect() {
    startTransition(async () => {
      await disconnectZoho()
      setConnected(false)
      setOrgId(null)
    })
  }

  if (!isPro) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>
            Integrations are available for Pro subscribers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <a
            href="/pricing"
            className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Upgrade to Pro
          </a>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zoho Desk</CardTitle>
        <CardDescription>
          Connect your Zoho Desk account to create support tickets from study session results.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Status:
          </span>
          {connected ? (
            <Badge variant="default" className="bg-green-600 hover:bg-green-700">
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary">Not Connected</Badge>
          )}
        </div>

        {connected && orgId && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Organization ID:
            </span>
            <span className="text-sm text-zinc-500">{orgId}</span>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {connected ? (
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={isPending}
            >
              <Unplug className="mr-2 size-4" />
              {isPending ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          ) : (
            <Button onClick={handleConnect} disabled={isPending}>
              <Plug className="mr-2 size-4" />
              {isPending ? 'Connecting...' : 'Connect to Zoho Desk'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
