'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { User, Shield, CreditCard, Plug } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProfileTab } from './profile-tab'
import { SecurityTab } from './security-tab'
import { BillingTab } from './billing-tab'
import { IntegrationsTab } from './integrations-tab'
import type { SubscriptionDetails } from '@/app/actions/stripe'

const VALID_TABS = ['profile', 'security', 'billing', 'integrations'] as const
type TabValue = (typeof VALID_TABS)[number]

interface AccountTabsProps {
  email: string
  avatarUrl: string | null
  fullName: string | null
  subscription: SubscriptionDetails
}

export function AccountTabs({ email, avatarUrl, fullName, subscription }: AccountTabsProps) {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const initialTab: TabValue = VALID_TABS.includes(tabParam as TabValue) ? (tabParam as TabValue) : 'profile'
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab)

  useEffect(() => {
    if (tabParam) {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [tabParam])

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="w-full">
      <TabsList className="mb-6 w-full justify-start">
        <TabsTrigger value="profile" className="gap-2">
          <User className="size-4" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="security" className="gap-2">
          <Shield className="size-4" />
          Security
        </TabsTrigger>
        <TabsTrigger value="billing" className="gap-2">
          <CreditCard className="size-4" />
          Billing
        </TabsTrigger>
        <TabsTrigger value="integrations" className="gap-2">
          <Plug className="size-4" />
          Integrations
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <ProfileTab email={email} avatarUrl={avatarUrl} fullName={fullName} />
      </TabsContent>

      <TabsContent value="security">
        <SecurityTab email={email} />
      </TabsContent>

      <TabsContent value="billing">
        <BillingTab subscription={subscription} upgradeUrl="/pricing" />
      </TabsContent>

      <TabsContent value="integrations">
        <IntegrationsTab isPro={subscription.isPro} />
      </TabsContent>
    </Tabs>
  )
}
