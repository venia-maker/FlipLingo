'use client'

import { useState, useTransition } from 'react'
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
import { addCardAction } from '@/app/actions/cards'

interface AddCardDialogProps {
  deckId: string
}

export function AddCardDialog({ deckId }: AddCardDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await addCardAction(deckId, formData)
      setOpen(false)
      toast.success('Card added successfully')
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="size-4" />
          Add Card
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Card</DialogTitle>
          <DialogDescription>
            Add a flashcard with a question on the front and an answer on the back.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit}>
          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="front">Front</Label>
              <Input id="front" name="front" required placeholder="e.g. Hello, What is 2+2?" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="back">Back</Label>
              <Input id="back" name="back" required placeholder="e.g. Hola, 4" />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="submit" disabled={isPending}>
            {isPending ? 'Adding…' : 'Add Card'}
          </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
