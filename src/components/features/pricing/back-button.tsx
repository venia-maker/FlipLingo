'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function PricingBackButton() {
  const router = useRouter()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => router.back()}
      className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
    >
      <ArrowLeft className="size-4" />
      Go back
    </Button>
  )
}
