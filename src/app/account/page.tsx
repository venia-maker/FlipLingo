import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { getSubscriptionDetailsByUserId } from '@/app/actions/stripe'
import { Header } from '@/components/features/header'
import { AccountTabs } from '@/components/features/account/account-tabs'
import { Button } from '@/components/ui/button'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const email = user.email ?? ''
  const avatarUrl = (user.user_metadata?.avatar_url as string) ?? null
  const fullName = (user.user_metadata?.full_name as string) ?? null
  const subscription = await getSubscriptionDetailsByUserId(user.id)

  return (
    <div className="relative flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <Header user={{ email }} />
      </div>

      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Manage Account
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your profile, security settings, and subscription.
          </p>
        </div>

        <AccountTabs
          email={email}
          avatarUrl={avatarUrl}
          fullName={fullName}
          subscription={subscription}
        />
      </main>
    </div>
  )
}
