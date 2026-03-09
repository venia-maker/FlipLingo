'use client'

import { useSearchParams } from 'next/navigation'

export function CheckoutError() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  if (error !== 'checkout_failed') return null

  return (
    <div className="mx-auto mb-6 w-full max-w-4xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
      Something went wrong while creating your checkout session. Please try again or contact support if the issue persists.
    </div>
  )
}
