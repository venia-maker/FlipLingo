'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { insertDeck, updateDeckById, softDeleteDeck } from '@/db/queries/decks'
import { DIFFICULTIES, type Difficulty } from '@/db/schema'

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
  const deleted = await softDeleteDeck(deckId, userId)
  if (!deleted) throw new Error('Deck not found')

  revalidatePath('/dashboard')
  redirect('/dashboard')
}
