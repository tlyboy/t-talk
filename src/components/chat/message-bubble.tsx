import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { Message } from '@/types/database'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MarkdownRenderer } from '@/components/markdown/markdown-renderer'
import { useChatStore } from '@/stores/chat'
import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const { t } = useTranslation()
  const profile = useChatStore((s) => s.getProfile(message.user_id ?? ''))
  const hideMessage = useChatStore((s) => s.hideMessage)
  const deleteMessageForAll = useChatStore((s) => s.deleteMessageForAll)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
  } | null>(null)

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const menuW = 160
    const menuH = isOwn ? 120 : 80
    const x =
      e.clientX + menuW > window.innerWidth ? e.clientX - menuW : e.clientX
    const y =
      e.clientY + menuH > window.innerHeight ? e.clientY - menuH : e.clientY
    setContextMenu({ x, y })
  }

  const handleHide = async () => {
    const { error } = await hideMessage(message.id)
    if (error) toast.error(error)
    setContextMenu(null)
  }

  const handleDeleteForAll = async () => {
    const { error } = await deleteMessageForAll(message.id)
    if (error) toast.error(error)
    setContextMenu(null)
  }

  return (
    <>
      <div
        className={cn('flex gap-2', isOwn ? 'flex-row-reverse' : 'flex-row')}
      >
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={profile?.avatar_url ?? undefined} />
          <AvatarFallback className="text-xs">
            {(profile?.nickname ?? profile?.username ?? '?')
              .charAt(0)
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className={cn('max-w-[70%]', isOwn ? 'items-end' : 'items-start')}>
          <p
            className={cn(
              'text-muted-foreground mb-0.5 text-xs',
              isOwn ? 'text-right' : 'text-left',
            )}
          >
            {profile?.nickname ?? profile?.username}
          </p>
          <div
            className={cn(
              'bg-muted rounded-2xl px-4 py-2',
              contextMenu && 'select-none',
            )}
            onContextMenu={handleContextMenu}
          >
            <MarkdownRenderer content={message.content} />
          </div>
          <p
            className={cn(
              'text-muted-foreground mt-0.5 text-[10px]',
              isOwn ? 'text-right' : 'text-left',
            )}
          >
            {message.created_at
              ? new Date(message.created_at).toLocaleTimeString()
              : ''}
          </p>
        </div>
      </div>

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
                const selection = window.getSelection()?.toString()
                navigator.clipboard.writeText(selection || message.content)
                toast.success(t('common.copied'))
                setContextMenu(null)
              }}
            >
              {t('common.copy')}
            </button>
            <button
              className="hover:bg-accent w-full rounded-sm px-2 py-1.5 text-left text-sm"
              onClick={handleHide}
            >
              {t('chat.hideMessage')}
            </button>
            {isOwn && (
              <button
                className="hover:bg-accent w-full rounded-sm px-2 py-1.5 text-left text-sm text-red-500"
                onClick={handleDeleteForAll}
              >
                {t('chat.deleteMessageForAll')}
              </button>
            )}
          </div>
        </>
      )}
    </>
  )
}
