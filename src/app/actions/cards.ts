'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import {
  reorderCards,
  insertCard,
  getCardsByDeckId,
  getCardById,
  updateCardById,
  softDeleteCard,
} from '@/db/queries/cards'
import { getDeckById } from '@/db/queries/decks'

export async function reorderCardsAction(
  deckId: string,
  cardPositions: Array<{ id: string; position: number }>,
) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims?.sub) throw new Error('Unauthorized')

  await reorderCards(cardPositions)
  revalidatePath(`/deck/${deckId}`)
}

export async function addCardAction(deckId: string, formData: FormData) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims?.sub) throw new Error('Unauthorized')

  const userId = data.claims.sub as string
  const deck = await getDeckById(deckId, userId)
  if (!deck) throw new Error('Deck not found')

  const front = formData.get('front') as string
  const back = formData.get('back') as string
  if (!front || !back) throw new Error('Invalid input')

  const existingCards = await getCardsByDeckId(deckId)
  const nextPosition = existingCards.length

  await insertCard({ deckId, front, back, position: nextPosition })
  revalidatePath(`/deck/${deckId}`)
}

export async function updateCardAction(cardId: string, formData: FormData) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims?.sub) throw new Error('Unauthorized')

  const userId = data.claims.sub as string
  const card = await getCardById(cardId)
  if (!card) throw new Error('Card not found')

  const deck = await getDeckById(card.deckId, userId)
  if (!deck) throw new Error('Unauthorized')

  const front = formData.get('front') as string
  const back = formData.get('back') as string
  if (!front || !back) throw new Error('Invalid input')

  await updateCardById(cardId, { front, back })
  revalidatePath(`/deck/${card.deckId}`)
}

export async function deleteCardAction(cardId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims?.sub) throw new Error('Unauthorized')

  const userId = data.claims.sub as string
  const card = await getCardById(cardId)
  if (!card) throw new Error('Card not found')

  const deck = await getDeckById(card.deckId, userId)
  if (!deck) throw new Error('Unauthorized')

  await softDeleteCard(cardId)
  revalidatePath(`/deck/${card.deckId}`)
}
