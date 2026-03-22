import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { useFriendStore } from '@/stores/friend'
import { useChatStore } from '@/stores/chat'

interface CreateGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateGroupDialog({
  open,
  onOpenChange,
}: CreateGroupDialogProps) {
  const { t } = useTranslation()
  const friends = useFriendStore((s) => s.friends)
  const fetchFriends = useFriendStore((s) => s.fetchFriends)
  const createGroupChat = useChatStore((s) => s.createGroupChat)
  const setCurrentChat = useChatStore((s) => s.setCurrentChat)

  useEffect(() => {
    if (open) {
      fetchFriends()
    } else {
      setTitle('')
      setSelected(new Set())
    }
  }, [open])

  const [title, setTitle] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const toggleFriend = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleCreate = async () => {
    if (selected.size < 2) {
      toast.error(t('chat.groupMinMembers'))
      return
    }
    setLoading(true)
    const { chatId, error } = await createGroupChat(
      title || undefined,
      Array.from(selected),
    )
    setLoading(false)
    if (error) {
      toast.error(error)
    } else if (chatId) {
      setCurrentChat(chatId)
      onOpenChange(false)
      setTitle('')
      setSelected(new Set())
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('chat.newGroup')}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>{t('chat.groupName')}</Label>
            <Input
              placeholder={t('chat.groupNamePlaceholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>
              {t('chat.selectMembers')} ({selected.size})
            </Label>
            <ScrollArea className="max-h-56 rounded-md border p-2">
              {friends.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center text-sm">
                  {t('friends.noFriends')}
                </p>
              ) : (
                <div className="space-y-1">
                  {friends.map((friend) => {
                    const profile = friend.profile
                    if (!profile) return null
                    return (
                      <label
                        key={profile.id}
                        className="hover:bg-accent flex cursor-pointer items-center gap-3 rounded-lg p-2"
                      >
                        <Checkbox
                          checked={selected.has(profile.id)}
                          onCheckedChange={() => toggleFriend(profile.id)}
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={profile.avatar_url ?? undefined} />
                          <AvatarFallback className="text-xs">
                            {(profile.nickname ?? profile.username)
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {profile.nickname ?? profile.username}
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          <Button
            onClick={handleCreate}
            disabled={loading || selected.size < 2}
          >
            {loading ? t('common.loading') : t('chat.newGroup')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
