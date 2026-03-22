import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Send, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useChatStore } from '@/stores/chat'
import { uploadChatFile } from '@/lib/storage'
import { toast } from 'sonner'

interface ChatInputProps {
  chatId: number
  droppedFile?: File | null
  onDropHandled?: () => void
}

export function ChatInput({
  chatId,
  droppedFile,
  onDropHandled,
}: ChatInputProps) {
  const { t } = useTranslation()
  const sendMessage = useChatStore((s) => s.sendMessage)
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File) => {
    setSending(true)
    try {
      const url = await uploadChatFile(chatId, file)
      const isImage = file.type.startsWith('image/')
      const markdown = isImage
        ? `![${file.name}](${url})`
        : `[${file.name}](${url})`
      setContent((prev) => (prev ? `${prev}\n${markdown}` : markdown))
    } catch {
      toast.error(t('common.error'))
    }
    setSending(false)
  }

  useEffect(() => {
    if (droppedFile) {
      handleFileUpload(droppedFile)
      onDropHandled?.()
    }
  }, [droppedFile])

  const handleSend = async () => {
    const trimmed = content.trim()
    if (!trimmed || sending) return

    setSending(true)
    setContent('')
    const { error } = await sendMessage(chatId, trimmed)
    setSending(false)

    if (error) {
      toast.error(error)
      setContent(trimmed)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await handleFileUpload(file)
    e.target.value = ''
  }

  return (
    <div className="flex items-end gap-2 border-t p-3">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={() => fileInputRef.current?.click()}
        disabled={sending}
      >
        <Paperclip className="h-4 w-4" />
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />
      <Textarea
        placeholder={t('chat.typeMessage')}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        className="max-h-[120px] min-h-[40px] resize-none"
      />
      <Button
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={handleSend}
        disabled={!content.trim() || sending}
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  )
}
