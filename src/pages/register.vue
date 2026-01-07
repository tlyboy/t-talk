<script lang="ts" setup>
const userStore = useUserStore()
const router = useRouter()

const form = reactive({
  nickname: '',
  username: '',
  password: '',
  confirmPassword: '',
})

const rules = {
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  confirmPassword: [
    { required: true, message: '请输入确认密码', trigger: 'blur' },
  ],
}

const formRef = useTemplateRef('formRef')

const settingsStore = useSettingsStore()

const onSubmit = async () => {
  if (settingsStore.settings.url === '') {
    ElMessage.error('请先配置API地址')
    router.push('/settings')
    return
  }

  try {
    await formRef.value?.validate()

    if (form.password !== form.confirmPassword) {
      ElMessage.error('密码不一致')
      return
    }

    await userStore.register({
      nickname: form.nickname,
      username: form.username,
      password: form.password,
    })

    router.replace('/login')
  } catch (error) {
    console.error(error)
  }
}
</script>

<template>
  <div class="flex h-full items-center justify-center bg-gradient-to-br from-[#3498db]/10 to-[#3498db]/5 px-4">
    <div class="w-full max-w-sm">
      <!-- Logo -->
      <div class="mb-6 flex flex-col items-center">
        <img src="@/assets/images/logo.png" alt="T-Talk" class="mb-3 h-16 w-16" />
        <h1 class="text-xl font-bold text-[#3498db]">创建账号</h1>
      </div>

      <!-- 表单 -->
      <div class="rounded-xl bg-white p-6 shadow-lg dark:bg-[#2C2C2C]">
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          hide-required-asterisk
        >
          <el-form-item label="昵称" prop="nickname">
            <el-input
              v-model="form.nickname"
              placeholder="请输入昵称"
              size="large"
              :prefix-icon="() => h('div', { class: 'i-carbon-face-satisfied' })"
            />
          </el-form-item>
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入用户名"
              size="large"
              :prefix-icon="() => h('div', { class: 'i-carbon-user' })"
            />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              show-password
              :prefix-icon="() => h('div', { class: 'i-carbon-password' })"
            />
          </el-form-item>
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              size="large"
              show-password
              :prefix-icon="() => h('div', { class: 'i-carbon-password' })"
              @keyup.enter="onSubmit"
            />
          </el-form-item>
          <el-form-item class="mb-0">
            <el-button type="primary" size="large" class="w-full" @click="onSubmit">
              注册
            </el-button>
          </el-form-item>
        </el-form>
        <div class="mt-4 text-center text-sm text-gray-500">
          已有账号？
          <span
            class="cursor-pointer text-[#3498db] hover:underline"
            @click="router.replace('/login')"
          >
            立即登录
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
