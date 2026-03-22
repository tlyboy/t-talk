import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { uploadAvatar } from '@/lib/storage'

export function ProfilePage() {
  const { t } = useTranslation()
  const profile = useAuthStore((s) => s.profile)
  const fetchProfile = useAuthStore((s) => s.fetchProfile)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [username, setUsername] = useState(profile?.username ?? '')
  const [nickname, setNickname] = useState(profile?.nickname ?? '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleSave = async () => {
    if (!profile) return
    if (!username.trim()) {
      toast.error(t('profile.usernameRequired'))
      return
    }
    setSaving(true)

    const updates: { username?: string; nickname?: string } = {}
    if (username !== profile.username) updates.username = username.trim()
    if (nickname !== (profile.nickname ?? '')) updates.nickname = nickname

    if (Object.keys(updates).length === 0) {
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.id)

    setSaving(false)

    if (error) {
      if (
        error.message.includes('unique') ||
        error.message.includes('duplicate')
      ) {
        toast.error(t('profile.usernameTaken'))
      } else {
        toast.error(error.message)
      }
    } else {
      toast.success(t('profile.saved'))
      fetchProfile()
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    setUploading(true)
    try {
      const avatarUrl = await uploadAvatar(profile.id, file)
      await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', profile.id)
      toast.success(t('profile.saved'))
      fetchProfile()
    } catch {
      toast.error(t('common.error'))
    }
    setUploading(false)
    e.target.value = ''
  }

  if (!profile) return null

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-md space-y-6">
        <h1 className="text-2xl font-bold">{t('profile.title')}</h1>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="group relative cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="text-2xl">
                {(profile.nickname || profile.username || '?')
                  .charAt(0)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-5 w-5 text-white" />
            </div>
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        {/* Fields */}
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>{t('auth.username')}</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('auth.usernamePlaceholder')}
            />
            <p className="text-muted-foreground text-xs">
              {t('profile.usernameHint')}
            </p>
          </div>
          <div className="grid gap-2">
            <Label>{t('auth.nickname')}</Label>
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={t('auth.nicknamePlaceholder')}
            />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t('common.loading') : t('profile.save')}
          </Button>
        </div>
      </div>
    </div>
  )
}
