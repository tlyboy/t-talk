import { login as loginApi, register as registerApi } from '@/api/user'

export const useUserStore = defineStore(
  'user',
  () => {
    const user = ref({
      token: '',
      id: 0,
      nickname: '',
      username: '',
    })

    const register = async (data: any) => {
      user.value = await registerApi(data)
    }

    const login = async (data: any) => {
      user.value = await loginApi(data)
    }

    return {
      user,
      register,
      login,
    }
  },
  {
    persist: true,
  },
)
