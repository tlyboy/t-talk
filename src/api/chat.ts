import request from '@/utils/request'

export const getChatList = (): Promise<any> => {
  return request.get('/chat/list')
}

export interface CreateChatParams {
  title: string
  type?: 'private' | 'group'
  participantId?: number
  memberIds?: number[]
}

export const createChat = (data: CreateChatParams): Promise<any> => {
  return request.post('/chat', data)
}

export const getChatMembers = (chatId: number): Promise<any> => {
  return request.get(`/chat/${chatId}/members`)
}

export const addChatMembers = (chatId: number, memberIds: number[]): Promise<any> => {
  return request.post(`/chat/${chatId}/members`, { memberIds })
}

export const removeChatMember = (chatId: number, userId: number): Promise<any> => {
  return request.delete(`/chat/${chatId}/members/${userId}`)
}

export const updateChat = (id: number, data: { title: string }): Promise<any> => {
  return request.put(`/chat/${id}`, data)
}

export const deleteChat = (id: number): Promise<any> => {
  return request.delete(`/chat/${id}`)
}

export const updateChatAvatar = (chatId: number, avatar: string): Promise<any> => {
  return request.put('/chat/avatar', { chatId, avatar })
}

// 邀请好友入群
export const inviteToChat = (chatId: number, inviteeIds: number[]): Promise<any> => {
  return request.post(`/chat/${chatId}/invite`, { inviteeIds })
}

// 获取待审核邀请列表（群主）
export const getChatInvites = (chatId: number): Promise<any> => {
  return request.get(`/chat/${chatId}/invites`)
}

// 审核邀请（群主）
export const processChatInvite = (
  chatId: number,
  inviteId: number,
  action: 'accept' | 'reject',
): Promise<any> => {
  return request.put(`/chat/${chatId}/invite/${inviteId}`, { action })
}
