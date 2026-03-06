'use client'

import { useState } from 'react'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EditDeckDialog } from './edit-deck-dialog'
import { DeleteConfirmationDialog } from './delete-confirmation-dialog'
import { deleteDeckAction } from '@/app/actions/decks'

interface DeckActionsProps {
  deck: {
    id: string
    title: string
    description: string | null
    difficulty: string
  }
}

export function DeckActions({ deck }: DeckActionsProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  async function handleDelete() {
    toast.success('Deck deleted successfully')
    await deleteDeckAction(deck.id)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreVertical className="size-4" />
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Edit Deck
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
            Delete Deck
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditDeckDialog deck={deck} open={editOpen} onOpenChange={setEditOpen} />

      <DeleteConfirmationDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Deck"
        description={`Are you sure you want to delete "${deck.title}"? All cards in this deck will also be deleted. This action cannot be undone.`}
        onConfirm={handleDelete}
      />
    </>
  )
}
