<script lang="ts" setup>
const userStore = useUserStore()
const messageStore = useMessageStore()
const router = useRouter()
const settingsStore = useSettingsStore()

const form = reactive({
  username: '',
  password: '',
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const formRef = useTemplateRef('formRef')

const onSubmit = async () => {
  if (!settingsStore.settings.server.trim()) {
    ElMessage.error('请输入服务器地址')
    return
  }

  try {
    await formRef.value?.validate()
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
    <div class="w-full max-w-xs">
      <div class="rounded-xl bg-white p-5 shadow-lg dark:bg-[#2C2C2C]">
        <h2 class="mb-3 text-center text-lg font-semibold text-[#3498db]">登录 T-Talk</h2>
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="60px"
          hide-required-asterisk
        >
          <el-form-item label="服务器" class="mb-2">
            <el-input v-model="settingsStore.settings.server" placeholder="example.com" />
          </el-form-item>
          <el-form-item label="用户名" prop="username" class="mb-2">
            <el-input v-model="form.username" placeholder="请输入用户名" />
          </el-form-item>
          <el-form-item label="密码" prop="password" class="mb-2">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              show-password
              @keyup.enter="onSubmit"
            />
          </el-form-item>
          <el-form-item label=" " class="mb-0">
            <el-button type="primary" class="w-full" @click="onSubmit">登录</el-button>
          </el-form-item>
        </el-form>

        <div class="mt-3 text-center text-sm text-gray-500">
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
