<script lang="ts" setup>
const userStore = useUserStore()
const router = useRouter()

const form = reactive({
  username: '',
  fullName: '',
  password: '',
  confirmPassword: '',
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  fullName: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
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
      username: form.username,
      fullName: form.fullName,
      password: form.password,
    })

    router.replace('/')
  } catch (error) {
    console.error(error)
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
        <el-form-item label="昵称" prop="fullName">
          <el-input v-model="form.fullName" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            @keyup.enter="onSubmit"
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请输入确认密码"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSubmit">注册</el-button>
          <el-button @click="router.replace('/login')">登录</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>
