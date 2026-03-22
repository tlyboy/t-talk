import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Chat, Message, Profile } from '@/types/database'

export interface ChatDisplay extends Chat {
  displayName?: string
  displayAvatar?: string | null
  members?: Profile[]
  lastMessage?: { content: string; user_id: string | null } | null
}

interface ChatState {
  chats: ChatDisplay[]
  currentChatId: number | null
  messages: Message[]
  messagesLoading: boolean
  profileCache: Map<string, Profile>
  setCurrentChat: (chatId: number | null) => void
  fetchChats: () => Promise<void>
  fetchMessages: (chatId: number, offset?: number) => Promise<void>
  addMessage: (message: Message) => void
  sendMessage: (
    chatId: number,
    content: string,
  ) => Promise<{ error: string | null }>
  createPrivateChat: (
    friendId: string,
  ) => Promise<{ chatId: number | null; error: string | null }>
  createGroupChat: (
    title: string | undefined,
    memberIds: string[],
  ) => Promise<{ chatId: number | null; error: string | null }>
  hideChat: (chatId: number) => Promise<{ error: string | null }>
  deleteChatForAll: (chatId: number) => Promise<{ error: string | null }>
  clearMessages: (chatId: number) => Promise<{ error: string | null }>
  clearMyMessages: (chatId: number) => Promise<{ error: string | null }>
  removeMember: (
    chatId: number,
    userId: string,
  ) => Promise<{ error: string | null }>
  leaveChat: (chatId: number) => Promise<{ error: string | null }>
  updateChat: (
    chatId: number,
    data: { title?: string; avatar_url?: string },
  ) => Promise<{ error: string | null }>
  hideMessage: (messageId: number) => Promise<{ error: string | null }>
  deleteMessageForAll: (messageId: number) => Promise<{ error: string | null }>
  getProfile: (userId: string) => Profile | undefined
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  currentChatId: null,
  messages: [],
  messagesLoading: false,
  profileCache: new Map(),

  getProfile: (userId) => get().profileCache.get(userId),

  setCurrentChat: (chatId) => {
    set({ currentChatId: chatId, messages: [] })
    if (chatId) get().fetchMessages(chatId)
  },

  fetchChats: async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id
    if (!userId) return

    // Get all chat_members for this user (exclude hidden)
    const { data: memberRows } = await supabase
      .from('chat_members')
      .select('chat_id')
      .is('hidden_at', null)

    if (!memberRows?.length) {
      set({ chats: [] })
      return
    }

    const chatIds = memberRows.map((r) => r.chat_id!)
    const { data: chats } = await supabase
      .from('chats')
      .select('*')
      .in('id', chatIds)
      .order('updated_at', { ascending: false })

    if (!chats?.length) {
      set({ chats: [] })
      return
    }

    // Get all members for these chats
    const { data: allMembers } = await supabase
      .from('chat_members')
      .select('chat_id, user_id')
      .in('chat_id', chatIds)

    // Collect all unique user IDs
    const userIds = new Set<string>()
    allMembers?.forEach((m) => m.user_id && userIds.add(m.user_id))

    // Fetch all profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', Array.from(userIds))

    const profileMap = new Map(profiles?.map((p) => [p.id, p]))

    // Update profile cache
    set((state) => {
      const newCache = new Map(state.profileCache)
      profiles?.forEach((p) => newCache.set(p.id, p))
      return { profileCache: newCache }
    })

    // Fetch last message for all chats in one query
    const lastMessages = new Map<
      number,
      { content: string; user_id: string | null }
    >()
    const { data: lastMsgRows } = await supabase.rpc('get_last_messages', {
      chat_ids: chatIds,
    })
    lastMsgRows?.forEach((row: any) => {
      lastMessages.set(row.chat_id, {
        content: row.content,
        user_id: row.user_id,
      })
    })

    // Build display chats
    const displayChats: ChatDisplay[] = chats.map((chat) => {
      const chatMemberIds =
        allMembers
          ?.filter((m) => m.chat_id === chat.id)
          .map((m) => m.user_id!) ?? []
      const members = chatMemberIds
        .map((id) => profileMap.get(id))
        .filter(Boolean) as Profile[]

      const lastMessage = lastMessages.get(chat.id) ?? null

      // For private chats, show the other person's info
      if (chat.type === 'private') {
        const other = members.find((m) => m.id !== userId)
        return {
          ...chat,
          displayName: other?.nickname ?? other?.username,
          displayAvatar: other?.avatar_url,
          members,
          lastMessage,
        }
      }

      // For group chats, use title or member names
      return {
        ...chat,
        displayName:
          chat.title ?? members.map((m) => m.nickname ?? m.username).join(', '),
        displayAvatar: chat.avatar_url,
        members,
        lastMessage,
      }
    })

