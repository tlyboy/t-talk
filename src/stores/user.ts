import {
  login as loginApi,
  register as registerApi,
  updateNickname as updateNicknameApi,
  refreshToken as refreshTokenApi,
  logout as logoutApi,
} from '@/api/user'
import { updateAvatar as updateAvatarApi } from '@/api/upload'

export const useUserStore = defineStore(
  'user',
  () => {
    const user = ref({
      token: '',
      refreshToken: '',
      id: 0,
      nickname: '',
      username: '',
      avatar: '' as string | null,
    })

    // 是否正在刷新 Token
    const isRefreshing = ref(false)
    // 等待刷新完成的请求队列
    const refreshQueue = ref<((token: string) => void)[]>([])

    const register = async (data: any) => {
      const res = await registerApi(data)
      user.value = {
        ...user.value,
        ...res,
        token: res.accessToken || res.token,
        refreshToken: res.refreshToken || '',
      }
    }

    const login = async (data: any) => {
      const res = await loginApi(data)
      user.value = {
        ...user.value,
        ...res,
        token: res.accessToken || res.token,
        refreshToken: res.refreshToken || '',
      }
    }

    const logout = async (logoutAll = false) => {
      try {
        if (user.value.token) {
          await logoutApi({
            refreshToken: user.value.refreshToken,
            logoutAll,
          })
        }
      } catch {
        // 即使服务端登出失败，也清除本地状态
        console.error('Logout API failed')
      }

      user.value = {
        token: '',
        refreshToken: '',
        id: 0,
        nickname: '',
        username: '',
        avatar: null,
      }
    }

    // 清除本地状态（不调用服务端）
    const clearLocal = () => {
      user.value = {
        token: '',
        refreshToken: '',
        id: 0,
        nickname: '',
        username: '',
        avatar: null,
      }
    }

    // 刷新 Token
    const refresh = async (): Promise<string | null> => {
      if (!user.value.refreshToken) {
        return null
      }

      // 防止并发刷新
      if (isRefreshing.value) {
        return new Promise((resolve) => {
          refreshQueue.value.push(resolve)
        })
      }

      isRefreshing.value = true

      try {
        const res = await refreshTokenApi({
          refreshToken: user.value.refreshToken,
        })

        const newToken = res.accessToken || res.token
        user.value.token = newToken

        // 如果服务端返回了新的 refreshToken（Rotation 模式）
        if (res.refreshToken) {
          user.value.refreshToken = res.refreshToken
        }

        // 通知等待队列
        refreshQueue.value.forEach((resolve) => resolve(newToken))
        refreshQueue.value = []

        return newToken
      } catch {
        // Refresh Token 也失效，需要重新登录
        refreshQueue.value = []
        return null
      } finally {
        isRefreshing.value = false
      }
    }

    const updateAvatar = async (avatar: string) => {
      await updateAvatarApi(avatar)
      user.value.avatar = avatar
    }

    const updateNickname = async (nickname: string) => {
      await updateNicknameApi(nickname)
      user.value.nickname = nickname
    }

    return {
      user,
      isRefreshing,
      register,
      login,
      logout,
      clearLocal,
      refresh,
      updateAvatar,
      updateNickname,
    }
  },
  {
    persist: true,
  },
)
