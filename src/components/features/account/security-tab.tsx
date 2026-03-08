'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface SecurityTabProps {
  email: string
}

export function SecurityTab({ email }: SecurityTabProps) {
  const router = useRouter()
  const [newEmail, setNewEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleChangeEmail = async () => {
    if (!newEmail) return
    setEmailSaving(true)
    setEmailMessage(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ email: newEmail })

      if (error) throw error

      setEmailMessage({ type: 'success', text: 'Confirmation email sent to your new address. Please check your inbox.' })
      setNewEmail('')
    } catch (err) {
      setEmailMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update email.' })
    } finally {
      setEmailSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) return

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Passwords do not match.' })
      return
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 8 characters.' })
      return
    }

    setPasswordSaving(true)
    setPasswordMessage(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })

      if (error) throw error

      setPasswordMessage({ type: 'success', text: 'Password updated successfully.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update password.' })
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Change Email</CardTitle>
          <CardDescription>
            Your current email is <span className="font-medium text-zinc-900 dark:text-zinc-50">{email}</span>.
            A confirmation will be sent to the new address.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-email">New Email Address</Label>
            <Input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter new email address"
            />
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          {emailMessage && (
            <p className={`text-sm ${emailMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {emailMessage.text}
            </p>
          )}
          <Button onClick={handleChangeEmail} disabled={emailSaving || !newEmail} className="ml-auto">
            {emailSaving ? 'Sending...' : 'Update email'}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password to keep your account secure.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          {passwordMessage && (
            <p className={`text-sm ${passwordMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {passwordMessage.text}
            </p>
          )}
          <Button onClick={handleChangePassword} disabled={passwordSaving || !newPassword || !confirmPassword} className="ml-auto">
            {passwordSaving ? 'Updating...' : 'Update password'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
