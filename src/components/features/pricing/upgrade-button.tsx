'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { createCheckoutSessionAction } from '@/app/actions/stripe'

export function UpgradeButton({ priceId, label }: { priceId: string; label: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      size="lg"
      className="w-full"
      disabled={isPending}
      onClick={() => {
        startTransition(() => createCheckoutSessionAction(priceId))
      }}
    >
      {isPending ? 'Redirecting…' : label}
    </Button>
  )
}
