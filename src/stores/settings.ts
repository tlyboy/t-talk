import { defineStore } from 'pinia'

export const useSettingsStore = defineStore(
  'settings',
  () => {
    const settings = ref({
      server: import.meta.env.VITE_SERVER || 'localhost:3000',
      devMode: import.meta.env.DEV,
      baseUrl: 'http://localhost:11434/v1',
      apiKey: 'ollama',
      model: 'qwen3-vl',
      visionEnabled: true,
      polishPrompt:
        '你是一个专业的润色助手，请根据用户的需求，对文本进行润色和改进，使其更加专业、流畅和优雅，同时保持原有的核心意思。',
      summaryPrompt:
        '你是一个专业的总结助手，请根据以下聊天记录生成简洁的总结，包括主要讨论内容、关键结论和待办事项（如有）。',
    })

    return {
      settings,
    }
  },
  {
    persist: true,
  },
)
