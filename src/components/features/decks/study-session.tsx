'use client'

import { useState, useCallback, useEffect } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Check,
  X,
  Keyboard,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

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

type CardResult = 'correct' | 'incorrect' | null

export function StudySession({ deckId, deckTitle, cards }: StudySessionProps) {
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (typeof window === 'undefined') return 0
    try {
      const raw = localStorage.getItem(`fliplingo_study_${deckId}`)
      if (!raw) return 0
      const saved = JSON.parse(raw)
      if (saved.completed) {
        localStorage.removeItem(`fliplingo_study_${deckId}`)
        return 0
      }
      if (typeof saved.currentIndex === 'number' && saved.currentIndex >= 0 && saved.currentIndex < cards.length) {
        return saved.currentIndex
      }
    } catch { /* ignore */ }
    return 0
  })
  const [isFlipped, setIsFlipped] = useState(false)
  const [results, setResults] = useState<CardResult[]>(() => {
    if (typeof window === 'undefined') return new Array(cards.length).fill(null) as CardResult[]
    try {
      const raw = localStorage.getItem(`fliplingo_study_${deckId}`)
      if (!raw) return new Array(cards.length).fill(null) as CardResult[]
      const saved = JSON.parse(raw)
      if (saved.completed) return new Array(cards.length).fill(null) as CardResult[]
      if (Array.isArray(saved.results) && saved.results.length === cards.length) {
        return saved.results as CardResult[]
      }
    } catch { /* ignore */ }
    return new Array(cards.length).fill(null) as CardResult[]
  })
  const [showScore, setShowScore] = useState(false)

  // Persist progress on every change
  useEffect(() => {
    if (showScore) return
    localStorage.setItem(
      `fliplingo_study_${deckId}`,
      JSON.stringify({ currentIndex, totalCards: cards.length, results, completed: false }),
    )
  }, [deckId, currentIndex, cards.length, results, showScore])

  const card = cards[currentIndex]

  const goNext = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((i: number) => i + 1)
      setIsFlipped(false)
    }
  }, [currentIndex, cards.length])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i: number) => i - 1)
      setIsFlipped(false)
    }
  }, [currentIndex])

  const markResult = useCallback(
    (result: 'correct' | 'incorrect') => {
      const updatedResults = [...results]
      updatedResults[currentIndex] = result
      setResults(updatedResults)

      if (currentIndex < cards.length - 1) {
        setCurrentIndex((i: number) => i + 1)
        setIsFlipped(false)
      } else {
        setShowScore(true)
        localStorage.setItem(
          `fliplingo_study_${deckId}`,
          JSON.stringify({ currentIndex, totalCards: cards.length, results: updatedResults, completed: true }),
        )
      }
    },
    [currentIndex, cards.length, results, deckId],
  )

  const restart = useCallback(() => {
    setCurrentIndex(0)
    setIsFlipped(false)
    setResults(new Array(cards.length).fill(null) as CardResult[])
    setShowScore(false)
    localStorage.removeItem(`fliplingo_study_${deckId}`)
  }, [cards.length, deckId])

  useEffect(() => {
    if (showScore) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault()
        setIsFlipped((f) => !f)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        if (isFlipped && results[currentIndex] === null) {
          // Don't navigate right if they haven't answered yet
          return
        }
        goNext()
      } else if (isFlipped && results[currentIndex] === null) {
        if (e.key === '1') {
          e.preventDefault()
          markResult('correct')
        } else if (e.key === '2') {
          e.preventDefault()
          markResult('incorrect')
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [showScore, isFlipped, goNext, goPrev, markResult, currentIndex, results])

  if (!card) return null

  const correctCount = results.filter((r) => r === 'correct').length
  const incorrectCount = results.filter((r) => r === 'incorrect').length
  const answeredCount = correctCount + incorrectCount
  const scorePercent = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0

  if (showScore) {
    return (
      <div className="flex flex-col items-center">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Session Complete!
        </h2>
        <p className="mt-2 text-zinc-500">{deckTitle}</p>

        <div className="mt-8 flex items-center justify-center">
          <div className="relative size-40">
            <svg className="size-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-zinc-200 dark:text-zinc-800"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${(scorePercent / 100) * 264} 264`}
                strokeLinecap="round"
                className={
                  scorePercent >= 70
                    ? 'text-green-500'
                    : scorePercent >= 40
                      ? 'text-yellow-500'
                      : 'text-red-500'
                }
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
                {scorePercent}%
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full bg-green-500" />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {correctCount} correct
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-3 rounded-full bg-red-500" />
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {incorrectCount} incorrect
            </span>
          </div>
        </div>

        <p className="mt-4 text-sm text-zinc-500">
          {scorePercent === 100
            ? 'Perfect score! Amazing work!'
            : scorePercent >= 70
              ? 'Great job! Keep practicing to improve.'
              : scorePercent >= 40
                ? 'Good effort! Review the cards you missed.'
                : 'Keep studying — you\'ll get there!'}
        </p>

        <div className="mt-6 flex items-center gap-3">
          <Button variant="outline" onClick={restart}>
            <RotateCcw className="size-4" />
            Study Again
          </Button>
          <Button variant="outline" asChild>
            <a href={`/deck/${deckId}`}>
              <ChevronLeft className="size-4" />
              Back to Deck
            </a>
          </Button>
        </div>
      </div>
    )
  }

  const needsAnswer = isFlipped && results[currentIndex] === null

  return (
    <div className="flex flex-col items-center">
      <div className="mb-2 text-center">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          {deckTitle}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Card {currentIndex + 1} of {cards.length}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-6 flex w-full items-center gap-1.5">
        {cards.map((c, i) => (
          <div
            key={c.id}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              results[i] === 'correct'
                ? 'bg-green-500'
                : results[i] === 'incorrect'
                  ? 'bg-red-500'
                  : i === currentIndex
                    ? 'bg-zinc-400 dark:bg-zinc-500'
                    : 'bg-zinc-200 dark:bg-zinc-800'
            }`}
          />
        ))}
      </div>

      {/* Flashcard */}
      <div
        className="w-full cursor-pointer [perspective:1000px]"
        onClick={() => setIsFlipped((f) => !f)}
      >
        <div
          className={`relative h-64 w-full transition-transform duration-500 [transform-style:preserve-3d] ${
            isFlipped ? '[transform:rotateY(180deg)]' : ''
          }`}
        >
          <Card className="absolute inset-0 flex flex-col items-center justify-center p-8 [backface-visibility:hidden]">
            <span className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-400">
              Front
            </span>
            <p className="text-center text-2xl font-medium text-zinc-900 dark:text-zinc-50">
              {card.front}
            </p>
          </Card>
          <Card className="absolute inset-0 flex flex-col items-center justify-center p-8 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <span className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-400">
              Back
            </span>
            <p className="text-center text-2xl font-medium text-zinc-900 dark:text-zinc-50">
              {card.back}
            </p>
          </Card>
        </div>
      </div>

      {/* Answer buttons or navigation */}
      {needsAnswer ? (
        <div className="mt-6 flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => markResult('incorrect')}
            className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
          >
            <X className="size-4" />
            Missed it
            <kbd className="ml-1 rounded border border-current/20 px-1.5 py-0.5 text-[10px] font-mono">
              2
            </kbd>
          </Button>
          <Button
            variant="outline"
            onClick={() => markResult('correct')}
            className="gap-2 border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700 dark:border-green-900 dark:text-green-400 dark:hover:bg-green-950"
          >
            <Check className="size-4" />
            Got it
            <kbd className="ml-1 rounded border border-current/20 px-1.5 py-0.5 text-[10px] font-mono">
              1
            </kbd>
          </Button>
        </div>
      ) : (
        <div className="mt-6 flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={goPrev}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="size-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={goNext}
            disabled={currentIndex === cards.length - 1}
          >
            <ChevronRight className="size-5" />
          </Button>
        </div>
      )}

      {/* Keyboard hints */}
      <div className="mt-6 flex items-center gap-1.5 text-xs text-zinc-400">
        <Keyboard className="size-3.5" />
        <span>
          <kbd className="rounded border border-zinc-300 px-1 py-0.5 font-mono dark:border-zinc-700">Space</kbd> flip
          {' · '}
          <kbd className="rounded border border-zinc-300 px-1 py-0.5 font-mono dark:border-zinc-700">←</kbd>
          <kbd className="rounded border border-zinc-300 px-1 py-0.5 font-mono dark:border-zinc-700">→</kbd> navigate
          {needsAnswer && (
            <>
              {' · '}
              <kbd className="rounded border border-zinc-300 px-1 py-0.5 font-mono dark:border-zinc-700">1</kbd> got it
              {' · '}
              <kbd className="rounded border border-zinc-300 px-1 py-0.5 font-mono dark:border-zinc-700">2</kbd> missed
            </>
          )}
        </span>
      </div>
    </div>
  )
}
