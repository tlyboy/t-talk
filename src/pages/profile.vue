<script lang="ts" setup>
import { useUpload } from '@/composables/useUpload'

const userStore = useUserStore()
const router = useRouter()

const avatarInputRef = useTemplateRef<HTMLInputElement>('avatarInputRef')
const { uploading, progress, upload } = useUpload()

const nickname = ref(userStore.user.nickname)
const saving = ref(false)

const triggerAvatarSelect = () => {
  avatarInputRef.value?.click()
}

const handleAvatarSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const result = await upload(file)
    if (result) {
      await userStore.updateAvatar(result.url)
      ElMessage.success('头像更新成功')
    }
  }
  target.value = ''
}

const handleSaveNickname = async () => {
  if (!nickname.value?.trim()) {
    ElMessage.warning('昵称不能为空')
    return
  }
  saving.value = true
  try {
    await userStore.updateNickname(nickname.value)
    ElMessage.success('昵称更新成功')
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '更新失败')
  } finally {
    saving.value = false
  }
}

const logout = () => {
  userStore.logout()
  ElMessage.success('退出登录成功')
  router.push('/login')
}
</script>

<template>
  <div class="h-full overflow-y-auto p-4 md:p-6">
    <div class="mx-auto max-w-md">
      <h2 class="mb-6 text-xl font-semibold">个人资料</h2>

      <!-- 隐藏的头像文件输入 -->
      <input
        ref="avatarInputRef"
        type="file"
        class="hidden"
        accept="image/*"
        @change="handleAvatarSelect"
      />

      <!-- 头像设置 -->
      <div
        class="mb-8 flex flex-col items-center gap-4 rounded-lg bg-white p-6 dark:bg-[#2C2C2C]"
      >
        <div class="group relative cursor-pointer" @click="triggerAvatarSelect">
          <UserAvatar
            :avatar="userStore.user.avatar"
            :name="userStore.user.nickname || userStore.user.username"
            :size="100"
          />
          <div
            v-if="uploading"
            class="absolute inset-0 flex items-center justify-center rounded-full bg-black/50"
          >
            <el-progress
              type="circle"
              :percentage="progress"
              :width="80"
              :stroke-width="4"
            />
          </div>
          <div
            v-else
            class="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <div class="i-carbon-camera text-3xl text-white"></div>
          </div>
        </div>
        <span class="text-sm text-gray-500">点击更换头像</span>
      </div>

      <!-- 基本信息 -->
      <div class="space-y-4 rounded-lg bg-white p-6 dark:bg-[#2C2C2C]">
        <div>
          <label class="mb-1 block text-sm text-gray-500">用户名</label>
          <div class="text-base">{{ userStore.user.username }}</div>
        </div>

        <el-divider />

        <div>
          <label class="mb-2 block text-sm text-gray-500">昵称</label>
          <div class="flex gap-2">
            <el-input v-model="nickname" placeholder="请输入昵称" />
            <el-button
              type="primary"
              :loading="saving"
              :disabled="nickname === userStore.user.nickname"
              @click="handleSaveNickname"
            >
              保存
            </el-button>
          </div>
        </div>
      </div>

      <!-- 退出登录 -->
      <div class="mt-6 rounded-lg bg-white p-6 dark:bg-[#2C2C2C]">
        <el-button type="danger" class="w-full" @click="logout">
          <template #icon>
            <div class="i-carbon-logout"></div>
          </template>
          退出登录
        </el-button>
      </div>
    </div>
  </div>
</template>
