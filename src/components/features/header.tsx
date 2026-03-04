'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { AuthDialog } from '@/components/features/auth/auth-dialog'
import { UserDropdown } from '@/components/features/auth/user-dropdown'

interface HeaderProps {
  user?: { email: string } | null
}

export function Header({ user }: HeaderProps) {
  const [authOpen, setAuthOpen] = useState(false)
  const [authView, setAuthView] = useState<'login' | 'signup'>('login')

  const openAuth = (view: 'login' | 'signup') => {
    setAuthView(view)
    setAuthOpen(true)
  }

  return (
    <>
      <header className="flex w-full items-center justify-between px-6 py-4">
        <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          FlipLingo
        </span>
        <div className="flex items-center gap-3">
          {user ? (
            <UserDropdown email={user.email} />
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => openAuth('login')}>
                Sign in
              </Button>
              <Button size="sm" onClick={() => openAuth('signup')}>
                Sign up
              </Button>
            </>
          )}
        </div>
      </header>
      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultView={authView} />
    </>
  )
}
