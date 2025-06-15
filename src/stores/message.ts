import { getChatList as getChatListApi } from '@/api/chat'
import { getMessageList as getMessageListApi } from '@/api/message'

export const useMessageStore = defineStore(
  'message',
  () => {
    const current = ref(0)

    const search = ref('')

    const list = ref([
      {
        id: 1,
        title: 'User 1',
        messages: [
          {
            role: 'user',
            content: 'Hello, how are you?',
            userId: 999,
            username: 'user1',
            nickname: 'User 1',
          },
        ],
      },
      {
        id: 2,
        title: 'User 2',
        messages: [
          {
            role: 'user',
            content: 'What is the capital of France?',
            userId: 888,
            username: 'user2',
            nickname: 'User 2',
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

    const getChatList = async () => {
      list.value = await getChatListApi()

      if (list.value.length > 0) {
        const res = await getMessageListApi({
          chatId: list.value[0].id,
        })

        list.value[0].messages = res
      }
    }

    return {
      list,
      current,
      currentMessage,
      search,
      filteredList,
      getChatList,
    }
  },
  {
    persist: true,
  },
)
