import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useChatStore } from '@/stores/chat'
import { ChatSidebar } from './chat-sidebar'
import { ChatView } from './chat-view'

export function ChatLayout() {
  const { t } = useTranslation()
  const currentChatId = useChatStore((s) => s.currentChatId)
  const fetchChats = useChatStore((s) => s.fetchChats)

  useEffect(() => {
    fetchChats()
  }, [])

  return (
    <div className="flex h-full">
      <ChatSidebar />
      <div className="flex flex-1 flex-col">
        {currentChatId ? (
          <ChatView />
        ) : (
          <div className="text-muted-foreground flex flex-1 items-center justify-center">
            <p>{t('chat.noChats')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
