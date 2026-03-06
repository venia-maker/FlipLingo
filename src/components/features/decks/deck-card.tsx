import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'

interface DeckCardProps {
  deck: {
    id: string
    title: string
    description: string | null
    difficulty: string
    updatedAt: Date
  }
}

const difficultyColors: Record<string, string> = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  high: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  mixed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
}

export function DeckCard({ deck }: DeckCardProps) {
  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-md">
      <CardHeader>
        <CardTitle>{deck.title}</CardTitle>
        {deck.description && (
          <CardDescription className="line-clamp-2">{deck.description}</CardDescription>
        )}
      </CardHeader>
      <CardFooter className="flex items-center justify-between text-xs text-zinc-500">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${difficultyColors[deck.difficulty] ?? ''}`}
        >
          {deck.difficulty}
        </span>
        <span>
          {deck.updatedAt.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      </CardFooter>
    </Card>
  )
}
