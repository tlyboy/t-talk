<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import Shiki from '@shikijs/markdown-it'
import { transformerColorizedBrackets } from '@shikijs/colorized-brackets'
import LinkAttributes from 'markdown-it-link-attributes'
import MarkdownItCopyCode, { useCopyCode } from 'markdown-it-copy-code'
import 'markdown-it-copy-code/styles/base.css'
import 'markdown-it-copy-code/styles/medium.css'

const userStore = useUserStore()
const settingsStore = useSettingsStore()
const messageStore = useMessageStore()
const results = ref<any[]>([])
const text = ref('')
const drawer = ref(false)
const resultRef = useTemplateRef('resultRef')
const textareaRef = useTemplateRef('textareaRef')
const dialogVisible = ref(false)
const formRef = useTemplateRef('formRef')
const usernameRef = useTemplateRef('usernameRef')
const form = ref({
  username: '',
})

const md = MarkdownIt()

const initMd = async () => {
  md.use(LinkAttributes, {
    matcher: (link: string) => /^https?:\/\//.test(link),
    attrs: {
      target: '_blank',
      rel: 'noopener',
    },
  })

  md.use(
    await Shiki({
      themes: {
        light: 'vitesse-light',
        dark: 'vitesse-dark',
      },
      transformers: [transformerColorizedBrackets()],
    }),
  )

  md.use(MarkdownItCopyCode, {})
}

const scrollTextareaToBottom = () => {
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.scrollTop = textareaRef.value.scrollHeight
    }
  })
}

const scrollResultToBottom = () => {
  nextTick(() => {
    resultRef.value?.scrollTo({
      top: resultRef.value?.scrollHeight,
    })
  })
}

const handleEnter = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !text.value.trim()) {
    event.preventDefault()
    return
  }

  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSend()
  }
}

const handleSend = async () => {
  messageStore.currentMessage?.messages.push({
    role: 'user',
    content: text.value,
    userId: userStore.user.id,
    username: userStore.user.username,
    nickname: userStore.user.nickname,
  })
  results.value = messageStore.currentMessage?.messages.map((item: any) => ({
    ...item,
    content: md.render(item.content),
  }))
  text.value = ''
  scrollResultToBottom()
}

const handlePolish = async () => {
  try {
    scrollTextareaToBottom()

    const res = await fetch(
      `${settingsStore.settings.baseUrl}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settingsStore.settings.apiKey}`,
        },
        body: JSON.stringify({
          model: settingsStore.settings.model,
          messages: [
            {
              role: 'system',
              content: settingsStore.settings.polishPrompt,
            },
            {
              role: 'user',
              content: text.value,
            },
          ],
          stream: true,
        }),
      },
    )

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }

    const reader = res.body?.getReader()
    if (!reader) {
      throw new Error('No reader available')
    }

    let fullContent = ''
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const json = JSON.parse(data)
            const content = json.choices[0]?.delta?.content || ''
            fullContent += content
            text.value = fullContent
            scrollTextareaToBottom()
          } catch (e) {
            console.error('Error parsing JSON:', e)
          }
        }
      }
    }

    text.value = fullContent
    scrollTextareaToBottom()
    ElMessage.success('润色完成')
  } catch (error) {
    console.error('Error:', error)
    ElMessage.error('润色失败，请重试')
  }
}

const handleSelectMessage = (index: number) => {
  messageStore.current = index
  results.value = messageStore.currentMessage?.messages.map((item: any) => ({
    ...item,
    content: md.render(item.content),
  }))
  scrollResultToBottom()
}

