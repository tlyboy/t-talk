import request from '@/utils/request'

export const getMessageList = (params: {
  chatId: number
  limit?: number
  offset?: number
}): Promise<any> => {
  return request.get('/message/list', { params })
}

export const sendMessage = (data: {
  chatId: number
  content: string
}): Promise<any> => {
  return request.post('/message', data)
}

export const deleteMessage = (id: number): Promise<any> => {
  return request.delete(`/message/${id}`)
}

export const clearMessages = (chatId: number): Promise<any> => {
  return request.post('/message/clear', { chatId })
}
