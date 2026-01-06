<script lang="ts" setup>
const settingsStore = useSettingsStore()

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

const handleClearCache = async () => {
  await ElMessageBox.confirm('确定清除缓存吗？这将清除所有本地数据并退出登录。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })

  localStorage.clear()
  ElMessage.success('清除缓存成功')
  window.location.reload()
}
</script>

<template>
  <div class="h-full overflow-y-auto p-6">
    <div class="max-w-2xl mx-auto">
      <h2 class="text-xl font-semibold mb-6">应用设置</h2>

      <!-- 服务器设置 -->
      <div class="mb-6 p-6 rounded-lg bg-white dark:bg-[#2C2C2C]">
        <h3 class="text-base font-medium mb-4 flex items-center gap-2">
          <div class="i-carbon-server"></div>
          服务器配置
        </h3>
        <el-form ref="formRef" :model="form" label-width="auto" label-position="top" :rules="rules">
          <el-form-item label="API 地址" prop="url">
            <el-input v-model="form.url" placeholder="请输入API地址" />
          </el-form-item>
          <el-form-item label="WebSocket 地址" prop="wsUrl">
            <el-input v-model="form.wsUrl" placeholder="请输入WebSocket地址" />
          </el-form-item>
        </el-form>
      </div>

      <!-- AI 设置 -->
      <div class="mb-6 p-6 rounded-lg bg-white dark:bg-[#2C2C2C]">
        <h3 class="text-base font-medium mb-4 flex items-center gap-2">
          <div class="i-carbon-machine-learning-model"></div>
          AI 配置
        </h3>
        <el-form :model="form" label-width="auto" label-position="top" :rules="rules">
          <el-form-item label="模型地址" prop="baseUrl">
            <el-input v-model="form.baseUrl" placeholder="请输入AI模型地址" />
          </el-form-item>
          <el-form-item label="API Key" prop="apiKey">
            <el-input
              type="password"
              v-model="form.apiKey"
              placeholder="请输入AI API Key"
              show-password
            />
          </el-form-item>
          <el-form-item label="模型名称" prop="model">
            <el-input v-model="form.model" placeholder="请输入AI模型名称" />
          </el-form-item>
          <el-form-item label="视觉识别">
            <el-switch v-model="form.visionEnabled" />
            <span class="ml-2 text-sm text-gray-500">开启后 AI 总结支持识别图片内容</span>
          </el-form-item>
          <el-form-item label="润色提示词" prop="polishPrompt">
            <el-input
              v-model="form.polishPrompt"
              placeholder="请输入润色提示词"
              type="textarea"
              :rows="4"
            />
          </el-form-item>
          <el-form-item label="总结提示词" prop="summaryPrompt">
            <el-input
              v-model="form.summaryPrompt"
              placeholder="请输入总结提示词"
              type="textarea"
              :rows="4"
            />
          </el-form-item>
        </el-form>
      </div>

      <!-- 操作按钮 -->
      <div class="flex gap-4">
        <el-button type="primary" @click="onSubmit">
          <template #icon>
            <div class="i-carbon-save"></div>
          </template>
          保存设置
        </el-button>
        <el-button @click="resetForm">
          <template #icon>
            <div class="i-carbon-reset"></div>
          </template>
          重置
        </el-button>
        <el-button type="danger" plain @click="handleClearCache">
          <template #icon>
            <div class="i-carbon-trash-can"></div>
          </template>
          清除缓存
        </el-button>
      </div>
    </div>
  </div>
</template>
