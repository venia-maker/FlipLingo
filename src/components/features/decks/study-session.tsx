'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Flashcard } from './flashcard'

interface StudyCard {
  id: string
  front: string
  back: string
}

interface StudySessionProps {
  deckId: string
  deckTitle: string
  cards: StudyCard[]
}

interface CardResult {
  cardId: string
  correct: boolean
}

const progressKey = (deckId: string) => `fliplingo_study_${deckId}`

export function StudySession({ deckId, deckTitle, cards }: StudySessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [results, setResults] = useState<CardResult[]>([])
  const [phase, setPhase] = useState<'studying' | 'summary'>('studying')

  const currentCard = cards[currentIndex]

  // Persist progress to localStorage
  useEffect(() => {
    if (phase === 'studying') {
      localStorage.setItem(
        progressKey(deckId),
        JSON.stringify({ currentIndex, totalCards: cards.length }),
      )
    }
  }, [currentIndex, phase, deckId, cards.length])

  // Clear progress on session complete
  useEffect(() => {
    if (phase === 'summary') {
      localStorage.removeItem(progressKey(deckId))
    }
  }, [phase, deckId])

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev)
  }, [])

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
      setIsFlipped(false)
    }
  }, [currentIndex])

  const handleNext = useCallback(() => {
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex((prev) => prev + 1)
      setIsFlipped(false)
    }
  }, [currentIndex, cards.length])

  const handleAnswer = useCallback(
    (correct: boolean) => {
      if (!currentCard) return
      setResults((prev) => [...prev, { cardId: currentCard.id, correct }])

      if (currentIndex + 1 < cards.length) {
        setCurrentIndex((prev) => prev + 1)
        setIsFlipped(false)
      } else {
        setPhase('summary')
      }
    },
    [currentCard, currentIndex, cards.length],
  )

  const handleRestart = useCallback(() => {
    setCurrentIndex(0)
    setIsFlipped(false)
    setResults([])
    setPhase('studying')
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase !== 'studying') return
      if (e.key === ' ') {
        e.preventDefault()
        handleFlip()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handlePrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleNext()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, handleFlip, handlePrev, handleNext])

  if (phase === 'summary') {
    const correctCount = results.filter((r) => r.correct).length
    const accuracy = results.length > 0
      ? Math.round((correctCount / results.length) * 100)
      : 0

    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Session Complete
        </h2>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">{deckTitle}</p>

        <div className="mt-8 flex justify-center gap-8">
          <div>
            <div className="text-3xl font-bold text-green-600">{correctCount}</div>
            <div className="text-sm text-zinc-500">Correct</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-red-600">
              {results.length - correctCount}
            </div>
            <div className="text-sm text-zinc-500">Missed</div>
          </div>
        </div>

        <div className="mt-4 text-lg text-zinc-700 dark:text-zinc-300">
          {accuracy}% accuracy
        </div>

        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={handleRestart}>Study Again</Button>
          <Link href={`/deck/${deckId}`}>
            <Button variant="outline">Back to Deck</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!currentCard) return null

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm text-zinc-500">
        <span>{deckTitle}</span>
        <span>
          {currentIndex + 1} / {cards.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-8 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>

      <Flashcard
        front={currentCard.front}
        back={currentCard.back}
        isFlipped={isFlipped}
        onFlip={handleFlip}
      />

      {/* Navigation + flip controls */}
      <div className="mt-6 flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          aria-label="Previous card"
        >
          <ChevronLeft className="size-5" />
        </Button>
        <Button variant="outline" className="px-6" onClick={handleFlip}>
          Flip
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          disabled={currentIndex + 1 >= cards.length}
          aria-label="Next card"
        >
          <ChevronRight className="size-5" />
        </Button>
      </div>

      {isFlipped ? (
        <div className="mt-4 flex justify-center gap-4">
          <Button
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
            onClick={() => handleAnswer(false)}
          >
            Missed it
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
            onClick={() => handleAnswer(true)}
          >
            Got it
          </Button>
        </div>
      ) : (
        <div className="mt-4 text-center">
          <p className="text-xs text-zinc-400">Space to flip · ← → to navigate</p>
        </div>
      )}
    </div>
  )
}
