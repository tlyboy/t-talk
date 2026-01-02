import request from '@/utils/request'

// 搜索用户
export const searchUsers = (keyword: string): Promise<any> => {
  return request.get('/friend/search', { params: { keyword } })
}

// 发送好友申请
export const sendFriendRequest = (friendId: number): Promise<any> => {
  return request.post('/friend/request', { friendId })
}

// 获取收到的好友申请
export const getFriendRequests = (): Promise<any> => {
  return request.get('/friend/requests')
}

// 接受好友申请
export const acceptFriendRequest = (requestId: number): Promise<any> => {
  return request.post('/friend/accept', { requestId })
}

// 拒绝好友申请
export const rejectFriendRequest = (requestId: number): Promise<any> => {
  return request.post('/friend/reject', { requestId })
}

// 获取好友列表
export const getFriendList = (): Promise<any> => {
  return request.get('/friend/list')
}

// 删除好友
export const deleteFriend = (friendId: number): Promise<any> => {
  return request.delete(`/friend/${friendId}`)
}
