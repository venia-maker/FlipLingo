import { cache } from 'react'
import { eq, and, isNull, count } from 'drizzle-orm'

import { db } from '@/db'
import { decks } from '@/db/schema'
import type { Difficulty } from '@/db/schema'

export const getDecksByUserId = cache(async (userId: string) => {
  return db.select({
    id: decks.id,
    title: decks.title,
    description: decks.description,
    difficulty: decks.difficulty,
    createdAt: decks.createdAt,
    updatedAt: decks.updatedAt,
  }).from(decks).where(
    and(eq(decks.userId, userId), isNull(decks.deletedAt))
  )
})

export const getDeckById = cache(async (deckId: string, userId: string) => {
  const [deck] = await db.select({
    id: decks.id,
    title: decks.title,
    description: decks.description,
    difficulty: decks.difficulty,
    userId: decks.userId,
    createdAt: decks.createdAt,
    updatedAt: decks.updatedAt,
  }).from(decks).where(
    and(
      eq(decks.id, deckId),
      eq(decks.userId, userId),
      isNull(decks.deletedAt),
    )
  )
  return deck ?? null
})

export async function countDecksByUserId(userId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(decks)
    .where(and(eq(decks.userId, userId), isNull(decks.deletedAt)))
  return result?.count ?? 0
}

export async function insertDeck(values: {
  userId: string
  title: string
  description: string | null
  difficulty: Difficulty
}) {
  const [newDeck] = await db.insert(decks).values(values).returning({
    id: decks.id,
    title: decks.title,
    difficulty: decks.difficulty,
  })
  return newDeck
}

export async function updateDeckById(
  deckId: string,
  userId: string,
  values: { title?: string; description?: string | null; difficulty?: Difficulty },
) {
  const [updated] = await db.update(decks)
    .set({ ...values, updatedAt: new Date() })
    .where(
      and(eq(decks.id, deckId), eq(decks.userId, userId), isNull(decks.deletedAt))
    )
    .returning({ id: decks.id, title: decks.title, difficulty: decks.difficulty })
  return updated ?? null
}

export async function softDeleteDeck(deckId: string, userId: string) {
  const [deleted] = await db.update(decks)
    .set({ deletedAt: new Date() })
    .where(
      and(eq(decks.id, deckId), eq(decks.userId, userId), isNull(decks.deletedAt))
    )
    .returning({ id: decks.id })
  return deleted ?? null
}

export async function hardDeleteDeck(deckId: string, userId: string) {
  const [deleted] = await db.delete(decks)
    .where(and(eq(decks.id, deckId), eq(decks.userId, userId)))
    .returning({ id: decks.id })
  return deleted ?? null
}
