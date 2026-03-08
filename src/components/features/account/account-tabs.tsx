'use client'

import { User, Shield, CreditCard } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProfileTab } from './profile-tab'
import { SecurityTab } from './security-tab'
import { BillingTab } from './billing-tab'
import type { SubscriptionDetails } from '@/app/actions/stripe'

interface AccountTabsProps {
  email: string
  avatarUrl: string | null
  fullName: string | null
  subscription: SubscriptionDetails
}

export function AccountTabs({ email, avatarUrl, fullName, subscription }: AccountTabsProps) {
  return (
    <Tabs defaultValue="profile" className="w-full">
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
    </Tabs>
  )
}
