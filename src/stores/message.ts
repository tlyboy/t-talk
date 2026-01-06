import {
  getChatList as getChatListApi,
  createChat as createChatApi,
  updateChat as updateChatApi,
  deleteChat as deleteChatApi,
  updateChatAvatar as updateChatAvatarApi,
  getChatMembers as getChatMembersApi,
  removeChatMember as removeChatMemberApi,
  inviteToChat as inviteToChatApi,
  getChatInvites as getChatInvitesApi,
  processChatInvite as processChatInviteApi,
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

export interface ChatMember {
  userId: number
  username: string
  nickname?: string
  avatar?: string | null
  role: 'owner' | 'admin' | 'member'
  isFriend?: boolean
}

export interface ChatInvite {
  id: number
  chatId: number
  inviterId: number
  inviteeId: number
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
  inviterUsername: string
  inviterNickname?: string
  inviterAvatar?: string | null
  inviteeUsername: string
  inviteeNickname?: string
  inviteeAvatar?: string | null
}

export interface Chat {
  id: number
  title: string
  type?: 'private' | 'group'
  ownerId?: number
  participantId?: number
  myRole?: 'owner' | 'admin' | 'member'
  avatar?: string | null
  displayAvatar?: string | null
  displayName?: string
  messages: Message[]
  members?: ChatMember[]
  invites?: ChatInvite[]
  lastMessage?: string
  lastMessageAt?: string
  createdAt?: string
}

export interface PendingInvite extends ChatInvite {
  chatTitle?: string
}

export const useMessageStore = defineStore(
  'message',
  () => {
    const current = ref(0)
    const search = ref('')
    const list = ref<Chat[]>([])
    const pendingInvites = ref<PendingInvite[]>([])

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

    // 更新群聊头像
    const updateChatAvatar = async (chatId: number, avatar: string) => {
      await updateChatAvatarApi(chatId, avatar)
      const chat = list.value.find((c) => c.id === chatId)
      if (chat) {
        chat.avatar = avatar
        chat.displayAvatar = avatar
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
          // 更新最后一条消息
          chat.lastMessage = message.content
          chat.lastMessageAt = message.createdAt
        }
      }
    }

    // 清空聊天消息
    const clearMessages = async (chatId: number) => {
      await clearMessagesApi(chatId)
      const chat = list.value.find((c) => c.id === chatId)
      if (chat) {
        chat.messages = []
        chat.lastMessage = undefined
        chat.lastMessageAt = undefined
      }
    }

    // 加载群成员
    const loadMembers = async (chatId: number) => {
      const members = await getChatMembersApi(chatId)
      const chat = list.value.find((c) => c.id === chatId)
      if (chat) {
        chat.members = members
      }
      return members
    }

    // 移除群成员
    const removeMember = async (chatId: number, userId: number) => {
      await removeChatMemberApi(chatId, userId)
      const chat = list.value.find((c) => c.id === chatId)
      if (chat && chat.members) {
        chat.members = chat.members.filter((m) => m.userId !== userId)
      }
    }

    // 邀请好友入群
    const inviteToChat = async (chatId: number, inviteeIds: number[]) => {
      const result = await inviteToChatApi(chatId, inviteeIds)
      return result
    }

    // 加载待审核邀请（群主）
    const loadInvites = async (chatId: number) => {
      const invites = await getChatInvitesApi(chatId)
      const chat = list.value.find((c) => c.id === chatId)
      if (chat) {
        chat.invites = invites
      }
      return invites
    }

    // 审核邀请（群主）
    const processInvite = async (chatId: number, inviteId: number, action: 'accept' | 'reject') => {
      const result = await processChatInviteApi(chatId, inviteId, action)
      const chat = list.value.find((c) => c.id === chatId)
      if (chat && chat.invites) {
        chat.invites = chat.invites.filter((i) => i.id !== inviteId)
      }
      // 从待审核列表中移除
      pendingInvites.value = pendingInvites.value.filter((i) => i.id !== inviteId)
      // 如果同意，重新加载成员列表
      if (action === 'accept' && chat) {
        await loadMembers(chatId)
      }
      return result
    }

    // 添加待审核邀请（来自 WebSocket）
    const addPendingInvite = (invite: PendingInvite) => {
      // 避免重复
      const exists = pendingInvites.value.some((i) => i.id === invite.id)
      if (!exists) {
        pendingInvites.value.push(invite)
      }
    }

    // 移除待审核邀请
    const removePendingInvite = (inviteId: number) => {
      pendingInvites.value = pendingInvites.value.filter((i) => i.id !== inviteId)
    }

    return {
      list,
      current,
      currentMessage,
      search,
      filteredList,
      pendingInvites,
      getChatList,
      loadMessages,
      loadMembers,
      loadInvites,
      createChat,
      getOrCreatePrivateChat,
      updateChatTitle,
      updateChatAvatar,
      removeChat,
      removeMember,
      inviteToChat,
      processInvite,
      addPendingInvite,
      removePendingInvite,
      sendMessageToChat,
      addMessage,
      clearMessages,
    }
  },
)
