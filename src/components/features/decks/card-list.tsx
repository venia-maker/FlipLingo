'use client'

import { useState, useCallback, useEffect } from 'react'
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

import { SortableCard } from './sortable-card'
import { reorderCardsAction } from '@/app/actions/cards'

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
  const [cards, setCards] = useState(initialCards)

  useEffect(() => {
    setCards(initialCards)
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
  }, [])

  if (cards.length === 0) {
    return (
      <p className="text-center text-zinc-500 dark:text-zinc-400">
        No cards in this deck yet.
      </p>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-3">
          {cards.map((card) => (
            <SortableCard key={card.id} card={card} onDeleted={handleCardDeleted} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
