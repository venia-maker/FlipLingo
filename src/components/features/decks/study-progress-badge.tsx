'use client'

import { useEffect, useState } from 'react'

interface StudyProgressBadgeProps {
  deckId: string
}

interface StoredProgress {
  currentIndex: number
  totalCards: number
}

export function StudyProgressBadge({ deckId }: StudyProgressBadgeProps) {
  const [pct, setPct] = useState<number | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem(`fliplingo_study_${deckId}`)
    if (!raw) return
    try {
      const { currentIndex, totalCards } = JSON.parse(raw) as StoredProgress
      if (totalCards > 0) {
        setPct(Math.round(((currentIndex + 1) / totalCards) * 100))
      }
    } catch {
      // ignore malformed data
    }
  }, [deckId])

  if (pct === null) return null

  return (
    <span className="text-xs text-zinc-500 dark:text-zinc-400">
      In progress · {pct}% reached
    </span>
  )
}
