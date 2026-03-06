'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EditCardDialog } from './edit-card-dialog'
import { DeleteConfirmationDialog } from './delete-confirmation-dialog'
import { deleteCardAction } from '@/app/actions/cards'

interface SortableCardProps {
  card: {
    id: string
    front: string
    back: string
  }
  onDeleted?: (cardId: string) => void
}

export function SortableCard({ card, onDeleted }: SortableCardProps) {
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
  }

  async function handleDelete() {
    await deleteCardAction(card.id)
    onDeleted?.(card.id)
    toast.success('Card deleted successfully')
  }

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        className={isDragging ? 'opacity-50 shadow-lg' : ''}
      >
        <CardContent className="flex items-center gap-3">
          <button
            type="button"
            className="cursor-grab touch-none text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-5" />
          </button>
          <div className="flex-1">
            <div className="font-medium text-zinc-900 dark:text-zinc-50">{card.front}</div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">{card.back}</div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="xs" className="size-8">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                <Pencil className="size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setDeleteOpen(true)}
              >
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>

      <EditCardDialog card={card} open={editOpen} onOpenChange={setEditOpen} />

      <DeleteConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Card"
        description="Are you sure you want to delete this card? This action cannot be undone."
        onConfirm={handleDelete}
      />
    </>
  )
}
