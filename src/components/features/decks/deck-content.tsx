'use client'

import { useState } from 'react'

import { CardList } from './card-list'
import { GenerateCardsButton } from './generate-cards-button'
import { StudyButton } from './study-button'
import { AddCardDialog } from './add-card-dialog'

interface CardItem {
  id: string
  deckId: string
  front: string
  back: string
  position: number
}

type Difficulty = 'low' | 'medium' | 'high' | 'mixed'

const difficultyAnimationColors: Record<Difficulty, { border: string; bg: string; dot: string; text: string }> = {
  low: {
    border: 'border-green-200 dark:border-green-800',
    bg: 'bg-green-50 dark:bg-green-950/30',
    dot: 'bg-green-500',
    text: 'text-green-700 dark:text-green-300',
  },
  medium: {
    border: 'border-yellow-200 dark:border-yellow-800',
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    dot: 'bg-yellow-500',
    text: 'text-yellow-700 dark:text-yellow-300',
  },
  high: {
    border: 'border-red-200 dark:border-red-800',
    bg: 'bg-red-50 dark:bg-red-950/30',
    dot: 'bg-red-500',
    text: 'text-red-700 dark:text-red-300',
  },
  mixed: {
    border: 'border-blue-200 dark:border-blue-800',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    dot: 'bg-blue-500',
    text: 'text-blue-700 dark:text-blue-300',
  },
}

interface DeckContentProps {
  deckId: string
  isPro: boolean
  initialCards: CardItem[]
  difficulty: Difficulty
  hasDescription: boolean
}

export function DeckContent({ deckId, isPro, initialCards, difficulty, hasDescription }: DeckContentProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  return (
    <>
      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {/* Top row: Card count + study progress */}
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700">
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{initialCards.length}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {initialCards.length === 1 ? '1 Card' : `${initialCards.length} Cards`}
              </span>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {initialCards.length === 0 ? 'Add cards to get started' : 'Ready to study'}
              </span>
            </div>
          </div>
          <StudyButton deckId={deckId} cardCount={initialCards.length} />
        </div>

        {/* Divider */}
        <div className="border-t border-zinc-100 dark:border-zinc-800" />

        {/* Bottom row: Actions */}
        <div className="flex flex-wrap items-center justify-end gap-3 px-5 py-3.5">
          <GenerateCardsButton
            deckId={deckId}
            isPro={isPro}
            hasDescription={hasDescription}
            onGeneratingChange={setIsGenerating}
          />
          <AddCardDialog deckId={deckId} />
        </div>
      </div>

      <div className="mt-8">
        {isGenerating && (
          <div className={`mb-6 flex items-center gap-3 rounded-lg border px-4 py-3 ${difficultyAnimationColors[difficulty].border} ${difficultyAnimationColors[difficulty].bg}`}>
            <div className="flex gap-1">
              <span className={`size-2 animate-bounce rounded-full [animation-delay:0ms] ${difficultyAnimationColors[difficulty].dot}`} />
              <span className={`size-2 animate-bounce rounded-full [animation-delay:150ms] ${difficultyAnimationColors[difficulty].dot}`} />
              <span className={`size-2 animate-bounce rounded-full [animation-delay:300ms] ${difficultyAnimationColors[difficulty].dot}`} />
            </div>
            <span className={`text-sm font-medium ${difficultyAnimationColors[difficulty].text}`}>
              Generating cards with AI...
            </span>
          </div>
        )}
        <CardList deckId={deckId} initialCards={initialCards} />
      </div>
    </>
  )
}
