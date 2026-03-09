import { cache } from 'react'
import { eq, and, desc } from 'drizzle-orm'

import { db } from '@/db'
import { studySessions } from '@/db/schema'

export async function insertStudySession(values: {
  userId: string
  deckId: string
  totalCards: number
  correctCount: number
  incorrectCount: number
  scorePercent: number
  cardResults: unknown
}) {
  const [session] = await db.insert(studySessions)
    .values(values)
    .returning({
      id: studySessions.id,
      userId: studySessions.userId,
      deckId: studySessions.deckId,
      totalCards: studySessions.totalCards,
      correctCount: studySessions.correctCount,
      incorrectCount: studySessions.incorrectCount,
      scorePercent: studySessions.scorePercent,
      completedAt: studySessions.completedAt,
    })

  return session
}

export const getStudySessionsByDeck = cache(async (
  userId: string,
  deckId: string,
  limit = 20,
  offset = 0,
) => {
  return db.select({
    id: studySessions.id,
    deckId: studySessions.deckId,
    totalCards: studySessions.totalCards,
    correctCount: studySessions.correctCount,
    incorrectCount: studySessions.incorrectCount,
    scorePercent: studySessions.scorePercent,
    completedAt: studySessions.completedAt,
  })
    .from(studySessions)
    .where(and(eq(studySessions.userId, userId), eq(studySessions.deckId, deckId)))
    .orderBy(desc(studySessions.completedAt))
    .limit(limit)
    .offset(offset)
})

export const getStudySessionById = cache(async (id: string, userId: string) => {
  const [session] = await db.select({
    id: studySessions.id,
    userId: studySessions.userId,
    deckId: studySessions.deckId,
    totalCards: studySessions.totalCards,
    correctCount: studySessions.correctCount,
    incorrectCount: studySessions.incorrectCount,
    scorePercent: studySessions.scorePercent,
    cardResults: studySessions.cardResults,
    completedAt: studySessions.completedAt,
  })
    .from(studySessions)
    .where(and(eq(studySessions.id, id), eq(studySessions.userId, userId)))

  return session ?? null
})
