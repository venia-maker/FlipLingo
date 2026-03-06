'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

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

const difficulties = [
  { value: 'low', label: 'Low', description: 'Basic vocabulary' },
  { value: 'medium', label: 'Medium', description: 'Intermediate words' },
  { value: 'high', label: 'High', description: 'Advanced terms' },
  { value: 'mixed', label: 'Mixed', description: 'All levels' },
] as const

export function CreateDeckDialog() {
  const [open, setOpen] = useState(false)
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('mixed')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          New Deck
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Deck</DialogTitle>
          <DialogDescription>Add a new flashcard deck to study.</DialogDescription>
        </DialogHeader>
        <form action={async (formData: FormData) => {
          toast.success('Deck created successfully')
          await createDeckAction(formData)
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
            <Button type="submit">Create Deck</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
