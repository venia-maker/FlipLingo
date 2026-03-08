'use client'

import { useState } from 'react'
import { CreditCard, ExternalLink } from 'lucide-react'

import { createBillingPortalSession } from '@/app/actions/stripe'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { SubscriptionDetails } from '@/app/actions/stripe'

interface BillingTabProps {
  subscription: SubscriptionDetails
  upgradeUrl: string
}

export function BillingTab({ subscription, upgradeUrl }: BillingTabProps) {
  const [loading, setLoading] = useState(false)

  const handleManageBilling = async () => {
    setLoading(true)
    try {
      await createBillingPortalSession()
    } catch (err) {
      const digest = (err as Record<string, unknown>)?.digest
      if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) return
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Manage your subscription and billing details.</CardDescription>
            </div>
            {subscription.cancelAtPeriodEnd ? (
              <Badge variant="destructive" className="text-sm">
                Canceling
              </Badge>
            ) : (
              <Badge variant={subscription.isPro ? 'default' : 'secondary'} className="text-sm">
                {subscription.isPro ? 'Pro' : 'Free'}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription.isPro ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Plan</span>
                <span className="text-sm font-medium">Pro</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="text-sm font-medium">
                  ${subscription.amount}/{subscription.interval}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="outline" className="capitalize">
                  {subscription.status}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {subscription.cancelAtPeriodEnd ? 'Expires on' : 'Next billing date'}
                </span>
                <span className="text-sm font-medium">
                  {subscription.currentPeriodEnd
                    ? new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—'}
                </span>
              </div>
              {subscription.cancelAtPeriodEnd && (
                <>
                  <Separator />
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Cancellation scheduled
                    </p>
                    <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                      Your Pro plan will remain active until{' '}
                      <span className="font-medium">
                        {subscription.currentPeriodEnd?.toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      . After that, you&apos;ll be downgraded to the Free plan and only your first 3 decks will remain accessible.
                    </p>
                    <Button
                      onClick={handleManageBilling}
                      disabled={loading}
                      size="sm"
                      className="mt-3"
                    >
                      {loading ? 'Redirecting...' : 'Resubscribe'}
                    </Button>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <CreditCard className="mx-auto mb-3 size-8 text-muted-foreground" />
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                You&apos;re on the Free plan
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Upgrade to Pro to unlock unlimited decks, AI flashcard generation, and more.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-3">
          {subscription.isPro ? (
            <Button onClick={handleManageBilling} disabled={loading} variant="outline">
              <ExternalLink className="mr-2 size-4" />
              {loading ? 'Redirecting...' : 'Manage billing'}
            </Button>
          ) : (
            <Button asChild>
              <a href={upgradeUrl}>Upgrade to Pro</a>
            </Button>
          )}
        </CardFooter>
      </Card>

      {subscription.isPro && (
        <Card>
          <CardHeader>
            <CardTitle>Need to change your plan?</CardTitle>
            <CardDescription>
              You can upgrade, downgrade, or cancel your subscription through the Stripe billing portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The billing portal allows you to update your payment method, view invoice history,
              and manage your subscription plan.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={handleManageBilling} disabled={loading}>
              {loading ? 'Redirecting...' : 'Open billing portal'}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
