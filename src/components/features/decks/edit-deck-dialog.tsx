'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { updateDeckAction } from '@/app/actions/decks'

const difficulties = [
  { value: 'low', label: 'Low', description: 'Basic vocabulary' },
  { value: 'medium', label: 'Medium', description: 'Intermediate words' },
  { value: 'high', label: 'High', description: 'Advanced terms' },
  { value: 'mixed', label: 'Mixed', description: 'All levels' },
] as const

interface EditDeckDialogProps {
  deck: {
    id: string
    title: string
    description: string | null
    difficulty: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditDeckDialog({ deck, open, onOpenChange }: EditDeckDialogProps) {
  const [selectedDifficulty, setSelectedDifficulty] = useState(deck.difficulty)

  async function handleSubmit(formData: FormData) {
    await updateDeckAction(deck.id, formData)
    onOpenChange(false)
    toast.success('Deck updated successfully')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Deck</DialogTitle>
          <DialogDescription>Update your deck details.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit}>
          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                required
                defaultValue={deck.title}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={deck.description ?? ''}
                placeholder="Optional description"
              />
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
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {d.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
