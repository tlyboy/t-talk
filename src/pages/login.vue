<script lang="ts" setup>
const userStore = useUserStore()
const messageStore = useMessageStore()
const router = useRouter()

const form = reactive({
  username: '',
  password: '',
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
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

    // 登录前清除旧数据，确保干净的登录状态
    userStore.logout()

    await userStore.login(form)
    await messageStore.getChatList()

    router.replace('/')
  } catch (error) {
    console.log(error)
  }
}
</script>

<template>
  <div class="flex h-full items-center justify-center bg-gradient-to-br from-[#3498db]/10 to-[#3498db]/5 px-4">
    <div class="w-full max-w-sm">
      <!-- Logo -->
      <div class="mb-8 flex flex-col items-center">
        <img src="@/assets/images/logo.png" alt="T-Talk" class="mb-4 h-20 w-20" />
        <h1 class="text-2xl font-bold text-[#3498db]">T-Talk</h1>
        <p class="text-sm text-gray-500">即时通讯应用</p>
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
              @keyup.enter="onSubmit"
            />
          </el-form-item>
          <el-form-item class="mb-0">
            <el-button type="primary" size="large" class="w-full" @click="onSubmit">
              登录
            </el-button>
          </el-form-item>
        </el-form>
        <div class="mt-4 text-center text-sm text-gray-500">
          还没有账号？
          <span
            class="cursor-pointer text-[#3498db] hover:underline"
            @click="router.replace('/register')"
          >
            立即注册
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
