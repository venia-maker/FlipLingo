'use client'

import { useState, useCallback, useEffect, useId, useTransition } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SortableCard } from './sortable-card'
import { reorderCardsAction, deleteCardsAction } from '@/app/actions/cards'

interface CardItem {
  id: string
  deckId: string
  front: string
  back: string
  position: number
}

interface CardListProps {
  deckId: string
  initialCards: CardItem[]
}

export function CardList({ deckId, initialCards }: CardListProps) {
  const dndId = useId()
  const [cards, setCards] = useState(initialCards)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setCards(initialCards)
    setSelectedIds(new Set())
  }, [initialCards])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = cards.findIndex((c) => c.id === active.id)
      const newIndex = cards.findIndex((c) => c.id === over.id)
      const reordered = arrayMove(cards, oldIndex, newIndex)

      setCards(reordered)

      const cardPositions = reordered.map((card, index) => ({
        id: card.id,
        position: index,
      }))
      reorderCardsAction(deckId, cardPositions)
    },
    [deckId, cards],
  )

  const handleCardDeleted = useCallback((cardId: string) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(cardId)
      return next
    })
  }, [])

  const handleCardUpdated = useCallback((cardId: string, front: string, back: string) => {
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, front, back } : c)),
    )
  }, [])

  const handleToggleSelect = useCallback((cardId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(cardId)) {
        next.delete(cardId)
      } else {
        next.add(cardId)
      }
      return next
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === cards.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(cards.map((c) => c.id)))
    }
  }, [cards, selectedIds.size])

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds)
    startTransition(async () => {
      try {
        await deleteCardsAction(deckId, ids)
        setCards((prev) => prev.filter((c) => !selectedIds.has(c.id)))
        setSelectedIds(new Set())
        toast.success(`Deleted ${ids.length} card${ids.length === 1 ? '' : 's'}`)
      } catch {
        toast.error('Failed to delete cards')
      }
    })
  }

  if (cards.length === 0) {
    return (
      <p className="text-center text-zinc-500 dark:text-zinc-400">
        No cards in this deck yet.
      </p>
    )
  }

  const isSelecting = selectedIds.size > 0

  return (
    <div>
      {isSelecting && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-2.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              <X className="size-4" />
            </button>
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {selectedIds.size} selected
            </span>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {selectedIds.size === cards.length ? 'Deselect all' : 'Select all'}
            </button>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteConfirmOpen(true)}
            disabled={isPending}
          >
            <Trash2 className="size-4" />
            {isPending ? 'Deleting...' : `Delete (${selectedIds.size})`}
          </Button>
        </div>
      )}

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedIds.size} card{selectedIds.size === 1 ? '' : 's'}?</DialogTitle>
            <DialogDescription>
              This will permanently delete the selected card{selectedIds.size === 1 ? '' : 's'}. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                handleBulkDelete()
                setDeleteConfirmOpen(false)
              }}
              disabled={isPending}
            >
              {isPending ? 'Deleting...' : 'Delete permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-3">
            {cards.map((card) => (
              <SortableCard
                key={card.id}
                card={card}
                isSelected={selectedIds.has(card.id)}
                isSelecting={isSelecting}
                onToggleSelect={handleToggleSelect}
                onDeleted={handleCardDeleted}
                onUpdated={handleCardUpdated}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
