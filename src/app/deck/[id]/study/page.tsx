import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { getDeckById } from '@/db/queries/decks'
import { getCardsByDeckId } from '@/db/queries/cards'
import { Header } from '@/components/features/header'
import { Button } from '@/components/ui/button'
import { StudySession } from '@/components/features/decks/study-session'

interface StudyPageProps {
  params: Promise<{ id: string }>
}

export default async function StudyPage({ params }: StudyPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) redirect('/')

  const email = typeof data.claims.email === 'string' ? data.claims.email : ''
  const userId = data.claims.sub as string

  const deck = await getDeckById(id, userId)
  if (!deck) redirect('/dashboard')

  const cards = await getCardsByDeckId(id)
  if (cards.length === 0) redirect(`/deck/${id}`)

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <Header user={{ email }} />
      </div>
      <main className="mx-auto max-w-2xl px-6 py-12">
        <Link href={`/deck/${id}`}>
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="size-4" />
            Back to Deck
          </Button>
        </Link>
        <StudySession
          deckId={id}
          deckTitle={deck.title}
          cards={cards.map((c) => ({ id: c.id, front: c.front, back: c.back }))}
        />
      </main>
    </div>
  )
}
