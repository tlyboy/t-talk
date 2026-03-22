import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/database'

interface AuthState {
  session: Session | null
  profile: Profile | null
  loading: boolean
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  fetchProfile: () => Promise<void>
  signUp: (
    email: string,
    password: string,
    username: string,
    nickname?: string,
  ) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signInWithGithub: () => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  initialize: () => () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  loading: true,

  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),

  fetchProfile: async () => {
    const { session } = get()
    if (!session?.user) {
      set({ profile: null })
      return
    }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    set({ profile: data })
  },

  signUp: async (email, password, username, nickname) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, nickname },
      },
    })
    return { error: error?.message ?? null }
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error: error?.message ?? null }
  },

  signInWithGithub: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
    })
    return { error: error?.message ?? null }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, profile: null })
    // Clear all stores and caches
    const { useChatStore } = await import('./chat')
    const { useFriendStore } = await import('./friend')
    const { clearStorageCache } = await import('@/lib/storage')
    useChatStore.setState({
      chats: [],
      currentChatId: null,
      messages: [],
      messagesLoading: false,
      profileCache: new Map(),
    })
    useFriendStore.setState({
      friends: [],
      requests: [],
      onlineUsers: new Set(),
    })
    clearStorageCache()
  },

  initialize: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, loading: false })
      if (session) get().fetchProfile()
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, loading: false })
      if (session) {
        get().fetchProfile()
      } else {
        set({ profile: null })
      }
    })

    return () => subscription.unsubscribe()
  },
}))
