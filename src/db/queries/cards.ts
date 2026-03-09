import { cache } from 'react'
import { eq, and, asc, isNull, inArray, count } from 'drizzle-orm'

import { db } from '@/db'
import { cards, decks } from '@/db/schema'

export const getCardCountsByDeckIds = cache(async (userId: string, deckIds: string[]): Promise<Record<string, number>> => {
  if (deckIds.length === 0) return {}

  const rows = await db.select({
    deckId: cards.deckId,
    count: count(),
  }).from(cards)
    .innerJoin(decks, eq(cards.deckId, decks.id))
    .where(
      and(
        inArray(cards.deckId, deckIds),
        eq(decks.userId, userId),
        isNull(cards.deletedAt),
      )
    )
    .groupBy(cards.deckId)

  const result: Record<string, number> = {}
  for (const row of rows) {
    result[row.deckId] = row.count
  }
  return result
})

export const getCardsByDeckId = cache(async (deckId: string, userId: string) => {
  return db.select({
    id: cards.id,
    deckId: cards.deckId,
    front: cards.front,
    back: cards.back,
    position: cards.position,
  }).from(cards)
    .innerJoin(decks, eq(cards.deckId, decks.id))
    .where(
      and(
        eq(cards.deckId, deckId),
        eq(decks.userId, userId),
        isNull(cards.deletedAt),
      )
    ).orderBy(asc(cards.position))
})

export const getCardById = cache(async (cardId: string, userId: string) => {
  const [card] = await db.select({
    id: cards.id,
    deckId: cards.deckId,
    front: cards.front,
    back: cards.back,
    position: cards.position,
  }).from(cards)
    .innerJoin(decks, eq(cards.deckId, decks.id))
    .where(
      and(
        eq(cards.id, cardId),
        eq(decks.userId, userId),
        isNull(cards.deletedAt),
      )
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
  userId: string,
  values: { front?: string; back?: string; position?: number },
) {
  // Verify ownership before updating
  const card = await getCardById(cardId, userId)
  if (!card) return null

  const [updated] = await db.update(cards)
    .set({ ...values, updatedAt: new Date() })
    .where(
      and(eq(cards.id, cardId), isNull(cards.deletedAt))
    )
    .returning({ id: cards.id, front: cards.front, back: cards.back, position: cards.position })
  return updated ?? null
}

export async function reorderCards(
  deckId: string,
  userId: string,
  cardPositions: Array<{ id: string; position: number }>,
) {
  // First verify the deck belongs to the user
  const [deck] = await db.select({ id: decks.id }).from(decks).where(
    and(eq(decks.id, deckId), eq(decks.userId, userId), isNull(decks.deletedAt))
  )
  if (!deck) return

  await db.transaction(async (tx) => {
    for (const { id, position } of cardPositions) {
      await tx.update(cards)
        .set({ position, updatedAt: new Date() })
        .where(and(eq(cards.id, id), eq(cards.deckId, deckId), isNull(cards.deletedAt)))
    }
  })
}

export async function softDeleteCard(cardId: string, userId: string) {
  // Verify ownership via join before soft-deleting
  const card = await getCardById(cardId, userId)
  if (!card) return null

  const [deleted] = await db.update(cards)
    .set({ deletedAt: new Date() })
    .where(
      and(eq(cards.id, cardId), isNull(cards.deletedAt))
    )
    .returning({ id: cards.id })
  return deleted ?? null
}

export async function hardDeleteCard(cardId: string, userId: string) {
  // Verify ownership via join before deleting
  const card = await getCardById(cardId, userId)
  if (!card) return null

  const [deleted] = await db.delete(cards)
    .where(eq(cards.id, cardId))
    .returning({ id: cards.id })
  return deleted ?? null
}

export async function hardDeleteCards(deckId: string, userId: string, cardIds: string[]) {
  // Verify deck ownership before deleting cards
  const [deck] = await db.select({ id: decks.id }).from(decks).where(
    and(eq(decks.id, deckId), eq(decks.userId, userId), isNull(decks.deletedAt))
  )
  if (!deck) return

  await db.delete(cards).where(and(inArray(cards.id, cardIds), eq(cards.deckId, deckId)))
}

export async function hardDeleteCardsByDeckId(deckId: string, userId: string) {
  // Verify deck ownership before deleting all cards
  const [deck] = await db.select({ id: decks.id }).from(decks).where(
    and(eq(decks.id, deckId), eq(decks.userId, userId), isNull(decks.deletedAt))
  )
  if (!deck) return

  await db.delete(cards).where(eq(cards.deckId, deckId))
}
