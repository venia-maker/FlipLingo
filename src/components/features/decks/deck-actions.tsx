'use client'

import { useState, useTransition } from 'react'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateDeckAction, deleteDeckAction } from '@/app/actions/decks'

interface DeckActionsProps {
  deck: {
    id: string
    title: string
    description: string | null
    difficulty: string
  }
}

const difficulties = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'mixed', label: 'Mixed' },
] as const

export function DeckActions({ deck }: DeckActionsProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [selectedDifficulty, setSelectedDifficulty] = useState(deck.difficulty)

  const handleEdit = (formData: FormData) => {
    startTransition(async () => {
      try {
        await updateDeckAction(deck.id, formData)
        toast.success('Deck updated')
        setEditOpen(false)
      } catch {
        toast.error('Failed to update deck')
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteDeckAction(deck.id)
        toast.success('Deck deleted')
      } catch {
        toast.error('Failed to delete deck')
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-red-600 dark:text-red-400"
          >
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Deck</DialogTitle>
            <DialogDescription>Update your deck details.</DialogDescription>
          </DialogHeader>
          <form action={handleEdit}>
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input id="edit-title" name="title" defaultValue={deck.title} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input id="edit-description" name="description" defaultValue={deck.description ?? ''} />
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
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving…' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Deck</DialogTitle>
            <DialogDescription>
              This will permanently delete &quot;{deck.title}&quot; and all its cards. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
