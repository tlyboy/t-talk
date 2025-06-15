import request from '@/utils/request'

export const getMessageList = (params: { chatId: number }): Promise<any> => {
  return request.get('/message/list', { params })
}
