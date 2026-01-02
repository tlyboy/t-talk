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
