<script lang="ts" setup>
const userStore = useUserStore()
const router = useRouter()
const settingsStore = useSettingsStore()

// 从设置中提取域名
const extractDomain = (url: string) => {
  try {
    return url.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  } catch {
    return ''
  }
}

const serverDomain = ref(extractDomain(settingsStore.settings.url))

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

// 同步服务器地址到设置
const syncServerSettings = () => {
  if (serverDomain.value) {
    const domain = serverDomain.value.replace(/^https?:\/\//, '').replace(/\/+$/, '')
    settingsStore.settings.url = `https://${domain}`
    settingsStore.settings.wsUrl = `wss://${domain}`
  }
}

const onSubmit = async () => {
  if (!serverDomain.value.trim()) {
    ElMessage.error('请输入服务器地址')
    return
  }

  syncServerSettings()

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
    <div class="w-full max-w-xs">
      <div class="rounded-xl bg-white p-5 shadow-lg dark:bg-[#2C2C2C]">
        <h2 class="mb-3 text-center text-lg font-semibold text-[#3498db]">创建账号</h2>
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="70px"
          hide-required-asterisk
        >
          <el-form-item label="服务器" class="mb-2">
            <el-input v-model="serverDomain" placeholder="example.com" />
          </el-form-item>
          <el-form-item label="昵称" prop="nickname" class="mb-2">
            <el-input v-model="form.nickname" placeholder="请输入昵称" />
          </el-form-item>
          <el-form-item label="用户名" prop="username" class="mb-2">
            <el-input v-model="form.username" placeholder="请输入用户名" />
          </el-form-item>
          <el-form-item label="密码" prop="password" class="mb-2">
            <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
          </el-form-item>
          <el-form-item label="确认密码" prop="confirmPassword" class="mb-2">
            <el-input
              v-model="form.confirmPassword"
              type="password"
              placeholder="请再次输入密码"
              show-password
              @keyup.enter="onSubmit"
            />
          </el-form-item>
          <el-form-item label=" " class="mb-0">
            <el-button type="primary" class="w-full" @click="onSubmit">注册</el-button>
          </el-form-item>
        </el-form>

        <div class="mt-3 text-center text-sm text-gray-500">
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
