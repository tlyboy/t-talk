import { useWebSocket } from '@vueuse/core'
import { useSettingsStore } from '@/stores/settings'
import { useUserStore } from '@/stores/user'
import { useMessageStore, type Message } from '@/stores/message'
import { useFriendStore } from '@/stores/friend'

interface WSMessage {
  type: string
  payload?: any
  timestamp?: number
}

export function useChatWebSocket() {
  const settingsStore = useSettingsStore()
  const userStore = useUserStore()
  const messageStore = useMessageStore()
  const friendStore = useFriendStore()

  const isAuthenticated = ref(false)
  const connectionError = ref<string | null>(null)

  // 使用 ref 存储 URL，避免响应式触发自动连接
  const wsUrl = ref('')

  const getWsUrl = () => {
    const { server, devMode } = settingsStore.settings
    return `${devMode ? 'ws' : 'wss'}://${server}/_ws`
  }

  const { status, data, send, open, close } = useWebSocket(wsUrl, {
    autoReconnect: {
      retries: 3,
      delay: 1000,
      onFailed() {
        connectionError.value = 'WebSocket 连接失败，请检查网络'
        ElMessage.error('WebSocket 连接失败')
      },
    },
    heartbeat: {
      message: JSON.stringify({ type: 'ping' }),
      interval: 30000,
      pongTimeout: 5000,
    },
    immediate: false,
    onConnected() {
      console.log('[ws] 已连接，发送认证')
      // 连接成功后立即发送认证
      sendAuth()
    },
    onDisconnected() {
      console.log('[ws] 连接断开')
      isAuthenticated.value = false
    },
    onError(_, event) {
      console.error('[ws] 连接错误:', event)
      connectionError.value = '连接出错'
    },
  })

  // 监听收到的消息
  watch(data, (raw) => {
    if (!raw) return

    try {
      const message: WSMessage = JSON.parse(raw)
      handleMessage(message)
    } catch (e) {
      console.error('[ws] 解析消息失败:', e)
    }
  })

  // 处理收到的消息
  const handleMessage = (message: WSMessage) => {
    console.log('[ws] 收到消息:', message.type)

    switch (message.type) {
      case 'auth:success':
        isAuthenticated.value = true
        connectionError.value = null
        console.log('[ws] 认证成功, userId:', message.payload?.userId)
        // 更新在线好友状态
        if (message.payload?.onlineFriends) {
          friendStore.setOnlineFriends(message.payload.onlineFriends)
        }
        break

      case 'auth:error':
        isAuthenticated.value = false
        const errorMessage = message.payload?.message || '认证失败'

        // Token 过期，尝试刷新后重新认证
        if (
          errorMessage.includes('过期') ||
          errorMessage.includes('expired') ||
          errorMessage.includes('无效')
        ) {
          console.log('[ws] Token 可能过期，尝试刷新...')
          userStore.refresh().then((newToken) => {
            if (newToken) {
              console.log('[ws] Token 已刷新，重新认证')
              sendAuth()
            } else {
              connectionError.value = errorMessage
              ElMessage.error('登录已过期，请重新登录')
            }
          })
          return
        }

        connectionError.value = errorMessage
        ElMessage.error(connectionError.value!)
        break

      case 'pong':
        // 心跳响应，不需要处理
        break

      case 'message:new':
        // 收到新消息
        const { chatId, message: newMessage } = message.payload || {}
        if (chatId && newMessage) {
          messageStore.addMessage(chatId, newMessage as Message)
        }
        break

      case 'friend:request':
        // 收到新的好友申请
        friendStore.addRequest({
          id: message.payload.requestId,
          userId: message.payload.fromUser.id,
          username: message.payload.fromUser.username,
          nickname: message.payload.fromUser.nickname,
          status: 'pending',
          createdAt: new Date().toISOString(),
        })
        ElNotification({
          title: '新的好友申请',
          message: `${message.payload.fromUser.nickname || message.payload.fromUser.username} 请求添加你为好友`,
          type: 'info',
        })
        break

      case 'friend:accepted':
        // 好友申请被接受
        friendStore.addFriend({
          ...message.payload.friend,
          isOnline: true,
          friendshipId: 0,
          createdAt: new Date().toISOString(),
        })
        ElNotification({
          title: '好友申请已通过',
          message: `${message.payload.friend.nickname || message.payload.friend.username} 已接受你的好友申请`,
          type: 'success',
        })
        break

      case 'friend:rejected':
        ElMessage.info('对方拒绝了你的好友申请')
        break

      case 'friend:removed':
        // 被好友删除
        friendStore.removeFriendById(message.payload.friendId)
        break

      case 'friend:online':
        friendStore.updateOnlineStatus(message.payload.friendId, true)
        break

      case 'friend:offline':
        friendStore.updateOnlineStatus(message.payload.friendId, false)
        break

      case 'chat:invite':
        // 群主收到新的入群邀请
        const { chatTitle, invite } = message.payload || {}
        if (invite) {
          // 添加到待审核邀请列表
          messageStore.addPendingInvite({
            ...invite,
            chatTitle,
          })
          ElNotification({
            title: '新的入群申请',
            message: `${invite.inviterNickname || invite.inviterUsername} 邀请 ${invite.inviteeNickname || invite.inviteeUsername} 加入「${chatTitle}」`,
            type: 'info',
          })
        }
        break

      case 'chat:invite:result':
        // 邀请结果通知（邀请人和被邀请人都会收到）
        const {
          chatTitle: resultChatTitle,
          action,
          inviterId,
          inviteeId,
        } = message.payload || {}
        const isInviter = inviterId === userStore.user.id
        const isInvitee = inviteeId === userStore.user.id

        if (action === 'accept') {
          if (isInvitee) {
            // 被邀请人：刷新聊天列表
            messageStore.getChatList()
            ElNotification({
              title: '入群申请已通过',
              message: `你已加入群聊「${resultChatTitle}」`,
              type: 'success',
            })
          } else if (isInviter) {
            ElNotification({
              title: '邀请已通过',
              message: `你邀请的好友已加入「${resultChatTitle}」`,
              type: 'success',
            })
          }
        } else {
          if (isInvitee) {
            ElNotification({
              title: '入群申请被拒绝',
              message: `你的入群申请「${resultChatTitle}」被群主拒绝`,
              type: 'warning',
            })
          } else if (isInviter) {
            ElNotification({
              title: '邀请被拒绝',
              message: `你邀请的好友加入「${resultChatTitle}」被群主拒绝`,
              type: 'warning',
            })
          }
        }
        break

      case 'error':
        console.error('[ws] 服务端错误:', message.payload?.message)
        break

      default:
        console.log('[ws] 未知消息类型:', message.type)
    }
  }

  // 发送认证消息
  const sendAuth = () => {
    const token = userStore.user.token
    if (!token) {
      connectionError.value = '未登录，无法认证'
      return
    }

    send(
      JSON.stringify({
        type: 'auth',
        payload: { token },
      }),
    )
  }

  // 通过 WebSocket 发送聊天消息（备用方案）
  const sendChatMessage = (chatId: number, content: string) => {
    if (!isAuthenticated.value) {
      ElMessage.warning('WebSocket 未连接')
      return false
    }

    send(
      JSON.stringify({
        type: 'message:send',
        payload: { chatId, content },
      }),
    )
    return true
  }

  // 连接 WebSocket
  const connect = () => {
    if (status.value === 'OPEN') {
      console.log('[ws] 已连接')
      return
    }

    if (!userStore.user.token) {
      console.log('[ws] 未登录，不连接')
      return
    }

    const url = getWsUrl()
    console.log('[ws] 开始连接...', url)

    // 如果 URL 相同（重连场景），手动调用 open()
    // 如果 URL 不同，只设置 URL，让 VueUse 的 watch 自动触发连接
    if (wsUrl.value === url) {
      open()
    } else {
      wsUrl.value = url
    }
  }

  // 断开连接
  const disconnect = () => {
    isAuthenticated.value = false
    close()
  }

  return {
    status,
    isAuthenticated,
    connectionError,
    connect,
    disconnect,
    sendChatMessage,
  }
}
