import { redirect } from 'next/navigation'
import Link from 'next/link'

import { Header } from '@/components/features/header'
import { createClient } from '@/lib/supabase/server'
import { getDecksByUserId } from '@/db/queries/decks'
import { DeckCard } from '@/components/features/decks/deck-card'
import { CreateDeckDialog } from '@/components/features/decks/create-deck-dialog'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) {
    redirect('/')
  }

  const email = typeof data.claims.email === 'string' ? data.claims.email : ''
  const userId = data.claims.sub as string

  const userDecks = await getDecksByUserId(userId)

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
          <CreateDeckDialog />
        </div>

        {userDecks.length > 0 ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {userDecks.map((deck) => (
              <Link key={deck.id} href={`/deck/${deck.id}`}>
                <DeckCard deck={deck} />
              </Link>
            ))}
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
