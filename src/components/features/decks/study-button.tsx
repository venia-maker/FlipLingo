'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Play, RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface StudyButtonProps {
  deckId: string
  cardCount: number
}

type SessionState = 'fresh' | 'in-progress' | 'completed'

interface StoredProgress {
  currentIndex?: number
  totalCards?: number
  results?: ('correct' | 'incorrect' | null)[]
  completed?: boolean
}

export function StudyButton({ deckId, cardCount }: StudyButtonProps) {
  const [state, setState] = useState<SessionState>('fresh')
  const [pct, setPct] = useState(0)

  useEffect(() => {
    const raw = localStorage.getItem(`fliplingo_study_${deckId}`)
    if (!raw) return
    try {
      const saved = JSON.parse(raw) as StoredProgress
      if (saved.completed) {
        setState('completed')
        if (Array.isArray(saved.results) && saved.totalCards) {
          const correct = saved.results.filter((r) => r === 'correct').length
          setPct(Math.round((correct / saved.totalCards) * 100))
        }
      } else if (Array.isArray(saved.results) && saved.results.some((r) => r !== null)) {
        setState('in-progress')
        if (saved.totalCards) {
          const answered = saved.results.filter((r) => r !== null).length
          setPct(Math.round((answered / saved.totalCards) * 100))
        }
      }
    } catch {
      // ignore
    }
  }, [deckId])

  const handleReset = () => {
    localStorage.removeItem(`fliplingo_study_${deckId}`)
    setState('fresh')
    setPct(0)
  }

  if (cardCount === 0) return null

  if (state === 'completed') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Completed · {pct}% correct
        </span>
        <Link href={`/deck/${deckId}/study`}>
          <Button size="sm" variant="outline" onClick={handleReset}>
            <RotateCcw className="size-4" />
            Study Again
          </Button>
        </Link>
      </div>
    )
  }

  if (state === 'in-progress') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          In progress · {pct}% answered
        </span>
        <Link href={`/deck/${deckId}/study`}>
          <Button size="sm" variant="default">
            <Play className="size-4" />
            Continue Learning
          </Button>
        </Link>
        <Button size="sm" variant="ghost" onClick={handleReset} title="Reset progress">
          <RotateCcw className="size-4" />
        </Button>
      </div>
    )
  }

  return (
    <Link href={`/deck/${deckId}/study`}>
      <Button size="sm" variant="default">
        <Play className="size-4" />
        Start Learning
      </Button>
    </Link>
  )
}
