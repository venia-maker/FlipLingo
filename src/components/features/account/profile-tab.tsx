'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface ProfileTabProps {
  email: string
  avatarUrl: string | null
  fullName: string | null
}

export function ProfileTab({ email, avatarUrl, fullName }: ProfileTabProps) {
  const router = useRouter()
  const [name, setName] = useState(fullName ?? '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const initials = (name || email).slice(0, 2).toUpperCase()

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('Not authenticated')

      const fileExt = file.name.split('.').pop()
      const filePath = `${userData.user.id}/avatar.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: urlData.publicUrl },
      })

      if (updateError) throw updateError

      setMessage({ type: 'success', text: 'Avatar updated successfully.' })
      router.refresh()
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Failed to upload avatar.'
      const text = raw.includes('Bucket not found')
        ? 'Avatar storage is not configured. Please contact support.'
        : raw
      setMessage({ type: 'error', text })
    } finally {
      setUploading(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        data: { full_name: name },
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Profile updated successfully.' })
      router.refresh()
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Failed to update profile.'
      const text = raw.includes('row-level security')
        ? 'Unable to update profile. Please contact support.'
        : raw
      setMessage({ type: 'error', text })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>Update your profile photo.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <Avatar className="size-20">
            <AvatarImage src={avatarUrl ?? undefined} alt={name || email} />
            <AvatarFallback className="text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <Label htmlFor="avatar-upload" className="cursor-pointer">
              <Button variant="outline" size="sm" asChild>
                <span>{uploading ? 'Uploading...' : 'Change photo'}</span>
              </Button>
            </Label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={uploading}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">JPG, PNG or GIF. Max 2MB.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your name and view your email address.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full-name">Full Name</Label>
            <Input
              id="full-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled />
            <p className="text-xs text-muted-foreground">
              To change your email, go to the Security tab.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between">
          {message && (
            <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {message.text}
            </p>
          )}
          <Button onClick={handleSaveProfile} disabled={saving} className="ml-auto">
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
