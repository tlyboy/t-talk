export const useMessageStore = defineStore(
  'message',
  () => {
    const current = ref(0)

    const search = ref('')

    const list = ref([
      {
        title: 'User 1',
        messages: [
          {
            role: 'user',
            content: 'Hello, how are you?',
            username: 'user1',
            fullName: 'User 1',
          },
        ],
      },
      {
        title: 'User 2',
        messages: [
          {
            role: 'user',
            content: 'What is the capital of France?',
            username: 'user2',
            fullName: 'User 2',
          },
        ],
      },
    ])

    const currentMessage = computed(() => {
      return list.value[current.value]
    })

    const filteredList = computed(() => {
      return list.value.filter((item) => {
        return (
          item.title.toLowerCase().includes(search.value.toLowerCase()) ||
          item.messages[item.messages.length - 1].content
            .toLowerCase()
            .includes(search.value.toLowerCase())
        )
      })
    })

    return {
      list,
      current,
      currentMessage,
      search,
      filteredList,
    }
  },
  {
    persist: true,
  },
)
