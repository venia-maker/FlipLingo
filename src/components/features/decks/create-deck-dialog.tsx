'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import Link from 'next/link'

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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createDeckAction } from '@/app/actions/decks'

const FREE_DECK_LIMIT = 3

const difficulties = [
  { value: 'low', label: 'Low', description: 'Basic vocabulary' },
  { value: 'medium', label: 'Medium', description: 'Intermediate words' },
  { value: 'high', label: 'High', description: 'Advanced terms' },
  { value: 'mixed', label: 'Mixed', description: 'All levels' },
] as const

export function CreateDeckDialog({ deckCount, isPro = false }: { deckCount: number; isPro?: boolean }) {
  const [open, setOpen] = useState(false)
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('mixed')
  const [isPending, startTransition] = useTransition()

  const atLimit = !isPro && deckCount >= FREE_DECK_LIMIT

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          New Deck
        </Button>
      </DialogTrigger>
      <DialogContent>
        {atLimit ? (
          <>
            <DialogHeader>
              <DialogTitle>Deck limit reached</DialogTitle>
              <DialogDescription>
                Free plan is limited to {FREE_DECK_LIMIT} decks. Upgrade to Pro for unlimited decks.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button asChild>
                <Link href="/pricing">Upgrade to Pro</Link>
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create New Deck</DialogTitle>
              <DialogDescription>Add a new flashcard deck to study.</DialogDescription>
            </DialogHeader>
            <form action={(formData: FormData) => {
              startTransition(async () => {
                try {
                  await createDeckAction(formData)
                  toast.success('Deck created successfully')
                } catch (err) {
                  if (err instanceof Error && (err.message === 'NEXT_REDIRECT' || (err as unknown as Record<string, unknown>).digest?.toString().startsWith('NEXT_REDIRECT'))) {
                    toast.success('Deck created successfully')
                    return
                  }
                  const message = err instanceof Error ? err.message : 'Something went wrong'
                  if (message === 'FREE_PLAN_LIMIT') {
                    toast.error('Free plan is limited to 3 decks. Upgrade to Pro for unlimited decks.')
                  } else {
                    toast.error(message)
                  }
                }
              })
            }}>
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" required placeholder="e.g. Spanish Basics" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" placeholder="Optional description" />
                </div>
                <div className="grid gap-2">
                  <Label>Difficulty</Label>
                  <input type="hidden" name="difficulty" value={selectedDifficulty} />
                  <div className="grid grid-cols-2 gap-2">
                    {difficulties.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => setSelectedDifficulty(d.value)}
                        className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                          selectedDifficulty === d.value
                            ? 'border-primary bg-primary/10'
                            : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
                        }`}
                      >
                        <div className="font-medium">{d.label}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">{d.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Creating…' : 'Create Deck'}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
