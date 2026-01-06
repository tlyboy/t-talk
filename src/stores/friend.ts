import {
  getFriendList as getFriendListApi,
  getFriendRequests as getFriendRequestsApi,
  sendFriendRequest as sendFriendRequestApi,
  acceptFriendRequest as acceptFriendRequestApi,
  rejectFriendRequest as rejectFriendRequestApi,
  deleteFriend as deleteFriendApi,
  searchUsers as searchUsersApi,
} from '@/api/friend'

export interface Friend {
  id: number
  username: string
  nickname: string
  avatar?: string
  isOnline: boolean
  friendshipId: number
  createdAt: string
}

export interface FriendRequest {
  id: number
  userId: number
  username: string
  nickname: string
  avatar?: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
}

export const useFriendStore = defineStore('friend', () => {
  const friends = ref<Friend[]>([])
  const requests = ref<FriendRequest[]>([])

  const pendingCount = computed(() => requests.value.length)

  // 获取好友列表
  const getFriendList = async () => {
    friends.value = await getFriendListApi()
  }

  // 获取好友申请列表
  const getFriendRequests = async () => {
    requests.value = await getFriendRequestsApi()
  }

  // 发送好友申请
  const sendRequest = async (friendId: number) => {
    await sendFriendRequestApi(friendId)
    ElMessage.success('好友申请已发送')
  }

  // 接受好友申请
  const acceptRequest = async (requestId: number) => {
    await acceptFriendRequestApi(requestId)
    // 移除已处理的申请
    requests.value = requests.value.filter((r) => r.id !== requestId)
    // 刷新好友列表
    await getFriendList()
    ElMessage.success('好友添加成功')
  }

  // 拒绝好友申请
  const rejectRequest = async (requestId: number) => {
    await rejectFriendRequestApi(requestId)
    requests.value = requests.value.filter((r) => r.id !== requestId)
    ElMessage.success('已拒绝好友申请')
  }

  // 删除好友
  const removeFriend = async (friendId: number) => {
    await deleteFriendApi(friendId)
    friends.value = friends.value.filter((f) => f.id !== friendId)
    ElMessage.success('好友已删除')
  }

  // 搜索用户
  const searchUsers = async (keyword: string) => {
    return await searchUsersApi(keyword)
  }

  // 更新好友在线状态
  const updateOnlineStatus = (friendId: number, isOnline: boolean) => {
    const friend = friends.value.find((f) => f.id === friendId)
    if (friend) {
      friend.isOnline = isOnline
    }
  }

  // 批量设置在线好友（WebSocket 认证成功时调用）
  const setOnlineFriends = (onlineFriendIds: number[]) => {
    friends.value.forEach((friend) => {
      friend.isOnline = onlineFriendIds.includes(friend.id)
    })
  }

  // 添加新好友（WebSocket 收到 accepted 通知时调用）
  const addFriend = (friend: Friend) => {
    if (!friends.value.find((f) => f.id === friend.id)) {
      friends.value.push(friend)
    }
  }

  // 移除好友（被对方删除时调用）
  const removeFriendById = (friendId: number) => {
    friends.value = friends.value.filter((f) => f.id !== friendId)
  }

  // 添加新的好友申请（WebSocket 通知）
  const addRequest = (request: FriendRequest) => {
    if (!requests.value.find((r) => r.id === request.id)) {
      requests.value.unshift(request)
    }
  }

  return {
    friends,
    requests,
    pendingCount,
    getFriendList,
    getFriendRequests,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
    searchUsers,
    updateOnlineStatus,
    setOnlineFriends,
    addFriend,
    removeFriendById,
    addRequest,
  }
})
