'use client'

import { useState, useTransition } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { deleteCardAction, updateCardAction } from '@/app/actions/cards'

interface SortableCardProps {
  card: {
    id: string
    deckId: string
    front: string
    back: string
    position: number
  }
  isSelected: boolean
  isSelecting: boolean
  onToggleSelect: (cardId: string) => void
  onDeleted: (cardId: string) => void
  onUpdated: (cardId: string, front: string, back: string) => void
}

export function SortableCard({ card, isSelected, isSelecting, onToggleSelect, onDeleted, onUpdated }: SortableCardProps) {
  const [isPending, startTransition] = useTransition()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteCardAction(card.id)
        onDeleted(card.id)
        toast.success('Card deleted')
        setDeleteOpen(false)
      } catch {
        toast.error('Failed to delete card')
      }
    })
  }

  const handleEdit = (formData: FormData) => {
    startTransition(async () => {
      try {
        await updateCardAction(card.id, formData)
        const front = formData.get('front') as string
        const back = formData.get('back') as string
        onUpdated(card.id, front, back)
        toast.success('Card updated')
        setEditOpen(false)
      } catch {
        toast.error('Failed to update card')
      }
    })
  }

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        className={`group flex-row items-center gap-4 rounded-xl border p-4 shadow-sm transition-colors ${
          isSelected
            ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30'
            : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
        }`}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(card.id)}
          className={`size-4 shrink-0 cursor-pointer rounded border-zinc-300 text-blue-600 accent-blue-600 transition-opacity ${
            isSelecting ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        />

        <button
          type="button"
          className="cursor-grab touch-none text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-5" />
        </button>

        <div className="flex-1 min-w-0 text-left">
          <p className="font-medium text-zinc-900 dark:text-zinc-50 truncate">
            {card.front}
          </p>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400 truncate">
            {card.back}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 text-zinc-400 hover:text-zinc-600">
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
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Card</DialogTitle>
            <DialogDescription>Update the front and back of this card.</DialogDescription>
          </DialogHeader>
          <form action={handleEdit}>
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor={`edit-front-${card.id}`}>Front</Label>
                <Input
                  id={`edit-front-${card.id}`}
                  name="front"
                  defaultValue={card.front}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`edit-back-${card.id}`}>Back</Label>
                <Input
                  id={`edit-back-${card.id}`}
                  name="back"
                  defaultValue={card.back}
                  required
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Card</DialogTitle>
            <DialogDescription>
              This will permanently delete this card. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
