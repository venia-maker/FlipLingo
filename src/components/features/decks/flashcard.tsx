'use client'

interface FlashcardProps {
  front: string
  back: string
  isFlipped: boolean
  onFlip: () => void
}

export function Flashcard({ front, back, isFlipped, onFlip }: FlashcardProps) {
  return (
    <div
      className="mx-auto w-full max-w-md cursor-pointer"
      style={{ perspective: '1000px' }}
      onClick={onFlip}
    >
      <div
        className="relative h-64 w-full transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front face */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="text-center text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {front}
          </span>
        </div>
        {/* Back face */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <span className="text-center text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {back}
          </span>
        </div>
      </div>
    </div>
  )
}
