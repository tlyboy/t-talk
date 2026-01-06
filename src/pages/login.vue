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
  <div class="flex h-full items-center justify-center">
    <el-card>
      <el-form ref="formRef" :model="form" label-width="auto" :rules="rules">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            @keyup.enter="onSubmit"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSubmit">登录</el-button>
          <el-button @click="router.replace('/register')">注册</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>
