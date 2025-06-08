import readme from '@/assets/README.md?raw'

export const useMessageStore = defineStore(
  'message',
  () => {
    const list = ref<any[]>([
      {
        role: 'assistant',
        content: readme,
      },
    ])

    return {
      list,
    }
  },
  {
    persist: true,
  },
)
