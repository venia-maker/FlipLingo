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
      <div className="flex w-full flex-col gap-3 rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/20 sm:w-auto sm:min-w-[260px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-2.5 rounded-full bg-emerald-500" />
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              Completed
            </span>
          </div>
          <span className="text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">{pct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-200 dark:bg-emerald-900">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/deck/${deckId}/study`} className="flex-1">
            <Button size="sm" variant="outline" onClick={handleReset} className="w-full">
              <RotateCcw className="size-4" />
              Study Again
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (state === 'in-progress') {
    return (
      <div className="flex w-full flex-col gap-3 rounded-xl bg-amber-50 p-4 dark:bg-amber-950/20 sm:w-auto sm:min-w-[260px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-2.5 animate-pulse rounded-full bg-amber-500" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
              In Progress
            </span>
          </div>
          <span className="text-sm font-semibold tabular-nums text-amber-700 dark:text-amber-300">{pct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-amber-200 dark:bg-amber-900">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/deck/${deckId}/study`} className="flex-1">
            <Button size="sm" variant="default" className="w-full">
              <Play className="size-4" />
              Continue Learning
            </Button>
          </Link>
          <Button size="sm" variant="ghost" onClick={handleReset} title="Reset progress" className="size-9 shrink-0 p-0">
            <RotateCcw className="size-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Link href={`/deck/${deckId}/study`} className="w-full sm:w-auto">
      <Button variant="default" className="w-full gap-2 sm:w-auto">
        <Play className="size-4" />
        Start Learning
      </Button>
    </Link>
  )
}
