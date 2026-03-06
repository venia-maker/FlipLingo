'use client'

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
import { Label } from '@/components/ui/label'
import { updateCardAction } from '@/app/actions/cards'

interface EditCardDialogProps {
  card: {
    id: string
    front: string
    back: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditCardDialog({ card, open, onOpenChange }: EditCardDialogProps) {
  async function handleSubmit(formData: FormData) {
    await updateCardAction(card.id, formData)
    onOpenChange(false)
    toast.success('Card updated successfully')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Card</DialogTitle>
          <DialogDescription>Update the front and back of this card.</DialogDescription>
        </DialogHeader>
        <form action={handleSubmit}>
          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="front">Front</Label>
              <Input
                id="front"
                name="front"
                required
                defaultValue={card.front}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="back">Back</Label>
              <Input
                id="back"
                name="back"
                required
                defaultValue={card.back}
              />
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
