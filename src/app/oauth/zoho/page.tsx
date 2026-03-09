'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

import { exchangeZohoCode } from '@/app/actions/zoho'

export default function ZohoOAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
          <Loader2 className="size-10 animate-spin text-zinc-500" />
        </div>
      }
    >
      <ZohoOAuthContent />
    </Suspense>
  )
}

function ZohoOAuthContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get('code')
    const oauthError = searchParams.get('error')

    if (oauthError || !code) {
      setStatus('error')
      setErrorMessage(oauthError ?? 'No authorization code received from Zoho.')
      return
    }

    exchangeZohoCode(code)
      .then((result) => {
        if (result.success) {
          setStatus('success')
          setTimeout(() => {
            router.push('/account?tab=integrations')
          }, 1500)
        } else {
          setStatus('error')
          setErrorMessage(result.error ?? 'Failed to connect to Zoho Desk.')
        }
      })
      .catch((err) => {
        setStatus('error')
        setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.')
      })
  }, [searchParams, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-md rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        {status === 'loading' && (
          <>
            <Loader2 className="mx-auto mb-4 size-10 animate-spin text-zinc-500" />
            <h1 className="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Connecting to Zoho Desk
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Please wait while we set up your integration...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="mx-auto mb-4 size-10 text-green-500" />
            <h1 className="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Connected Successfully
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Redirecting to your account...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="mx-auto mb-4 size-10 text-red-500" />
            <h1 className="mb-2 text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Connection Failed
            </h1>
            <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
              {errorMessage}
            </p>
            <a
              href="/account?tab=integrations"
              className="inline-flex items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Try Again
            </a>
          </>
        )}
      </div>
    </div>
  )
}
