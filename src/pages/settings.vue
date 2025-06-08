<script lang="ts" setup>
const settingsStore = useSettingsStore()
const userStore = useUserStore()
const router = useRouter()

const formRef = useTemplateRef('formRef')

const form = reactive({
  ...settingsStore.settings,
})

const rules = {
  url: [{ required: true, message: '请输入API地址', trigger: 'blur' }],
  wsUrl: [{ required: true, message: '请输入WebSocket地址', trigger: 'blur' }],
  aiModelUrl: [
    { required: true, message: '请输入AI 模型地址', trigger: 'blur' },
  ],
  apiKey: [{ required: true, message: '请输入API Key', trigger: 'blur' }],
  modelName: [{ required: true, message: '请输入模型名称', trigger: 'blur' }],
}

const onSubmit = async () => {
  try {
    await formRef.value?.validate()

    settingsStore.settings = form
    ElMessage.success('保存成功')
  } catch (error) {
    console.log(error)
  }
}

const resetForm = () => {
  formRef.value?.resetFields()
}

const logout = () => {
  userStore.id = ''
  userStore.username = ''
  userStore.password = ''
  ElMessage.success('退出登录成功')
  router.push('/login')
}
</script>

<template>
  <div class="p-4">
    <el-form ref="formRef" :model="form" label-width="auto" :rules="rules">
      <el-form-item label="API地址" prop="url">
        <el-input v-model="form.url" placeholder="请输入API地址" />
      </el-form-item>
      <el-form-item label="WebSocket地址" prop="wsUrl">
        <el-input v-model="form.wsUrl" placeholder="请输入WebSocket地址" />
      </el-form-item>
      <el-form-item label="AI 模型地址" prop="aiModelUrl">
        <el-input v-model="form.aiModelUrl" placeholder="请输入AI 模型地址" />
      </el-form-item>
      <el-form-item label="API Key" prop="apiKey">
        <el-input
          type="password"
          v-model="form.apiKey"
          placeholder="请输入API Key"
        />
      </el-form-item>
      <el-form-item label="模型名称" prop="modelName">
        <el-input v-model="form.modelName" placeholder="请输入模型名称" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit">保存</el-button>
        <el-button @click="resetForm">重置</el-button>
        <el-button type="danger" @click="logout">退出登录</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>
