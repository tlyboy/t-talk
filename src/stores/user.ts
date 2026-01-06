import {
  login as loginApi,
  register as registerApi,
  updateNickname as updateNicknameApi,
} from '@/api/user'
import { updateAvatar as updateAvatarApi } from '@/api/upload'

export const useUserStore = defineStore(
  'user',
  () => {
    const user = ref({
      token: '',
      id: 0,
      nickname: '',
      username: '',
      avatar: '' as string | null,
    })

    const register = async (data: any) => {
      user.value = await registerApi(data)
    }

    const login = async (data: any) => {
      user.value = await loginApi(data)
    }

    const logout = () => {
      user.value = {
        token: '',
        id: 0,
        nickname: '',
        username: '',
        avatar: null,
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
      register,
      login,
      logout,
      updateAvatar,
      updateNickname,
    }
  },
  {
    persist: true,
  },
)
