'use client'

import { useEffect, useState } from 'react'

interface StudyProgressBadgeProps {
  deckId: string
}

interface StoredProgress {
  currentIndex: number
  totalCards: number
  results?: ('correct' | 'incorrect' | null)[]
  completed?: boolean
}

export function StudyProgressBadge({ deckId }: StudyProgressBadgeProps) {
  const [progress, setProgress] = useState<{ pct: number; completed: boolean } | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem(`fliplingo_study_${deckId}`)
    if (!raw) return
    try {
      const { totalCards, results, completed } = JSON.parse(raw) as StoredProgress
      if (totalCards > 0 && Array.isArray(results)) {
        const answered = results.filter((r) => r !== null).length
        setProgress({
          pct: Math.round((answered / totalCards) * 100),
          completed: completed === true,
        })
      }
    } catch {
      // ignore malformed data
    }
  }, [deckId])

  if (!progress) return null

  return (
    <span className="text-xs text-zinc-500 dark:text-zinc-400">
      {progress.completed ? 'Completed' : 'In progress'} · {progress.pct}% answered
    </span>
  )
}
