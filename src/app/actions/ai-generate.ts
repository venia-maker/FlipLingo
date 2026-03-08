'use server'

import { revalidatePath } from 'next/cache'
import OpenAI from 'openai'

import { createClient } from '@/lib/supabase/server'
import { getDeckById } from '@/db/queries/decks'
import { getCardsByDeckId, insertCard } from '@/db/queries/cards'
import { getUserSubscriptionStatus } from '@/app/actions/stripe'

const openai = new OpenAI()

interface GeneratedCard {
  front: string
  back: string
}

export async function generateCardsAction(deckId: string, cardCount: number) {
  if (cardCount < 5 || cardCount > 30) throw new Error('Card count must be between 10 and 30')

  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims?.sub) throw new Error('Unauthorized')

  const userId = data.claims.sub as string
  const email = typeof data.claims.email === 'string' ? data.claims.email : ''

  const { isPro } = await getUserSubscriptionStatus(email, userId)
  if (!isPro) throw new Error('AI generation requires a Pro subscription')

  const deck = await getDeckById(deckId, userId)
  if (!deck) throw new Error('Deck not found')

  const existingCards = await getCardsByDeckId(deckId)

  const prompt = `Generate exactly ${cardCount} flashcards for a deck titled "${deck.title}"${deck.description ? ` described as: "${deck.description}"` : ''}.

Each flashcard has a "front" (the question, term, or prompt) and a "back" (the answer, definition, or explanation). The content should be relevant to the deck's topic as described by its title and description.

${existingCards.length > 0 ? `The deck already has these cards, so generate DIFFERENT ones:\n${existingCards.map((c) => `- Front: ${c.front} | Back: ${c.back}`).join('\n')}\n` : ''}

IMPORTANT: You MUST strictly follow the difficulty level "${deck.difficulty}". Every single card must match this difficulty — do not deviate.
- "low": Only basic, beginner-level concepts. Simple definitions, fundamental terms, and straightforward recall questions. No complex or intermediate topics.
- "medium": Only intermediate-level concepts. Requires understanding of relationships, comparisons, and application of knowledge. No beginner basics or advanced edge cases.
- "high": Only advanced, expert-level concepts. Deep technical details, edge cases, nuanced distinctions, and questions that require synthesis of multiple concepts. No simple or intermediate questions.
- "mixed": Include a balanced spread across all difficulty levels — roughly equal parts low, medium, and high.

Return a JSON array of exactly ${cardCount} objects with "front" and "back" string keys. Only return the JSON array, no other text.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
  })

  const content = completion.choices[0]?.message?.content
  if (!content) throw new Error('Failed to generate cards')

  const jsonMatch = content.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('Failed to parse generated cards')

  const generatedCards: GeneratedCard[] = JSON.parse(jsonMatch[0])
  if (!Array.isArray(generatedCards) || generatedCards.length === 0) {
    throw new Error('No cards generated')
  }

  const startPosition = existingCards.length

  for (let i = 0; i < generatedCards.length; i++) {
    const card = generatedCards[i]
    if (!card?.front || !card?.back) continue
    await insertCard({
      deckId,
      front: card.front,
      back: card.back,
      position: startPosition + i,
    })
  }

  revalidatePath(`/deck/${deckId}`)
  return { count: generatedCards.length }
}
