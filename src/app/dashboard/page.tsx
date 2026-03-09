import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Lock, ClipboardList } from 'lucide-react'

import { Header } from '@/components/features/header'
import { createClient } from '@/lib/supabase/server'
import { getDecksByUserId } from '@/db/queries/decks'
import { getCardCountsByDeckIds } from '@/db/queries/cards'
import { getTaskCountByUserId, getTaskCountsByDeckIds } from '@/db/queries/tasks'
import { Button } from '@/components/ui/button'
import { DeckCard } from '@/components/features/decks/deck-card'
import { CreateDeckDialog } from '@/components/features/decks/create-deck-dialog'
import { getUserSubscriptionStatus, syncSubscriptionFromStripe } from '@/app/actions/stripe'

const FREE_DECK_LIMIT = 3

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) {
    redirect('/')
  }

  const email = typeof data.claims.email === 'string' ? data.claims.email : ''
  const userId = data.claims.sub as string

  // Always sync subscription from Stripe to ensure accurate plan status
  // (handles webhook failures, portal downgrades, and cancellations)
  if (email) {
    await syncSubscriptionFromStripe(userId, email)
  }

  const [userDecks, { isPro }, taskCount] = await Promise.all([
    getDecksByUserId(userId),
    getUserSubscriptionStatus(email, userId),
    getTaskCountByUserId(userId),
  ])

  const deckIds = userDecks.map((d) => d.id)
  const [deckTaskCounts, deckCardCounts] = userDecks.length > 0
    ? await Promise.all([
        getTaskCountsByDeckIds(userId, deckIds),
        getCardCountsByDeckIds(userId, deckIds),
      ])
    : [{}, {}]

  const atLimit = !isPro && userDecks.length >= FREE_DECK_LIMIT

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <Header user={{ email }} />
      </div>
      <main className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Dashboard
            </h1>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              {userDecks.length > 0
                ? `You have ${userDecks.length} deck${userDecks.length === 1 ? '' : 's'}`
                : 'Create your first deck to get started'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                isPro
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'border-zinc-200 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'
              }`}>
                {isPro ? 'Pro plan' : 'Free plan'}
              </span>
              {!isPro && (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {userDecks.length} / {FREE_DECK_LIMIT} decks used
                </p>
              )}
            </div>
            {taskCount > 0 && (
              <Button size="sm" variant="outline" asChild>
                <Link href="/tasks">
                  <ClipboardList className="size-4" />
                  View Tasks ({taskCount})
                </Link>
              </Button>
            )}
            {atLimit ? (
              <Button size="sm" asChild>
                <Link href="/pricing">Upgrade to Pro</Link>
              </Button>
            ) : (
              <CreateDeckDialog deckCount={userDecks.length} isPro={isPro} />
            )}
          </div>
        </div>

        {userDecks.length > 0 ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {userDecks.map((deck, index) => {
              const isLocked = !isPro && index >= FREE_DECK_LIMIT

              if (isLocked) {
                return (
                  <div key={deck.id} className="relative">
                    <div className="pointer-events-none opacity-50">
                      <DeckCard deck={deck} />
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-zinc-900/10 backdrop-blur-[2px] dark:bg-zinc-950/40">
                      <Lock className="mb-2 size-5 text-zinc-600 dark:text-zinc-400" />
                      <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Upgrade to access
                      </p>
                      <Button size="sm" variant="outline" className="mt-2" asChild>
                        <Link href="/pricing">Upgrade</Link>
                      </Button>
                    </div>
                  </div>
                )
              }

              return (
                <Link key={deck.id} href={`/deck/${deck.id}`}>
                  <DeckCard deck={deck} taskCount={deckTaskCounts[deck.id] ?? 0} cardCount={deckCardCounts[deck.id] ?? 0} />
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="mt-12 text-center text-zinc-500 dark:text-zinc-400">
            <p>No decks yet. Click &quot;New Deck&quot; to create one.</p>
          </div>
        )}
      </main>
    </div>
  )
}
