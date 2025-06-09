<script lang="ts" setup>
const userStore = useUserStore()
const router = useRouter()

const form = reactive({
  username: userStore.username,
  password: userStore.password,
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

    userStore.id = '1'
    userStore.username = form.username
    userStore.password = form.password
    router.push('/')
  } catch (error) {
    console.log(error)
  }
}

const resetForm = () => {
  formRef.value?.resetFields()
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
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>