    set({ chats: displayChats })
  },

  fetchMessages: async (chatId, offset = 0) => {
    set({ messagesLoading: true })
    const userId = (await supabase.auth.getUser()).data.user?.id

    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
      .range(offset, offset + 49)

    // Filter out messages the user has soft-deleted
    let messages = data ?? []
    if (userId && messages.length) {
      const { data: deletions } = await supabase
        .from('message_deletions')
        .select('message_id')
        .eq('user_id', userId)
        .in(
          'message_id',
          messages.map((m) => m.id),
        )
      const deletedIds = new Set(deletions?.map((d) => d.message_id))
      messages = messages.filter((m) => !deletedIds.has(m.id))
    }

    set((state) => ({
      messages: offset === 0 ? messages : [...messages, ...state.messages],
      messagesLoading: false,
    }))
  },

  addMessage: (message) => {
    set((state) => {
      if (message.chat_id === state.currentChatId) {
        const exists = state.messages.some((m) => m.id === message.id)
        if (exists) return state
        return { messages: [...state.messages, message] }
      }
      return state
    })
    set((state) => ({
      chats: state.chats
        .map((c) =>
          c.id === message.chat_id
            ? { ...c, updated_at: message.created_at }
            : c,
        )
        .sort(
          (a, b) =>
            new Date(b.updated_at ?? 0).getTime() -
            new Date(a.updated_at ?? 0).getTime(),
        ),
    }))
  },

  sendMessage: async (chatId, content) => {
    const userId = (await supabase.auth.getUser()).data.user?.id
    if (!userId) return { error: 'Not authenticated' }

    const { error } = await supabase
      .from('messages')
      .insert({ chat_id: chatId, user_id: userId, content })

    return { error: error?.message ?? null }
  },

  // Hard delete all messages (group owner only)
  clearMessages: async (chatId) => {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('chat_id', chatId)
    if (error) return { error: error.message }
    set((state) => ({
      messages: state.currentChatId === chatId ? [] : state.messages,
    }))
    return { error: null }
  },

  // Soft delete — hide all messages in this chat for me only
  clearMyMessages: async (chatId) => {
    const userId = (await supabase.auth.getUser()).data.user?.id
    if (!userId) return { error: 'Not authenticated' }

    // Get all message IDs in this chat
    const { data: msgs } = await supabase
      .from('messages')
      .select('id')
      .eq('chat_id', chatId)

    if (msgs?.length) {
      const rows = msgs.map((m) => ({ message_id: m.id, user_id: userId }))
      const { error } = await supabase
        .from('message_deletions')
        .upsert(rows, { onConflict: 'message_id,user_id' })
      if (error) return { error: error.message }
    }

    set((state) => ({
      messages: state.currentChatId === chatId ? [] : state.messages,
    }))
    return { error: null }
  },

  createPrivateChat: async (friendId) => {
    const userId = (await supabase.auth.getUser()).data.user?.id
    if (!userId) return { chatId: null, error: 'Not authenticated' }

    // Check local state first
    const localExisting = get().chats.find(
      (c) => c.type === 'private' && c.members?.some((m) => m.id === friendId),
    )
    if (localExisting) return { chatId: localExisting.id, error: null }

    // Check database for existing private chat (including hidden ones)
    const { data: myMembers } = await supabase
      .from('chat_members')
      .select('chat_id')
      .eq('user_id', userId)
    const { data: friendMembers } = await supabase
      .from('chat_members')
      .select('chat_id')
      .eq('user_id', friendId)

    if (myMembers && friendMembers) {
      const myIds = new Set(myMembers.map((m) => m.chat_id))
      const commonIds = friendMembers
        .filter((m) => myIds.has(m.chat_id))
        .map((m) => m.chat_id!)

      if (commonIds.length) {
        const { data: existingChats } = await supabase
          .from('chats')
          .select('id')
          .in('id', commonIds)
          .eq('type', 'private')
          .limit(1)

        if (existingChats?.[0]) {
          // Unhide if hidden
          await supabase
            .from('chat_members')
            .update({ hidden_at: null })
            .eq('chat_id', existingChats[0].id)
            .eq('user_id', userId)
          await get().fetchChats()
          return { chatId: existingChats[0].id, error: null }
        }
      }
    }

    const { data: chat, error } = await supabase
      .from('chats')
      .insert({ type: 'private', created_by: userId })
      .select()
      .single()

    if (error || !chat)
      return { chatId: null, error: error?.message ?? 'Failed to create chat' }

    await supabase.from('chat_members').insert([
      { chat_id: chat.id, user_id: userId, role: 'owner' },
      { chat_id: chat.id, user_id: friendId, role: 'member' },
    ])

    await get().fetchChats()
    return { chatId: chat.id, error: null }
  },

  createGroupChat: async (title, memberIds) => {
    const userId = (await supabase.auth.getUser()).data.user?.id
    if (!userId) return { chatId: null, error: 'Not authenticated' }

    const { data: chat, error } = await supabase
      .from('chats')
      .insert({ type: 'group', title: title ?? null, created_by: userId })
      .select()
      .single()

    if (error || !chat)
      return {
        chatId: null,
        error: error?.message ?? 'Failed to create group',
      }

    const members = [
      { chat_id: chat.id, user_id: userId, role: 'owner' as const },
      ...memberIds.map((id) => ({
        chat_id: chat.id,
        user_id: id,
        role: 'member' as const,
      })),
    ]
    await supabase.from('chat_members').insert(members)

    await get().fetchChats()
    return { chatId: chat.id, error: null }
  },

  removeMember: async (chatId, userId) => {
    const { error } = await supabase
      .from('chat_members')
      .delete()
      .eq('chat_id', chatId)
      .eq('user_id', userId)
    if (error) return { error: error.message }
    await get().fetchChats()
    return { error: null }
  },

  updateChat: async (chatId, data) => {
    const { error } = await supabase.from('chats').update(data).eq('id', chatId)
    if (error) return { error: error.message }
    await get().fetchChats()
    return { error: null }
  },

  leaveChat: async (chatId) => {
    const userId = (await supabase.auth.getUser()).data.user?.id
    if (!userId) return { error: 'Not authenticated' }
    const { error } = await supabase
      .from('chat_members')
      .delete()
      .eq('chat_id', chatId)
      .eq('user_id', userId)
    if (error) return { error: error.message }
    set((state) => ({
      chats: state.chats.filter((c) => c.id !== chatId),
      currentChatId:
        state.currentChatId === chatId ? null : state.currentChatId,
      messages: state.currentChatId === chatId ? [] : state.messages,
    }))
    return { error: null }
  },

  // Hide chat from my list only (set hidden_at, auto-unhides on new message)
  hideChat: async (chatId) => {
    const userId = (await supabase.auth.getUser()).data.user?.id
    if (!userId) return { error: 'Not authenticated' }
    const { error } = await supabase
      .from('chat_members')
      .update({ hidden_at: new Date().toISOString() })
      .eq('chat_id', chatId)
      .eq('user_id', userId)
    if (error) return { error: error.message }
    set((state) => ({
      chats: state.chats.filter((c) => c.id !== chatId),
      currentChatId:
        state.currentChatId === chatId ? null : state.currentChatId,
      messages: state.currentChatId === chatId ? [] : state.messages,
    }))
    return { error: null }
  },

  // Delete chat for everyone
  deleteChatForAll: async (chatId) => {
    const { error } = await supabase.from('chats').delete().eq('id', chatId)
    if (error) return { error: error.message }
    set((state) => ({
      chats: state.chats.filter((c) => c.id !== chatId),
      currentChatId:
        state.currentChatId === chatId ? null : state.currentChatId,
      messages: state.currentChatId === chatId ? [] : state.messages,
    }))
    return { error: null }
  },

  // Hide message from my view only
  hideMessage: async (messageId) => {
    const userId = (await supabase.auth.getUser()).data.user?.id
    if (!userId) return { error: 'Not authenticated' }
    const { error } = await supabase
      .from('message_deletions')
      .insert({ message_id: messageId, user_id: userId })
    if (error) return { error: error.message }
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId),
    }))
    return { error: null }
  },

  // Delete message for everyone
  deleteMessageForAll: async (messageId) => {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
    if (error) return { error: error.message }
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== messageId),
    }))
    return { error: null }
  },
}))
