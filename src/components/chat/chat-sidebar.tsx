import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Search, UserPlus, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useChatStore, type ChatDisplay } from '@/stores/chat'
import { CreateGroupDialog } from './create-group-dialog'
import { cn } from '@/lib/utils'

export function ChatSidebar() {
  const { t } = useTranslation()
  const chats = useChatStore((s) => s.chats)
  const currentChatId = useChatStore((s) => s.currentChatId)
  const setCurrentChat = useChatStore((s) => s.setCurrentChat)
  const hideChat = useChatStore((s) => s.hideChat)
  const getProfile = useChatStore((s) => s.getProfile)
  const [search, setSearch] = useState('')
  const [contextMenu, setContextMenu] = useState<{
    chat: ChatDisplay
    x: number
    y: number
  } | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    chat: ChatDisplay
    action: 'hide'
  } | null>(null)
  const [groupDialogOpen, setGroupDialogOpen] = useState(false)

  const navigate = useNavigate()
  const filteredChats = chats.filter(
    (c) =>
      !search || c.displayName?.toLowerCase().includes(search.toLowerCase()),
  )

  const handleContextMenu = (e: React.MouseEvent, chat: ChatDisplay) => {
    e.preventDefault()
    e.stopPropagation()
    window.getSelection()?.removeAllRanges()
    const menuW = 160
    const menuH = 80
    const x =
      e.clientX + menuW > window.innerWidth ? e.clientX - menuW : e.clientX
    const y =
      e.clientY + menuH > window.innerHeight ? e.clientY - menuH : e.clientY
    setContextMenu({ chat, x, y })
  }

  const handleConfirm = async () => {
    if (!confirmDialog) return
    const result = await hideChat(confirmDialog.chat.id)
    if (result.error) toast.error(result.error)
    setConfirmDialog(null)
  }

  return (
    <div className="flex h-full w-72 flex-col border-r">
      <div className="flex items-center gap-2 border-b p-3">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
          <Input
            placeholder={t('chat.searchChats')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="hover:bg-accent hover:text-accent-foreground inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors">
            <Plus className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate('/friends')}>
              <UserPlus className="mr-2 h-4 w-4" />
              {t('friends.addFriend')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setGroupDialogOpen(true)}>
              <Users className="mr-2 h-4 w-4" />
              {t('chat.newGroup')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ScrollArea className="flex-1 select-none">
        {filteredChats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => setCurrentChat(chat.id)}
            onContextMenu={(e) => handleContextMenu(e, chat)}
            className={cn(
              'hover:bg-accent flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors',
              currentChatId === chat.id && 'bg-accent',
            )}
          >
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={chat.displayAvatar ?? undefined} />
              <AvatarFallback>
                {(chat.displayName ?? '?').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {chat.displayName ?? t('chat.title')}
              </p>
              <p className="text-muted-foreground truncate text-xs">
                {chat.lastMessage
                  ? `${getProfile(chat.lastMessage.user_id ?? '')?.nickname || getProfile(chat.lastMessage.user_id ?? '')?.username || ''}: ${chat.lastMessage.content}`
                  : t('chat.noMessages')}
              </p>
            </div>
          </button>
        ))}
      </ScrollArea>

      {/* Context menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-50 select-none"
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault()
              setContextMenu(null)
            }}
          />
          <div
            className="bg-popover text-popover-foreground fixed z-50 min-w-36 rounded-md border p-1 shadow-md"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              className="hover:bg-accent w-full rounded-sm px-2 py-1.5 text-left text-sm"
              onClick={() => {
                setConfirmDialog({ chat: contextMenu.chat, action: 'hide' })
                setContextMenu(null)
              }}
            >
              {t('chat.hide')}
            </button>
          </div>
        </>
      )}

      {/* Confirm dialog */}
      <Dialog
        open={!!confirmDialog}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>{t('chat.hide')}</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            {t('chat.confirmHide')}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
              {t('common.confirm')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CreateGroupDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
      />
    </div>
  )
}
