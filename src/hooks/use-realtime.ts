import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { useFriendStore } from '@/stores/friend'
import type { Message } from '@/types/database'

export function useRealtime() {
  const session = useAuthStore((s) => s.session)
  const addMessage = useChatStore((s) => s.addMessage)
  const fetchChats = useChatStore((s) => s.fetchChats)
  const fetchRequests = useFriendStore((s) => s.fetchRequests)
  const fetchFriends = useFriendStore((s) => s.fetchFriends)
  const setOnlineUsers = useFriendStore((s) => s.setOnlineUsers)

  useEffect(() => {
    if (!session?.user) return

    const userId = session.user.id

    // Messages channel — INSERT + DELETE
    const messagesChannel = supabase
      .channel('messages-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 't_talk', table: 'messages' },
        (payload) => {
          addMessage(payload.new as Message)
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 't_talk', table: 'messages' },
        (payload) => {
          const deleted = payload.old as { id: number }
          useChatStore.setState((state) => ({
            messages: state.messages.filter((m) => m.id !== deleted.id),
          }))
        },
      )
      .subscribe()

    // Friends channel — all events for both directions
    const friendsChannel = supabase
      .channel('friends-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 't_talk',
          table: 'friends',
          filter: `friend_id=eq.${userId}`,
        },
        () => {
          fetchRequests()
          fetchFriends()
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 't_talk',
          table: 'friends',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchFriends()
        },
      )
      .subscribe()

    // Chat members channel — INSERT + DELETE
    const chatMembersChannel = supabase
      .channel('chat-members-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 't_talk',
          table: 'chat_members',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchChats()
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 't_talk',
          table: 'chat_members',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Removed from a chat — remove it from local state directly
          const deleted = payload.old as { chat_id: number }
          useChatStore.setState((state) => ({
            chats: state.chats.filter((c) => c.id !== deleted.chat_id),
            currentChatId:
              state.currentChatId === deleted.chat_id
                ? null
                : state.currentChatId,
            messages:
              state.currentChatId === deleted.chat_id ? [] : state.messages,
          }))
        },
      )
      .subscribe()

    // Chats channel — DELETE + UPDATE (group name/avatar changes)
    const chatsChannel = supabase
      .channel('chats-realtime')
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 't_talk', table: 'chats' },
        (payload) => {
          const deleted = payload.old as { id: number }
          useChatStore.setState((state) => ({
            chats: state.chats.filter((c) => c.id !== deleted.id),
            currentChatId:
              state.currentChatId === deleted.id ? null : state.currentChatId,
            messages: state.currentChatId === deleted.id ? [] : state.messages,
          }))
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 't_talk', table: 'chats' },
        () => {
          fetchChats()
        },
      )
      .subscribe()

    // Presence channel
    const presenceChannel = supabase.channel('online-users')
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        const onlineIds = new Set<string>()
        for (const key in state) {
          for (const presence of state[key]) {
            onlineIds.add((presence as { user_id: string }).user_id)
          }
        }
        setOnlineUsers(onlineIds)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user_id: userId })
        }
      })

    return () => {
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(friendsChannel)
      supabase.removeChannel(chatMembersChannel)
      supabase.removeChannel(chatsChannel)
      supabase.removeChannel(presenceChannel)
    }
  }, [session?.user?.id])
}
