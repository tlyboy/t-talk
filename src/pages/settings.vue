<script lang="ts" setup>
const settingsStore = useSettingsStore()
const userStore = useUserStore()
const router = useRouter()

const messageStore = useMessageStore()

const formRef = useTemplateRef('formRef')

const form = reactive({
  ...settingsStore.settings,
})

const rules = {
  url: [{ required: true, message: '请输入API地址', trigger: 'blur' }],
  wsUrl: [{ required: true, message: '请输入WebSocket地址', trigger: 'blur' }],
  baseUrl: [{ required: true, message: '请输入模型地址', trigger: 'blur' }],
  apiKey: [{ required: true, message: '请输入API Key', trigger: 'blur' }],
  model: [{ required: true, message: '请输入模型名称', trigger: 'blur' }],
  polishPrompt: [
    { required: true, message: '请输入润色提示词', trigger: 'blur' },
  ],
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
  userStore.user = {
    token: '',
    id: 0,
    nickname: '',
    username: '',
  }
  ElMessage.success('退出登录成功')
  router.push('/login')
}

const handleClear = async () => {
  await ElMessageBox.confirm('确定清空全部聊天记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })

  messageStore.list = []
}

const handleClearCache = async () => {
  await ElMessageBox.confirm('确定清除缓存吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })

  localStorage.clear()
  ElMessage.success('清除缓存成功')
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
      <el-form-item label="AI 模型地址" prop="baseUrl">
        <el-input v-model="form.baseUrl" placeholder="请输入AI模型地址" />
      </el-form-item>
      <el-form-item label="AI API Key" prop="apiKey">
        <el-input
          type="password"
          v-model="form.apiKey"
          placeholder="请输入AI API Key"
          show-password
        />
      </el-form-item>
      <el-form-item label="AI 模型名称" prop="model">
        <el-input v-model="form.model" placeholder="请输入AI模型名称" />
      </el-form-item>
      <el-form-item label="润色提示词" prop="polishPrompt">
        <el-input
          v-model="form.polishPrompt"
          placeholder="请输入润色提示词"
          type="textarea"
          :rows="4"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit">
          <template #icon>
            <div class="i-carbon-save"></div>
          </template>
          保存
        </el-button>
        <el-button @click="resetForm">
          <template #icon>
            <div class="i-carbon-reset"></div>
          </template>
          重置
        </el-button>
      </el-form-item>
      <el-form-item>
        <el-button type="danger" @click="logout">
          <template #icon>
            <div class="i-carbon-logout"></div>
          </template>
          退出登录
        </el-button>
        <el-button type="warning" plain @click="handleClear">
          <template #icon>
            <div class="i-carbon-delete"></div>
          </template>
          清空全部聊天记录
        </el-button>
        <el-button type="danger" plain @click="handleClearCache">
          <template #icon>
            <div class="i-carbon-trash-can"></div>
          </template>
          清除缓存
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>
