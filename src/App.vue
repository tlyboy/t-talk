<script setup lang="ts">
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { dayjs } from 'element-plus'
import 'dayjs/locale/zh-cn'
import { useChatWebSocket } from '@/composables/useWebSocket'

dayjs.locale('zh-cn')

const userStore = useUserStore()
const { connect, disconnect } = useChatWebSocket()

// 监听用户登录状态，自动连接/断开 WebSocket
watch(
  () => userStore.user.token,
  (token) => {
    if (token) {
      connect()
    } else {
      disconnect()
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  disconnect()
})

// 禁用 Apple 设备输入框自动大写、自动纠正、拼写检查
onMounted(() => {
  const disableAutoFeatures = (el: Element) => {
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.setAttribute('autocapitalize', 'off')
      el.setAttribute('autocorrect', 'off')
      el.setAttribute('autocomplete', 'off')
      el.setAttribute('spellcheck', 'false')
    }
  }

  // 处理已有元素
  document.querySelectorAll('input, textarea').forEach(disableAutoFeatures)

  // 监听新增元素
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) {
          disableAutoFeatures(node)
          node.querySelectorAll('input, textarea').forEach(disableAutoFeatures)
        }
      })
    })
  })

  observer.observe(document.body, { childList: true, subtree: true })

  onUnmounted(() => observer.disconnect())
})
</script>

<template>
  <el-config-provider :locale="zhCn">
    <RouterView />
  </el-config-provider>
</template>