const handleClear = async () => {
  await ElMessageBox.confirm('确定清空聊天记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })

  messageStore.currentMessage.messages = []
  results.value = []
  text.value = ''
}

const handleExit = async () => {
  await ElMessageBox.confirm('确定退出会话吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })

  drawer.value = false
  messageStore.list.splice(messageStore.current, 1)
  messageStore.current =
    messageStore.current > messageStore.list.length - 1
      ? messageStore.list.length - 1
      : messageStore.current
  results.value = messageStore.currentMessage?.messages.map((item: any) => ({
    ...item,
    content: md.render(item.content),
  }))
  text.value = ''
}

const handleSubmit = () => {
  messageStore.list.push({
    title: form.value.username,
    messages: [],
  })
  messageStore.current = messageStore.list.length - 1
  results.value = messageStore.currentMessage?.messages.map((item: any) => ({
    ...item,
    content: md.render(item.content),
  }))
  dialogVisible.value = false
}

const resetForm = () => {
  formRef.value?.resetFields()
}

const handleAdd = async () => {
  resetForm()
  dialogVisible.value = true
}

const opened = async () => {
  usernameRef.value?.focus()
}

onMounted(async () => {
  await initMd()
  results.value = messageStore.currentMessage?.messages.map((item: any) => ({
    ...item,
    content: md.render(item.content),
  }))
  useCopyCode()
  scrollResultToBottom()
})

onActivated(() => {
  results.value = messageStore.currentMessage?.messages.map((item: any) => ({
    ...item,
    content: md.render(item.content),
  }))
  scrollResultToBottom()
})
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="flex items-center">
      <div
        class="flex w-52 items-center gap-2 border-r border-b border-[#DADADA] bg-[#F7F7F7] px-2 py-4 dark:border-[#292929] dark:bg-[#191919]"
      >
        <el-input
          size="small"
          v-model="messageStore.search"
          placeholder="搜索"
          clearable
        >
          <template #prefix>
            <div class="i-carbon-search"></div>
          </template>
        </el-input>

        <el-button size="small" @click="handleAdd">
          <template #icon>
            <div class="i-carbon-add"></div>
          </template>
        </el-button>
      </div>

      <div
        class="flex h-full flex-1 items-center justify-between border-b border-[#DADADA] px-4 dark:border-[#292929]"
      >
        <div>{{ messageStore.currentMessage?.title }}</div>
        <div
          class="i-carbon-overflow-menu-horizontal icon-btn text-xl"
          @click="drawer = true"
        ></div>
      </div>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <div
        class="w-52 overflow-y-auto border-r border-[#DADADA] dark:border-[#292929]"
      >
        <div
          v-for="(item, index) in messageStore.filteredList"
          :key="index"
          class="flex cursor-default items-center gap-2 px-2 py-4 hover:bg-[#EAEAEA] hover:dark:bg-[#252525]"
          :class="{
            'bg-[#DEDEDE] dark:bg-[#303030]': messageStore.current === index,
            'bg-[#F7F7F7] dark:bg-[#191919]': messageStore.current !== index,
          }"
          @click="handleSelectMessage(index)"
        >
          <div
            class="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-[#FFFFFF] dark:bg-[#2C2C2C]"
          >
            <span>{{ item.title?.[0]?.toUpperCase() }}</span>
          </div>
          <div class="flex-1 overflow-hidden">
            <div class="truncate">{{ item.title }}</div>
            <div class="truncate">
              {{
                item.messages.length > 0
                  ? item.messages[item.messages.length - 1].content
                  : '暂无消息'
              }}
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-1 flex-col overflow-hidden">
        <div
          ref="resultRef"
          class="flex flex-1 flex-col gap-4 overflow-y-auto p-4"
        >
          <div
            class="flex gap-4"
            v-for="(result, index) in results"
            :key="index"
            :class="{
              'flex-row-reverse': result.userId === userStore.user.id,
              'flex-row': result.userId !== userStore.user.id,
            }"
          >
            <div>
              <div
                class="flex h-[44px] w-[44px] items-center justify-center rounded-full"
                :class="{
                  'bg-[#3498db] text-white':
                    result.userId === userStore.user.id,
                  'bg-[#FFFFFF] dark:bg-[#2C2C2C]':
                    result.userId !== userStore.user.id,
                }"
              >
                <span>{{ result.nickname?.[0]?.toUpperCase() }}</span>
              </div>
            </div>
            <div
              class="prose dark:prose-invert max-w-none overflow-hidden rounded-lg bg-white px-4 py-2 dark:bg-[#2C2C2C]"
              v-html="result.content"
            ></div>
          </div>
        </div>

        <div
          class="flex flex-col gap-2 border-t border-[#DADADA] p-4 dark:border-[#292929]"
        >
          <div class="flex gap-4 text-xl">
            <button
              class="i-carbon-magic-wand icon-btn"
              :disabled="!text"
              @click="handlePolish"
              title="AI 润色"
            ></button>
          </div>

          <textarea
            ref="textareaRef"
            class="h-full w-full resize-none rounded outline-none"
            v-model="text"
            :rows="3"
            @keydown.enter="handleEnter"
          />

          <div class="flex justify-end">
            <el-button type="primary" :disabled="!text" @click="handleSend">
              <template #icon>
                <div class="i-carbon-send"></div>
              </template>
              发送
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" @opened="opened">
      <el-form
        ref="formRef"
        label-width="auto"
        label-position="top"
        :model="form"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="用户名" prop="username">
          <el-input ref="usernameRef" v-model="form.username" autofocus />
        </el-form-item>
      </el-form>
    </el-dialog>

    <el-drawer v-model="drawer" direction="rtl" :with-header="false">
      <div class="flex flex-col items-center gap-4">
        <el-form label-width="auto" label-position="top" @submit.prevent>
          <el-form-item label="会话名称">
            <el-input v-model="messageStore.currentMessage.title" />
          </el-form-item>
        </el-form>

        <div>
          <el-button type="warning" link @click="handleClear"
            >清空聊天记录</el-button
          >
        </div>

        <div>
          <el-button type="danger" link @click="handleExit">退出会话</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>
