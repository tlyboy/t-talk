import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Friend, Profile } from '@/types/database'

interface FriendWithProfile extends Friend {
  profile?: Profile
}

interface FriendState {
  friends: FriendWithProfile[]
  requests: FriendWithProfile[]
  onlineUsers: Set<string>
  setOnlineUsers: (users: Set<string>) => void
  fetchFriends: () => Promise<void>
  fetchRequests: () => Promise<void>
  sendRequest: (userId: string) => Promise<{ error: string | null }>
  acceptRequest: (id: number) => Promise<{ error: string | null }>
  rejectRequest: (id: number) => Promise<{ error: string | null }>
  removeFriend: (id: number) => Promise<{ error: string | null }>
  searchUsers: (query: string) => Promise<Profile[]>
}

export const useFriendStore = create<FriendState>((set) => ({
  friends: [],
  requests: [],
  onlineUsers: new Set(),

  setOnlineUsers: (users) => set({ onlineUsers: users }),

  fetchFriends: async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id
    if (!userId) return

    const { data } = await supabase
      .from('friends')
      .select('*')
      .eq('status', 'accepted')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)

    if (!data?.length) {
      set({ friends: [] })
      return
    }

    // Fetch profiles for friends
    const friendUserIds = data.map((f) =>
      f.user_id === userId ? f.friend_id! : f.user_id!,
    )
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', friendUserIds)

    const profileMap = new Map(profiles?.map((p) => [p.id, p]))
    const friends = data.map((f) => ({
      ...f,
      profile: profileMap.get(f.user_id === userId ? f.friend_id! : f.user_id!),
    }))

    set({ friends })
  },

  fetchRequests: async () => {
    const userId = (await supabase.auth.getUser()).data.user?.id
    if (!userId) return

    const { data } = await supabase
      .from('friends')
      .select('*')
      .eq('friend_id', userId)
      .eq('status', 'pending')

    if (!data?.length) {
      set({ requests: [] })
      return
    }

    const userIds = data.map((r) => r.user_id!)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds)

    const profileMap = new Map(profiles?.map((p) => [p.id, p]))
    const requests = data.map((r) => ({
      ...r,
      profile: profileMap.get(r.user_id!),
    }))

    set({ requests })
  },

  sendRequest: async (friendId) => {
    const userId = (await supabase.auth.getUser()).data.user?.id
    if (!userId) return { error: 'Not authenticated' }

    const { error } = await supabase
      .from('friends')
      .insert({ user_id: userId, friend_id: friendId })

    return { error: error?.message ?? null }
  },

  acceptRequest: async (id) => {
    const { error } = await supabase
      .from('friends')
      .update({ status: 'accepted' })
      .eq('id', id)

    return { error: error?.message ?? null }
  },

  rejectRequest: async (id) => {
    const { error } = await supabase
      .from('friends')
      .update({ status: 'rejected' })
      .eq('id', id)

    return { error: error?.message ?? null }
  },

  removeFriend: async (id) => {
    const { error } = await supabase.from('friends').delete().eq('id', id)
    return { error: error?.message ?? null }
  },

  searchUsers: async (query) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${query}%`)
      .limit(20)

    return data ?? []
  },
}))
