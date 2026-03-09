'use server'

import { createClient } from '@/lib/supabase/server'
import { insertStudySession, getStudySessionsByDeck } from '@/db/queries/study-sessions'

interface CardResultInput {
  cardId: string
  front: string
  back: string
  correct: boolean
}

export async function saveStudySession(data: {
  deckId: string
  totalCards: number
  correctCount: number
  incorrectCount: number
  scorePercent: number
  cardResults: CardResultInput[]
}) {
  const supabase = await createClient()
  const { data: authData, error } = await supabase.auth.getClaims()
  if (error || !authData?.claims) {
    throw new Error('Not authenticated')
  }

  const userId = authData.claims.sub as string

  const session = await insertStudySession({
    userId,
    deckId: data.deckId,
    totalCards: data.totalCards,
    correctCount: data.correctCount,
    incorrectCount: data.incorrectCount,
    scorePercent: data.scorePercent,
    cardResults: data.cardResults,
  })

  return session
}

export async function getStudySessionsForDeck(deckId: string) {
  const supabase = await createClient()
  const { data: authData, error } = await supabase.auth.getClaims()
  if (error || !authData?.claims) {
    throw new Error('Not authenticated')
  }

  const userId = authData.claims.sub as string
  return getStudySessionsByDeck(userId, deckId)
}
