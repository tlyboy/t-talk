import request from '@/utils/request'

export const getChatList = (): Promise<any> => {
  return request.get('/chat/list')
}
