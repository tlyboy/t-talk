export const useUserStore = defineStore(
  'user',
  () => {
    const id = ref('')
    const username = ref('')
    const password = ref('')

    return {
      id,
      username,
      password,
    }
  },
  {
    persist: true,
  },
)
