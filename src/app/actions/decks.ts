'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { insertDeck, updateDeckById, hardDeleteDeck, countDecksByUserId } from '@/db/queries/decks'
import { hardDeleteCardsByDeckId } from '@/db/queries/cards'
import { DIFFICULTIES, type Difficulty } from '@/db/schema'
import { getUserSubscriptionStatus } from '@/app/actions/stripe'

export async function createDeckAction(formData: FormData) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims?.sub) redirect('/')

  const userId = data.claims.sub as string
  const title = formData.get('title') as string
  const description = (formData.get('description') as string) || null
  const difficulty = formData.get('difficulty') as string

  if (!title || !DIFFICULTIES.includes(difficulty as Difficulty)) {
    throw new Error('Invalid input')
  }

  const email = typeof data.claims.email === 'string' ? data.claims.email : ''
  const { isPro } = await getUserSubscriptionStatus(email, userId)

  if (!isPro) {
    const deckCount = await countDecksByUserId(userId)
    if (deckCount >= 3) {
      throw new Error('FREE_PLAN_LIMIT')
    }
  }

  const newDeck = await insertDeck({
    userId,
    title,
    description,
    difficulty: difficulty as Difficulty,
  })

  revalidatePath('/dashboard')
  redirect(`/deck/${newDeck.id}`)
}

export async function updateDeckAction(deckId: string, formData: FormData) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims?.sub) throw new Error('Unauthorized')

  const userId = data.claims.sub as string
  const title = formData.get('title') as string
  const description = (formData.get('description') as string) || null
  const difficulty = formData.get('difficulty') as string

  if (!title || !DIFFICULTIES.includes(difficulty as Difficulty)) {
    throw new Error('Invalid input')
  }

  await updateDeckById(deckId, userId, {
    title,
    description,
    difficulty: difficulty as Difficulty,
  })

  revalidatePath(`/deck/${deckId}`)
  revalidatePath('/dashboard')
}

export async function deleteDeckAction(deckId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims?.sub) throw new Error('Unauthorized')

  const userId = data.claims.sub as string
  await hardDeleteCardsByDeckId(deckId, userId)
  const deleted = await hardDeleteDeck(deckId, userId)
  if (!deleted) throw new Error('Not found')

  revalidatePath('/dashboard')
  redirect('/dashboard')
}
