<script setup lang="ts">
import Shiki from '@shikijs/markdown-it'
import MarkdownIt from 'markdown-it'
import MarkdownItCopyCode, { useCopyCode } from 'markdown-it-copy-code'
import 'markdown-it-copy-code/styles/base.css'
import 'markdown-it-copy-code/styles/medium.css'
import logo from '@/assets/images/logo.png'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const settingsStore = useSettingsStore()
const messageStore = useMessageStore()
const results = ref<Message[]>([])
const text = ref('')

const resultRef = useTemplateRef('resultRef')
const textareaRef = useTemplateRef('textareaRef')

const md = MarkdownIt({
  html: true,
  linkify: true,
})

const originalRender =
  md.renderer.rules.html_block ||
  function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options)
  }

md.renderer.rules.html_block = function (tokens, idx, options, env, self) {
  const content = tokens[idx].content

  if (content.match(/^<\/?(?:details|summary)[\s>]/)) {
    return originalRender(tokens, idx, options, env, self)
  }

  return content.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

md.renderer.rules.html_inline = md.renderer.rules.html_block

const defaultRender =
  md.renderer.rules.link_open ||
  function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options)
  }

md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  const token = tokens[idx]

  if (!token.attrs) {
    token.attrs = []
  }

  const aIndex = token.attrIndex('target')
  if (aIndex < 0) {
    token.attrPush(['target', '_blank'])
  } else {
    token.attrs[aIndex][1] = '_blank'
  }

  const relIndex = token.attrIndex('rel')
  if (relIndex < 0) {
    token.attrPush(['rel', 'noopener noreferrer'])
  } else {
    token.attrs[relIndex][1] = 'noopener noreferrer'
  }

  return defaultRender(tokens, idx, options, env, self)
}

const initMd = async () => {
  md.use(
    await Shiki({
      themes: {
        light: 'vitesse-light',
        dark: 'vitesse-dark',
      },
    }),
  )
  md.use(MarkdownItCopyCode, {})
}

const parseThinkContent = (content: string) => {
  return content
    .replace(/<think>/g, '\n\n<details open>\n<summary>思考过程</summary>\n\n')
    .replace(/<\/think>/g, '\n\n</details>\n\n')
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
      behavior: 'smooth',
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
  messageStore.list.push({
    role: 'user',
    content: text.value,
  })
  results.value = messageStore.list.map((item) => ({
    ...item,
    content: md.render(item.content),
  }))
  text.value = ''
  scrollResultToBottom()
}

const handleAi = async () => {
  try {
    messageStore.list.push({
      role: 'user',
      content: text.value,
    })

    const userMessage = text.value
    text.value = ''

    messageStore.list.push({
      role: 'assistant',
      content: '',
    })

    let currentMessage = ''
    const updateResults = () => {
      const parsedContent = parseThinkContent(currentMessage)
      messageStore.list[messageStore.list.length - 1].content = parsedContent
      results.value = messageStore.list.map((item) => ({
        ...item,
        content: md.render(item.content),
      }))
    }

    updateResults()
    scrollResultToBottom()

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
              role: 'user',
              content: userMessage,
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
            currentMessage += content
            updateResults()
            scrollResultToBottom()
          } catch (e) {
            console.error('Error parsing JSON:', e)
          }
        }
      }
    }
  } catch (error) {
    console.error('Error:', error)
    ElMessage.error('AI 回复失败，请重试')
  }
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
              content:
                '你是一个专业的润色助手，请根据用户的需求，对文本进行润色和改进，使其更加专业、流畅和优雅，同时保持原有的核心意思。',
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

    const cleanContent = fullContent
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .replace(/^\s+|\s+$/g, '')

    text.value = cleanContent
    scrollTextareaToBottom()
    ElMessage.success('润色完成')
  } catch (error) {
    console.error('Error:', error)
    ElMessage.error('润色失败，请重试')
  }
}

onMounted(async () => {
  await initMd()
  results.value = messageStore.list.map((item) => ({
    ...item,
    content: md.render(item.content),
  }))
  useCopyCode()
  scrollResultToBottom()
})

onActivated(() => {
  results.value = messageStore.list.map((item) => ({
    ...item,
    content: md.render(item.content),
  }))
  scrollResultToBottom()
})
</script>

<template>
  <div class="flex h-full flex-col justify-between">
    <div ref="resultRef" class="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
      <div
        class="flex gap-2"
        v-for="(result, index) in results"
        :key="index"
        :class="{
          'flex-row-reverse': result.role === 'user',
          'flex-row': result.role === 'assistant',
        }"
      >
        <img :src="logo" alt="logo" class="h-10 w-10" />
        <div
          class="prose dark:prose-invert max-w-none rounded-lg bg-white px-4 py-2 dark:bg-black"
          v-html="result.content"
        ></div>
      </div>
    </div>

    <div class="flex flex-col gap-2 bg-white p-4 dark:bg-black">
      <textarea
        ref="textareaRef"
        class="h-full w-full resize-none rounded outline-none"
        v-model="text"
        :rows="4"
        @keydown.enter="handleEnter"
      />

      <div class="flex justify-end">
        <el-button type="success" :disabled="!text" @click="handlePolish">
          <template #icon>
            <div class="i-carbon-edit"></div>
          </template>
          AI 润色
        </el-button>
        <el-button :disabled="!text" @click="handleAi">
          <template #icon>
            <div class="i-carbon-chat-bot"></div>
          </template>
          AI 回复
        </el-button>
        <el-button type="primary" :disabled="!text" @click="handleSend">
          <template #icon>
            <div class="i-carbon-send"></div>
          </template>
          发送
        </el-button>
      </div>
    </div>
  </div>
</template>
