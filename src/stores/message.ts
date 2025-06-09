export const useMessageStore = defineStore(
  'message',
  () => {
    const current = ref(0)

    const list = ref<any[]>([
      {
        username: 'User1',
        messages: [
          {
            role: 'user',
            content: 'Hello, how are you?',
          },
        ],
      },
      {
        username: 'User2',
        messages: [
          {
            role: 'user',
            content: 'Hello, how are you?',
          },
        ],
      },
    ])

    const currentMessage = computed(() => {
      return list.value[current.value]
    })

    return {
      list,
      current,
      currentMessage,
    }
  },
  {
    persist: true,
  },
)
