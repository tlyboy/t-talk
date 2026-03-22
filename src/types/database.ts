export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  t_talk: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          nickname: string | null
          avatar_url: string | null
          created_at: string | null
        }
        Insert: {
          id: string
          username: string
          nickname?: string | null
          avatar_url?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          username?: string
          nickname?: string | null
          avatar_url?: string | null
          created_at?: string | null
        }
      }
      friends: {
        Row: {
          id: number
          user_id: string | null
          friend_id: string | null
          status: 'pending' | 'accepted' | 'rejected' | 'blocked' | null
          created_at: string | null
        }
        Insert: {
          user_id?: string | null
          friend_id?: string | null
          status?: 'pending' | 'accepted' | 'rejected' | 'blocked' | null
          created_at?: string | null
        }
        Update: {
          user_id?: string | null
          friend_id?: string | null
          status?: 'pending' | 'accepted' | 'rejected' | 'blocked' | null
          created_at?: string | null
        }
      }
      chats: {
        Row: {
          id: number
          type: 'private' | 'group' | null
          title: string | null
          avatar_url: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          type?: 'private' | 'group' | null
          title?: string | null
          avatar_url?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          type?: 'private' | 'group' | null
          title?: string | null
          avatar_url?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      chat_members: {
        Row: {
          id: number
          chat_id: number | null
          user_id: string | null
          role: 'owner' | 'admin' | 'member' | null
          joined_at: string | null
          hidden_at: string | null
        }
        Insert: {
          chat_id?: number | null
          user_id?: string | null
          role?: 'owner' | 'admin' | 'member' | null
          joined_at?: string | null
          hidden_at?: string | null
        }
        Update: {
          chat_id?: number | null
          user_id?: string | null
          hidden_at?: string | null
          role?: 'owner' | 'admin' | 'member' | null
          joined_at?: string | null
        }
      }
      chat_invites: {
        Row: {
          id: number
          chat_id: number | null
          inviter_id: string | null
          invitee_id: string | null
          status: 'pending' | 'accepted' | 'rejected' | null
          created_at: string | null
        }
        Insert: {
          chat_id?: number | null
          inviter_id?: string | null
          invitee_id?: string | null
          status?: 'pending' | 'accepted' | 'rejected' | null
          created_at?: string | null
        }
        Update: {
          chat_id?: number | null
          inviter_id?: string | null
          invitee_id?: string | null
          status?: 'pending' | 'accepted' | 'rejected' | null
          created_at?: string | null
        }
      }
      messages: {
        Row: {
          id: number
          chat_id: number | null
          user_id: string | null
          content: string
          created_at: string | null
        }
        Insert: {
          chat_id?: number | null
          user_id?: string | null
          content: string
          created_at?: string | null
        }
        Update: {
          chat_id?: number | null
          user_id?: string | null
          content?: string
          created_at?: string | null
        }
      }
      message_deletions: {
        Row: {
          id: number
          message_id: number | null
          user_id: string | null
          created_at: string | null
        }
        Insert: {
          message_id?: number | null
          user_id?: string | null
        }
        Update: {
          message_id?: number | null
          user_id?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_last_messages: {
        Args: { chat_ids: number[] }
        Returns: { chat_id: number; content: string; user_id: string }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Profile = Database['t_talk']['Tables']['profiles']['Row']
export type Friend = Database['t_talk']['Tables']['friends']['Row']
export type Chat = Database['t_talk']['Tables']['chats']['Row']
export type ChatMember = Database['t_talk']['Tables']['chat_members']['Row']
export type ChatInvite = Database['t_talk']['Tables']['chat_invites']['Row']
export type Message = Database['t_talk']['Tables']['messages']['Row']
