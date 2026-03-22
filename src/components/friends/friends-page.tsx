import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, UserPlus, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useFriendStore } from '@/stores/friend'
import { useChatStore } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'
import type { Profile } from '@/types/database'
import { useNavigate } from 'react-router-dom'

export function FriendsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const {
    friends,
    requests,
    onlineUsers,
    fetchFriends,
    fetchRequests,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
    searchUsers,
  } = useFriendStore()
  const createPrivateChat = useChatStore((s) => s.createPrivateChat)
  const hideChat = useChatStore((s) => s.hideChat)
  const fetchChats = useChatStore((s) => s.fetchChats)
  const chats = useChatStore((s) => s.chats)
  const setCurrentChat = useChatStore((s) => s.setCurrentChat)
  const session = useAuthStore((s) => s.session)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [confirmRemove, setConfirmRemove] = useState<{
    id: number
    friendId: string
    name: string
  } | null>(null)

  useEffect(() => {
    fetchFriends()
    fetchRequests()
  }, [])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    const results = await searchUsers(searchQuery)
    setSearchResults(results.filter((u) => u.id !== session?.user?.id))
  }

  const handleAddFriend = async (userId: string) => {
    const { error } = await sendRequest(userId)
    if (error) {
      toast.error(error)
    } else {
      toast.success(t('friends.requestSent'))
    }
  }

  const handleAccept = async (id: number) => {
    const { error } = await acceptRequest(id)
    if (error) toast.error(error)
    else {
      toast.success(t('friends.requestAccepted'))
      fetchFriends()
      fetchRequests()
    }
  }

  const handleConfirmRemove = async () => {
    if (!confirmRemove) return
    const { error } = await removeFriend(confirmRemove.id)
    if (error) {
      toast.error(error)
    } else {
      // Hide the private chat with this friend
      const privateChat = chats.find(
        (c) =>
          c.type === 'private' &&
          c.members?.some((m) => m.id === confirmRemove.friendId),
      )
      if (privateChat) await hideChat(privateChat.id)
      fetchFriends()
      fetchChats()
    }
    setConfirmRemove(null)
  }

  const handleSendMessage = async (friendId: string) => {
    const { chatId, error } = await createPrivateChat(friendId)
    if (error) {
      toast.error(error)
    } else if (chatId) {
      setCurrentChat(chatId)
      navigate('/')
    }
  }

  return (
    <div className="flex h-full flex-col p-6">
      <h1 className="mb-4 text-2xl font-bold">{t('friends.title')}</h1>
      <Tabs defaultValue="friends" className="flex-1">
        <TabsList>
          <TabsTrigger value="friends">{t('friends.title')}</TabsTrigger>
          <TabsTrigger value="requests">
            {t('friends.requests')}
            {requests.length > 0 && (
              <Badge variant="destructive" className="ml-1.5">
                {requests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="search">{t('friends.search')}</TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="flex-1">
          <ScrollArea className="h-[calc(100vh-180px)]">
            {friends.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                {t('friends.noFriends')}
              </p>
            ) : (
              <div className="space-y-1">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="hover:bg-accent flex items-center gap-3 rounded-lg p-3"
                  >
                    <div className="relative">
                      <Avatar>
                        <AvatarImage
                          src={friend.profile?.avatar_url ?? undefined}
                        />
                        <AvatarFallback>
                          {(
                            friend.profile?.nickname ??
                            friend.profile?.username ??
                            '?'
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {friend.profile && onlineUsers.has(friend.profile.id) && (
                        <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {friend.profile?.nickname ?? friend.profile?.username}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        @{friend.profile?.username}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        friend.profile && handleSendMessage(friend.profile.id)
                      }
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        friend.profile &&
                        setConfirmRemove({
                          id: friend.id,
                          friendId: friend.profile.id,
                          name:
                            friend.profile.nickname ?? friend.profile.username,
                        })
                      }
                    >
                      {t('friends.remove')}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="requests">
          <ScrollArea className="h-[calc(100vh-180px)]">
            {requests.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                {t('friends.noRequests')}
              </p>
            ) : (
              <div className="space-y-1">
                {requests.map((req) => (
                  <div
                    key={req.id}
                    className="hover:bg-accent flex items-center gap-3 rounded-lg p-3"
                  >
                    <Avatar>
                      <AvatarImage src={req.profile?.avatar_url ?? undefined} />
                      <AvatarFallback>
                        {(req.profile?.nickname ?? req.profile?.username ?? '?')
                          .charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {req.profile?.nickname ?? req.profile?.username}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        @{req.profile?.username}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => handleAccept(req.id)}>
                      {t('friends.accept')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        rejectRequest(req.id)
                        fetchRequests()
                      }}
                    >
                      {t('friends.reject')}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="search">
          <div className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                placeholder={t('friends.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-8"
              />
            </div>
            <Button onClick={handleSearch}>{t('friends.search')}</Button>
          </div>
          <ScrollArea className="h-[calc(100vh-240px)]">
            <div className="space-y-1">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="hover:bg-accent flex items-center gap-3 rounded-lg p-3"
                >
                  <Avatar>
                    <AvatarImage src={user.avatar_url ?? undefined} />
                    <AvatarFallback>
                      {(user.nickname ?? user.username).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {user.nickname ?? user.username}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      @{user.username}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddFriend(user.id)}
                  >
                    <UserPlus className="mr-1 h-4 w-4" />
                    {t('friends.addFriend')}
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Confirm remove dialog */}
      <Dialog
        open={!!confirmRemove}
        onOpenChange={(open) => !open && setConfirmRemove(null)}
      >
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>{t('friends.remove')}</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            {t('friends.confirmRemove', { name: confirmRemove?.name })}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmRemove(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleConfirmRemove}>
              {t('common.confirm')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
