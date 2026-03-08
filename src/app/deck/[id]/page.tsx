import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { getDeckById, getDecksByUserId } from '@/db/queries/decks'
import { getCardsByDeckId } from '@/db/queries/cards'
import { getUserSubscriptionStatus } from '@/app/actions/stripe'
import { Header } from '@/components/features/header'
import { DeckActions } from '@/components/features/decks/deck-actions'
import { DeckContent } from '@/components/features/decks/deck-content'
import { Button } from '@/components/ui/button'

const difficultyColors: Record<string, string> = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  high: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  mixed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
}

interface DeckPageProps {
  params: Promise<{ id: string }>
}

export default async function DeckPage({ params }: DeckPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) redirect('/')

  const email = typeof data.claims.email === 'string' ? data.claims.email : ''
  const userId = data.claims.sub as string

  const [deck, { isPro }] = await Promise.all([
    getDeckById(id, userId),
    getUserSubscriptionStatus(email, userId),
  ])
  if (!deck) redirect('/dashboard')

  // Block access to decks beyond the free limit
  if (!isPro) {
    const allDecks = await getDecksByUserId(userId)
    const allowedIds = new Set(allDecks.slice(0, 3).map((d) => d.id))
    if (!allowedIds.has(id)) {
      redirect('/dashboard')
    }
  }

  const cards = await getCardsByDeckId(id)

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <Header user={{ email }} />
      </div>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="size-4" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {deck.title}
            </h1>
            {deck.description && (
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">{deck.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <DeckActions deck={deck} />
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${difficultyColors[deck.difficulty] ?? ''}`}
            >
              {deck.difficulty}
            </span>
          </div>
        </div>

        <DeckContent deckId={id} isPro={isPro} initialCards={cards} difficulty={deck.difficulty} />
      </main>
    </div>
  )
}
