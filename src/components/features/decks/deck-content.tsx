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
}

export function DeckContent({ deckId, isPro, initialCards, difficulty }: DeckContentProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  return (
    <>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {initialCards.length} card{initialCards.length === 1 ? '' : 's'}
        </p>
        <div className="flex items-center gap-2">
          <GenerateCardsButton
            deckId={deckId}
            isPro={isPro}
            onGeneratingChange={setIsGenerating}
          />
          <StudyButton deckId={deckId} cardCount={initialCards.length} />
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
