'use server'

import { revalidatePath } from 'next/cache'
import OpenAI from 'openai'

import { createClient } from '@/lib/supabase/server'
import { getDeckById } from '@/db/queries/decks'
import { getCardsByDeckId, insertCards } from '@/db/queries/cards'
import { getUserSubscriptionStatus } from '@/app/actions/stripe'

const openai = new OpenAI()

interface GeneratedCard {
  front: string
  back: string
}

export async function generateCardsAction(deckId: string, cardCount: number) {
  if (cardCount < 5 || cardCount > 30) throw new Error('Card count must be between 5 and 30')

  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims?.sub) throw new Error('Unauthorized')

  const userId = data.claims.sub as string
  const email = typeof data.claims.email === 'string' ? data.claims.email : ''

  const { isPro } = await getUserSubscriptionStatus(email, userId)
  if (!isPro) throw new Error('AI generation requires a Pro subscription')

  const deck = await getDeckById(deckId, userId)
  if (!deck) throw new Error('Not found')

  if (!deck.description) throw new Error('Deck must have a description for AI generation')

  const existingCards = await getCardsByDeckId(deckId, userId)

  const prompt = `Generate exactly ${cardCount} flashcards for a deck titled "${deck.title}" described as: "${deck.description}".

Each flashcard has a "front" (the question, term, or prompt) and a "back" (the answer, definition, or explanation). The content should be relevant to the deck's topic as described by its title and description.

${existingCards.length > 0 ? `The deck already has these cards, so generate DIFFERENT ones:\n${existingCards.map((c) => `- Front: ${c.front} | Back: ${c.back}`).join('\n')}\n` : ''}

IMPORTANT: You MUST strictly follow the difficulty level "${deck.difficulty}". Every single card must match this difficulty — do not deviate.
- "low": Only basic, beginner-level concepts. Simple definitions, fundamental terms, and straightforward recall questions. No complex or intermediate topics.
- "medium": Only intermediate-level concepts. Requires understanding of relationships, comparisons, and application of knowledge. No beginner basics or advanced edge cases.
- "high": Only advanced, expert-level concepts. Deep technical details, edge cases, nuanced distinctions, and questions that require synthesis of multiple concepts. No simple or intermediate questions.
- "mixed": Include a balanced spread across all difficulty levels — roughly equal parts low, medium, and high.

Return ONLY a valid JSON array of exactly ${cardCount} objects with "front" and "back" string keys. No markdown, no code fences, no explanation — just the raw JSON array.`

  let lastError: unknown
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        response_format: { type: 'json_object' },
      })

      const responseContent = completion.choices[0]?.message?.content
      if (!responseContent) {
        lastError = new Error('Empty response from AI')
        continue
      }

      let generatedCards: GeneratedCard[]

      try {
        const parsed: unknown = JSON.parse(responseContent)
        if (Array.isArray(parsed)) {
          generatedCards = parsed
        } else if (typeof parsed === 'object' && parsed !== null) {
          const values = Object.values(parsed)
          const arr = values.find((v) => Array.isArray(v))
          if (Array.isArray(arr)) {
            generatedCards = arr
          } else {
            lastError = new Error('Unexpected JSON structure')
            continue
          }
        } else {
          lastError = new Error('Unexpected JSON structure')
          continue
        }
      } catch {
        const jsonMatch = responseContent.match(/\[[\s\S]*\]/)
        if (!jsonMatch) {
          lastError = new Error('Failed to parse AI response as JSON')
          continue
        }
        generatedCards = JSON.parse(jsonMatch[0])
      }

      const validCards = generatedCards.filter(
        (c) => c && typeof c.front === 'string' && c.front.trim() && typeof c.back === 'string' && c.back.trim(),
      )

      if (validCards.length === 0) {
        lastError = new Error('No valid cards in AI response')
        continue
      }

      const startPosition = existingCards.length
      const cardsToInsert = validCards.map((card, i) => ({
        deckId,
        front: card.front.trim(),
        back: card.back.trim(),
        position: startPosition + i,
      }))

      await insertCards(cardsToInsert)
      revalidatePath(`/deck/${deckId}`)
      return { count: validCards.length }
    } catch (err) {
      lastError = err
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to generate cards after multiple attempts')
}
