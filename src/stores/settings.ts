import { defineStore } from 'pinia'

export const useSettingsStore = defineStore(
  'settings',
  () => {
    const settings = ref({
      url: '',
      wsUrl: '',
      aiModelUrl: '',
      apiKey: '',
      modelName: '',
    })

    return {
      settings,
    }
  },
  {
    persist: true,
  },
)
