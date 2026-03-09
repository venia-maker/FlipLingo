'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, RotateCcw, ClipboardList, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { saveStudySession } from '@/app/actions/study-sessions'
import { createAITask } from '@/app/actions/tasks'

interface StudyCard {
  id: string
  front: string
  back: string
}

interface StudyScoreProps {
  deckId: string
  deckTitle: string
  cards: StudyCard[]
  results: ('correct' | 'incorrect' | null)[]
  onRestart: () => void
}

export function StudyScore({
  deckId,
  deckTitle,
  cards,
  results,
  onRestart,
}: StudyScoreProps) {
  const [taskState, setTaskState] = useState<'generating' | 'created' | 'error' | null>(null)
  const savedRef = useRef(false)

  const correctCount = results.filter((r) => r === 'correct').length
  const incorrectCount = results.filter((r) => r === 'incorrect').length
  const answeredCount = correctCount + incorrectCount
  const scorePercent = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0

  useEffect(() => {
    if (savedRef.current) return
    savedRef.current = true

    const cardResults = cards.map((card, i) => ({
      cardId: card.id,
      front: card.front,
      back: card.back,
      correct: results[i] === 'correct',
    }))

    saveStudySession({
      deckId,
      totalCards: cards.length,
      correctCount,
      incorrectCount,
      scorePercent,
      cardResults,
    })
      .then((session) => {
        if (!session?.id) return
        setTaskState('generating')
        return createAITask(session.id)
      })
      .then((task) => {
        if (task) {
          setTaskState('created')
          toast.success('Review task created')
        }
      })
      .catch(() => {
        setTaskState('error')
        toast.error('Failed to generate review task')
      })
  }, [deckId, cards, results, correctCount, incorrectCount, scorePercent])

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
              cx="50" cy="50" r="42"
              fill="none" stroke="currentColor" strokeWidth="8"
              className="text-zinc-200 dark:text-zinc-800"
            />
            <circle
              cx="50" cy="50" r="42"
              fill="none" stroke="currentColor" strokeWidth="8"
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

      {/* AI task status */}
      {taskState === 'generating' && (
        <div className="mt-4 flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="size-4 animate-spin" />
          Generating review task...
        </div>
      )}
      {taskState === 'created' && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
          <ClipboardList className="size-4" />
          Review task created
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button variant="outline" onClick={onRestart}>
          <RotateCcw className="size-4" />
          Study Again
        </Button>
        <Button variant="outline" asChild>
          <a href={`/deck/${deckId}`}>
            <ChevronLeft className="size-4" />
            Back to Deck
          </a>
        </Button>
        {taskState === 'created' && (
          <Button variant="outline" asChild>
            <a href="/tasks">
              <ClipboardList className="size-4" />
              View Tasks
            </a>
          </Button>
        )}
      </div>
    </div>
  )
}
