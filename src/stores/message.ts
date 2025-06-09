export const useMessageStore = defineStore(
  'message',
  () => {
    const list = ref<any[]>([])

    return {
      list,
    }
  },
  {
    persist: true,
  },
)
