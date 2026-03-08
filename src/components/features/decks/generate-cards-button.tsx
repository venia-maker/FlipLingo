'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Label } from '@/components/ui/label'
import { generateCardsAction } from '@/app/actions/ai-generate'

interface GenerateCardsButtonProps {
  deckId: string
  isPro: boolean
  onGeneratingChange: (isGenerating: boolean) => void
}

const CARD_COUNT_OPTIONS = [5, 10, 15, 20, 25, 30]

export function GenerateCardsButton({ deckId, isPro, onGeneratingChange }: GenerateCardsButtonProps) {
  const [open, setOpen] = useState(false)
  const [cardCount, setCardCount] = useState(20)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleButtonClick() {
    if (!isPro) {
      router.push('/pricing')
      return
    }
    setOpen(true)
  }

  function handleGenerate() {
    setOpen(false)
    onGeneratingChange(true)
    startTransition(async () => {
      try {
        const result = await generateCardsAction(deckId, cardCount)
        toast.success(`Generated ${result.count} cards with AI`)
      } catch {
        toast.error('Failed to generate cards. Please try again.')
      } finally {
        onGeneratingChange(false)
      }
    })
  }

  const triggerButton = (
    <Button size="sm" variant="outline" onClick={handleButtonClick} disabled={isPending}>
      <Sparkles className="size-4" />
      Generate with AI
    </Button>
  )

  if (!isPro) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {triggerButton}
          </TooltipTrigger>
          <TooltipContent>
            <p>This is a Pro feature. Click to view pricing.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Cards with AI</DialogTitle>
          <DialogDescription>
            Choose how many flashcards to generate based on your deck.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="card-count">Number of cards</Label>
          <div className="mt-2 flex gap-2">
            {CARD_COUNT_OPTIONS.map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setCardCount(count)}
                className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  cardCount === count
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate}>
            <Sparkles className="size-4" />
            Generate {cardCount} Cards
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
