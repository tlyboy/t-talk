import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { UserMinus, UserPlus, Camera } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useChatStore, type ChatDisplay } from '@/stores/chat'
import { useFriendStore } from '@/stores/friend'
import { useAuthStore } from '@/stores/auth'
import { uploadFile } from '@/lib/storage'

interface ChatDetailProps {
  chat: ChatDisplay
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChatDetail({ chat, open, onOpenChange }: ChatDetailProps) {
  const { t } = useTranslation()
  const session = useAuthStore((s) => s.session)
  const hideChat = useChatStore((s) => s.hideChat)
  const deleteChatForAll = useChatStore((s) => s.deleteChatForAll)
  const leaveChat = useChatStore((s) => s.leaveChat)
  const clearMessages = useChatStore((s) => s.clearMessages)
  const clearMyMessages = useChatStore((s) => s.clearMyMessages)
  const removeMember = useChatStore((s) => s.removeMember)
  const updateChat = useChatStore((s) => s.updateChat)
  const createGroupChat = useChatStore((s) => s.createGroupChat)
  const setCurrentChat = useChatStore((s) => s.setCurrentChat)
  const friends = useFriendStore((s) => s.friends)
  const fetchFriends = useFriendStore((s) => s.fetchFriends)
  const [confirmAction, setConfirmAction] = useState<string | null>(null)
  const [removingMember, setRemovingMember] = useState<{
    id: string
    name: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set())
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [groupTitle, setGroupTitle] = useState(chat.title ?? '')

  const isOwner = chat.created_by === session?.user?.id
  const isGroup = chat.type === 'group'
  const memberIds = new Set(chat.members?.map((m) => m.id) ?? [])

  useEffect(() => {
    setGroupTitle(chat.title ?? '')
  }, [chat.title])

  // Fetch friends when opened
  useEffect(() => {
    if (open) fetchFriends()
  }, [open])

  const availableFriends = friends.filter(
    (f) => f.profile && !memberIds.has(f.profile.id),
  )

  const toggleFriend = (id: string) => {
    setSelectedFriends((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleInvite = async () => {
    if (selectedFriends.size === 0) return
    setLoading(true)

    if (!isGroup) {
      // Private chat → create new group with current members + selected
      const otherMember = chat.members?.find((m) => m.id !== session?.user?.id)
      const memberIds = [
        ...(otherMember ? [otherMember.id] : []),
        ...Array.from(selectedFriends),
      ]
      const { chatId, error } = await createGroupChat(undefined, memberIds)
      if (error) {
        toast.error(error)
      } else if (chatId) {
        setCurrentChat(chatId)
        onOpenChange(false)
      }
    } else {
      // TODO: Add members to existing group via chat_members insert
      toast.success(t('friends.requestSent'))
    }

    setLoading(false)
    setInviteOpen(false)
    setSelectedFriends(new Set())
  }

  const handleConfirmedAction = async () => {
    setLoading(true)
    let result
    if (confirmAction === 'exit') {
      if (isGroup && !isOwner) {
        result = await leaveChat(chat.id)
      } else {
        result = await deleteChatForAll(chat.id)
      }
    } else if (confirmAction === 'clearAll') {
      result = await clearMessages(chat.id)
    } else if (confirmAction === 'clearMine') {
      result = await clearMyMessages(chat.id)
    }
    setLoading(false)
    if (result?.error) {
      toast.error(result.error)
    } else if (confirmAction === 'exit') {
      setCurrentChat(null)
      onOpenChange(false)
    }
    setConfirmAction(null)
  }

  const getConfirmMessage = () => {
    if (confirmAction === 'exit') {
      if (!isGroup) return t('chat.confirmDeleteForAll')
      if (isOwner) return t('chat.confirmDissolve')
      return t('chat.confirmLeave')
    }
    if (confirmAction === 'clearAll') return t('chat.confirmClearAll')
    if (confirmAction === 'clearMine') return t('chat.confirmClearMine')
    return ''
  }

  const getExitLabel = () => {
    if (!isGroup) return t('chat.delete')
    if (isOwner) return t('chat.dissolve')
    return t('chat.leave')
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="flex flex-col overflow-hidden p-0"
        >
          <SheetHeader className="p-4 pb-0">
            <SheetTitle className="sr-only">{chat.displayName}</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            {/* Profile / Group info */}
            <div className="flex flex-col items-center gap-3 border-b p-6">
              <div
                className={
                  isGroup && isOwner
                    ? 'group relative cursor-pointer'
                    : 'relative'
                }
                onClick={() =>
                  isGroup && isOwner && avatarInputRef.current?.click()
                }
              >
                <Avatar className="h-16 w-16">
                  <AvatarImage src={chat.displayAvatar ?? undefined} />
                  <AvatarFallback className="text-xl">
                    {(chat.displayName ?? '?').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isGroup && isOwner && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const url = await uploadFile(
                      `chat-avatars/${chat.id}.${file.name.split('.').pop()}`,
                      file,
                    )
                    await updateChat(chat.id, { avatar_url: url })
                  } catch {
                    toast.error(t('common.error'))
                  }
                  e.target.value = ''
                }}
              />
              {isGroup && isOwner ? (
                <Input
                  className="text-center text-lg font-medium"
                  value={groupTitle}
                  onChange={(e) => setGroupTitle(e.target.value)}
                  onBlur={() => {
                    if (groupTitle !== (chat.title ?? '')) {
                      updateChat(chat.id, { title: groupTitle })
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      ;(e.target as HTMLInputElement).blur()
                    }
                  }}
                  placeholder={t('chat.groupNamePlaceholder')}
                />
              ) : (
                <p className="text-lg font-medium">{chat.displayName}</p>
              )}
            </div>

            {/* Invite button */}
            <div className="border-b p-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setInviteOpen(true)}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {isGroup ? t('chat.invite') : t('chat.inviteToGroup')}
              </Button>
            </div>

            {/* Group members */}
            {isGroup && chat.members && (
              <div className="border-b p-4">
                <p className="text-muted-foreground mb-3 text-sm">
                  {t('chat.members')} ({chat.members.length})
                </p>
                <div className="space-y-1">
                  {chat.members.map((member) => (
                    <div
                      key={member.id}
                      className="hover:bg-accent flex items-center gap-3 rounded-lg p-2 transition-colors"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={member.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {(member.nickname ?? member.username)
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">
                            {member.nickname ?? member.username}
                          </span>
                          {member.id === chat.created_by && (
                            <Badge
                              variant="secondary"
                              className="px-1 py-0 text-[10px]"
                            >
                              {t('chat.owner')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground text-xs">
                          @{member.username}
                        </p>
                      </div>
                      {isOwner && member.id !== session?.user?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500"
                          onClick={() =>
                            setRemovingMember({
                              id: member.id,
                              name: member.nickname ?? member.username,
                            })
                          }
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom actions */}
          <div className="flex flex-col gap-2 border-t p-4">
            {confirmAction ? (
              <div className="flex flex-col gap-3">
                <p className="text-center text-sm">{getConfirmMessage()}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setConfirmAction(null)}
                    disabled={loading}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleConfirmedAction}
                    disabled={loading}
                  >
                    {loading ? t('common.loading') : t('common.confirm')}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setConfirmAction('clearMine')}
                >
                  {t('chat.clearMyHistory')}
                </Button>
                {(!isGroup || isOwner) && (
                  <Button
                    variant="outline"
                    className="w-full text-orange-500 hover:text-orange-600"
                    onClick={() => setConfirmAction('clearAll')}
                  >
                    {t('chat.clearAllHistory')}
                  </Button>
                )}
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setConfirmAction('exit')}
                >
                  {getExitLabel()}
                </Button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Invite friends dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {isGroup ? t('chat.invite') : t('chat.inviteToGroup')}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-56">
            {availableFriends.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                {t('friends.noFriends')}
              </p>
            ) : (
              <div className="space-y-1">
                {availableFriends.map((friend) => {
                  const profile = friend.profile!
                  return (
                    <label
                      key={profile.id}
                      className="hover:bg-accent flex cursor-pointer items-center gap-3 rounded-lg p-2"
                    >
                      <Checkbox
                        checked={selectedFriends.has(profile.id)}
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
          <Button
            onClick={handleInvite}
            disabled={loading || selectedFriends.size === 0}
          >
            {loading ? t('common.loading') : t('common.confirm')}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Remove member confirm dialog */}
      <Dialog
        open={!!removingMember}
        onOpenChange={(open) => !open && setRemovingMember(null)}
      >
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>{t('chat.removeMember')}</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            {t('chat.confirmRemoveMember', { name: removingMember?.name })}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRemovingMember(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!removingMember) return
                const { error } = await removeMember(chat.id, removingMember.id)
                if (error) toast.error(error)
                setRemovingMember(null)
              }}
            >
              {t('common.confirm')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
