<script setup lang="ts">
const settingsStore = useSettingsStore()

const props = withDefaults(
  defineProps<{
    avatar?: string | null
    name?: string
    size?: number
    bgColor?: string
    textColor?: string
  }>(),
  {
    size: 44,
    bgColor: '#3498db',
    textColor: 'white',
  },
)

// 获取完整的头像 URL
const avatarUrl = computed(() => {
  if (!props.avatar) return null
  // 如果已经是完整 URL 则直接返回
  if (
    props.avatar.startsWith('http://') ||
    props.avatar.startsWith('https://')
  ) {
    return props.avatar
  }
  // 否则拼接服务器地址
  const baseUrl = settingsStore.settings.url.replace('/v1', '')
  return `${baseUrl}${props.avatar}`
})

// 获取首字母
const initial = computed(() => {
  if (!props.name) return '?'
  return props.name[0]?.toUpperCase() || '?'
})

const sizeStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  fontSize: `${props.size * 0.4}px`,
}))
</script>

<template>
  <div
    class="flex shrink-0 items-center justify-center overflow-hidden rounded-full"
    :style="[
      sizeStyle,
      !avatarUrl ? { backgroundColor: bgColor, color: textColor } : {},
    ]"
  >
    <img
      v-if="avatarUrl"
      :src="avatarUrl"
      :alt="name"
      class="h-full w-full object-cover"
    />
    <span v-else>{{ initial }}</span>
  </div>
</template>
