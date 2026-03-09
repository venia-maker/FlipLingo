import { cache } from 'react'
import { eq, and, asc, isNull, inArray } from 'drizzle-orm'

import { db } from '@/db'
import { cards } from '@/db/schema'

export const getCardsByDeckId = cache(async (deckId: string) => {
  return db.select({
    id: cards.id,
    deckId: cards.deckId,
    front: cards.front,
    back: cards.back,
    position: cards.position,
  }).from(cards).where(
    and(eq(cards.deckId, deckId), isNull(cards.deletedAt))
  ).orderBy(asc(cards.position))
})

export const getCardById = cache(async (cardId: string) => {
  const [card] = await db.select({
    id: cards.id,
    deckId: cards.deckId,
    front: cards.front,
    back: cards.back,
    position: cards.position,
  }).from(cards).where(
    and(eq(cards.id, cardId), isNull(cards.deletedAt))
  )
  return card ?? null
})

export async function insertCard(values: {
  deckId: string
  front: string
  back: string
  position: number
}) {
  const [newCard] = await db.insert(cards).values(values).returning({
    id: cards.id,
    front: cards.front,
    back: cards.back,
    position: cards.position,
  })
  return newCard
}

export async function insertCards(values: Array<{
  deckId: string
  front: string
  back: string
  position: number
}>) {
  return db.insert(cards).values(values).returning({
    id: cards.id,
    front: cards.front,
    back: cards.back,
    position: cards.position,
  })
}

export async function updateCardById(
  cardId: string,
  values: { front?: string; back?: string; position?: number },
) {
  const [updated] = await db.update(cards)
    .set({ ...values, updatedAt: new Date() })
    .where(
      and(eq(cards.id, cardId), isNull(cards.deletedAt))
    )
    .returning({ id: cards.id, front: cards.front, back: cards.back, position: cards.position })
  return updated ?? null
}

export async function reorderCards(
  cardPositions: Array<{ id: string; position: number }>,
) {
  await db.transaction(async (tx) => {
    for (const { id, position } of cardPositions) {
      await tx.update(cards)
        .set({ position, updatedAt: new Date() })
        .where(and(eq(cards.id, id), isNull(cards.deletedAt)))
    }
  })
}

export async function softDeleteCard(cardId: string) {
  const [deleted] = await db.update(cards)
    .set({ deletedAt: new Date() })
    .where(
      and(eq(cards.id, cardId), isNull(cards.deletedAt))
    )
    .returning({ id: cards.id })
  return deleted ?? null
}

export async function hardDeleteCard(cardId: string) {
  const [deleted] = await db.delete(cards)
    .where(eq(cards.id, cardId))
    .returning({ id: cards.id })
  return deleted ?? null
}

export async function hardDeleteCards(cardIds: string[]) {
  await db.delete(cards).where(inArray(cards.id, cardIds))
}

export async function hardDeleteCardsByDeckId(deckId: string) {
  await db.delete(cards).where(eq(cards.deckId, deckId))
}
