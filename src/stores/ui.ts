export const useUiStore = defineStore('ui', () => {
  // 移动端是否在聊天视图（用于控制底部导航栏显示）
  const isMobileChatView = ref(false)

  return {
    isMobileChatView,
  }
})
