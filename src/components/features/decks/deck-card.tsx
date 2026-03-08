import type { Difficulty } from '@/db/schema'

interface DeckCardProps {
  deck: {
    id: string
    title: string
    description: string | null
    difficulty: Difficulty
    createdAt: Date
    updatedAt: Date
  }
}

const difficultyColors: Record<Difficulty, string> = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  high: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  mixed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
}

export function DeckCard({ deck }: DeckCardProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
      <div className="flex items-start justify-between">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">{deck.title}</h3>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${difficultyColors[deck.difficulty]}`}>
          {deck.difficulty}
        </span>
      </div>
      {deck.description && (
        <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
          {deck.description}
        </p>
      )}
    </div>
  )
}
