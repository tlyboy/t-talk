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
</script>

<template>
  <el-config-provider :locale="zhCn">
    <RouterView />
  </el-config-provider>
</template>
