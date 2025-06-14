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
      const res = await registerApi(data)
      user.value = res
    }

    const login = async (data: any) => {
      const res = await loginApi(data)
      user.value = res
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
