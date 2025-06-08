import { defineStore } from 'pinia'

export const useSettingsStore = defineStore(
  'settings',
  () => {
    const settings = ref({
      url: 'http://localhost:3000/',
      wsUrl: 'ws://localhost:8080/',
      baseUrl: 'http://localhost:11434/v1',
      apiKey: 'ollama',
      model: 'qwen3:4b',
    })

    return {
      settings,
    }
  },
  {
    persist: true,
  },
)
