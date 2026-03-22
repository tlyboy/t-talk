import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EllipsisVertical, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useChatStore } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'
import { MessageBubble } from './message-bubble'
import { ChatInput } from './chat-input'
import { ChatDetail } from './chat-detail'
import { cn } from '@/lib/utils'

export function ChatView() {
  const { t } = useTranslation()
  const currentChatId = useChatStore((s) => s.currentChatId)
  const chats = useChatStore((s) => s.chats)
  const messages = useChatStore((s) => s.messages)
  const messagesLoading = useChatStore((s) => s.messagesLoading)
  const fetchMessages = useChatStore((s) => s.fetchMessages)
  const session = useAuthStore((s) => s.session)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [droppedFile, setDroppedFile] = useState<File | null>(null)
  const dragCounter = useRef(0)

  const currentChat = chats.find((c) => c.id === currentChatId)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleScroll = () => {
    if (!scrollRef.current || messagesLoading) return
    if (scrollRef.current.scrollTop === 0 && messages.length >= 50) {
      const prevHeight = scrollRef.current.scrollHeight
      fetchMessages(currentChatId, messages.length).then(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop =
            scrollRef.current.scrollHeight - prevHeight
        }
      })
    }
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current++
    setDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0) setDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current = 0
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) setDroppedFile(file)
  }

  if (!currentChatId || !currentChat) return null

  return (
    <div
      className="relative flex h-full flex-col"
      onDragEnter={handleDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {dragging && (
        <div className="bg-primary/10 border-primary absolute inset-0 z-40 flex items-center justify-center border-2 border-dashed">
          <div className="flex flex-col items-center gap-2">
            <Upload className="text-primary h-10 w-10" />
            <p className="text-primary text-sm font-medium">
              {t('chat.dropFile')}
            </p>
          </div>
        </div>
      )}

      {/* Chat header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm font-medium">
          {currentChat.displayName ?? t('chat.title')}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setDetailOpen(true)}
        >
          <EllipsisVertical className="h-4 w-4" />
        </Button>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto p-4"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {messagesLoading ? (
          <div className="text-muted-foreground flex items-center justify-center py-8">
            {t('common.loading')}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-muted-foreground flex items-center justify-center py-8">
            {t('chat.noMessages')}
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.user_id === session?.user?.id}
              />
            ))}
          </div>
        )}
      </div>
      <ChatInput
        chatId={currentChatId}
        droppedFile={droppedFile}
        onDropHandled={() => setDroppedFile(null)}
      />

      <ChatDetail
        chat={currentChat}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  )
}
