import {
  getChatList as getChatListApi,
  createChat as createChatApi,
  updateChat as updateChatApi,
  deleteChat as deleteChatApi,
  type CreateChatParams,
} from '@/api/chat'
import {
  getMessageList as getMessageListApi,
  sendMessage as sendMessageApi,
  clearMessages as clearMessagesApi,
} from '@/api/message'

export interface Message {
  id?: number
  role: string
  content: string
  userId: number
  username?: string
  nickname?: string
  createdAt?: string
}

export interface Chat {
  id: number
  title: string
  type?: 'private' | 'group'
  userId?: number
  participantId?: number
  messages: Message[]
  lastMessage?: string
  lastMessageAt?: string
  createdAt?: string
}

export const useMessageStore = defineStore(
  'message',
  () => {
    const current = ref(0)
    const search = ref('')
    const list = ref<Chat[]>([])

    const currentMessage = computed(() => {
      return list.value[current.value]
    })

    const filteredList = computed(() => {
      return list.value.filter((item) => {
        const titleMatch = item.title
          ?.toLowerCase()
          .includes(search.value.toLowerCase())
        const lastMsg = item.messages?.[item.messages.length - 1]?.content || ''
        const msgMatch = lastMsg.toLowerCase().includes(search.value.toLowerCase())
        return titleMatch || msgMatch
      })
    })

    // 获取聊天列表
    const getChatList = async () => {
      const chats = await getChatListApi()
      list.value = chats.map((chat: any) => ({
        ...chat,
        messages: [],
      }))

      // 加载第一个聊天的消息
      if (list.value.length > 0) {
        await loadMessages(list.value[0].id)
      }
    }

    // 加载指定聊天的消息
    const loadMessages = async (chatId: number) => {
      const chatIndex = list.value.findIndex((c) => c.id === chatId)
      if (chatIndex === -1) return

      const messages = await getMessageListApi({ chatId })
      list.value[chatIndex].messages = messages
    }

    // 创建新聊天
    const createChat = async (params: CreateChatParams) => {
      const newChat = await createChatApi(params)
      // 检查是否已存在（私聊可能返回现有聊天）
      const existingIndex = list.value.findIndex((c) => c.id === newChat.id)
      if (existingIndex !== -1) {
        current.value = existingIndex
      } else {
        list.value.unshift({
          ...newChat,
          messages: [],
        })
        current.value = 0
      }
      return newChat
    }

    // 获取或创建与好友的私聊
    const getOrCreatePrivateChat = async (friendId: number, friendName: string) => {
      // 查找现有私聊
      const existingChat = list.value.find(
        (c) => c.type === 'private' && c.participantId === friendId,
      )
      if (existingChat) {
        const index = list.value.indexOf(existingChat)
        current.value = index
        return existingChat
      }
      // 创建新私聊
      return createChat({
        title: friendName,
        type: 'private',
        participantId: friendId,
      })
    }

    // 更新聊天标题
    const updateChatTitle = async (chatId: number, title: string) => {
      await updateChatApi(chatId, { title })
      const chat = list.value.find((c) => c.id === chatId)
      if (chat) {
        chat.title = title
      }
    }

    // 删除聊天
    const removeChat = async (chatId: number) => {
      await deleteChatApi(chatId)
      const index = list.value.findIndex((c) => c.id === chatId)
      if (index !== -1) {
        list.value.splice(index, 1)
        current.value = Math.max(0, Math.min(current.value, list.value.length - 1))
      }
    }

    // 发送消息
    const sendMessageToChat = async (chatId: number, content: string) => {
      const message = await sendMessageApi({ chatId, content })
      addMessage(chatId, message)
      return message
    }

    // 添加消息到聊天（用于 WebSocket 接收）
    const addMessage = (chatId: number, message: Message) => {
      const chat = list.value.find((c) => c.id === chatId)
      if (chat) {
        // 检查消息是否已存在（避免重复）
        const exists = chat.messages.some((m) => m.id === message.id)
        if (!exists) {
          chat.messages.push(message)
        }
      }
    }

    // 清空聊天消息
    const clearMessages = async (chatId: number) => {
      await clearMessagesApi(chatId)
      const chat = list.value.find((c) => c.id === chatId)
      if (chat) {
        chat.messages = []
      }
    }

    return {
      list,
      current,
      currentMessage,
      search,
      filteredList,
      getChatList,
      loadMessages,
      createChat,
      getOrCreatePrivateChat,
      updateChatTitle,
      removeChat,
      sendMessageToChat,
      addMessage,
      clearMessages,
    }
  },
)
