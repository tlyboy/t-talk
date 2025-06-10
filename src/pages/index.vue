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

const resultRef = useTemplateRef('resultRef')
const textareaRef = useTemplateRef('textareaRef')

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
  messageStore.currentMessage.messages.push({
    role: 'user',
    content: text.value,
    username: userStore.username,
  })
  results.value = messageStore.currentMessage.messages.map((item: any) => ({
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
  results.value = messageStore.currentMessage.messages.map((item: any) => ({
    ...item,
    content: md.render(item.content),
  }))
  scrollResultToBottom()
}

onMounted(async () => {
  await initMd()
  results.value = messageStore.currentMessage.messages.map((item: any) => ({
    ...item,
    content: md.render(item.content),
  }))
  useCopyCode()
  scrollResultToBottom()
})

onActivated(() => {
  results.value = messageStore.currentMessage.messages.map((item: any) => ({
    ...item,
    content: md.render(item.content),
  }))
  scrollResultToBottom()
})
</script>

<template>
  <div class="flex h-full">
    <div
      class="flex w-52 flex-col border-r border-[#DADADA] bg-[#F7F7F7] dark:border-[#292929] dark:bg-[#191919]"
    >
      <div
        class="flex gap-2 border-b border-[#DEDEDE] px-2 py-4 dark:border-[#303030]"
      >
        <el-input v-model="messageStore.search" placeholder="搜索">
          <template #prefix>
            <div class="i-carbon-search"></div>
          </template>
        </el-input>

        <el-button>
          <template #icon>
            <div class="i-carbon-add"></div>
          </template>
        </el-button>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div
          v-for="(item, index) in messageStore.filteredList"
          :key="index"
          class="flex items-center gap-2 px-2 py-4 hover:bg-[#EAEAEA] hover:dark:bg-[#252525]"
          :class="{
            'bg-[#DEDEDE] dark:bg-[#303030]': messageStore.current === index,
          }"
          @click="handleSelectMessage(index)"
        >
          <div
            class="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFFFFF] dark:bg-[#2C2C2C]"
          >
            <span>{{ item.username[0].toUpperCase() }}</span>
          </div>
          <div class="flex-1 overflow-hidden">
            <div class="truncate">{{ item.username }}</div>
            <div class="truncate">
              {{ item.messages[item.messages.length - 1].content }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex h-full flex-1 flex-col justify-between">
      <div
        ref="resultRef"
        class="flex flex-1 flex-col gap-4 overflow-y-auto p-4"
      >
        <div
          class="flex gap-4"
          v-for="(result, index) in results"
          :key="index"
          :class="{
            'flex-row-reverse': result.username === userStore.username,
            'flex-row': result.username !== userStore.username,
          }"
        >
          <div>
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full"
              :class="{
                'bg-[#3498db] text-white':
                  result.username === userStore.username,
                'bg-[#FFFFFF] dark:bg-[#2C2C2C]':
                  result.username !== userStore.username,
              }"
            >
              <span>{{ result.username[0].toUpperCase() }}</span>
            </div>
          </div>
          <div
            class="prose dark:prose-invert max-w-none rounded-lg bg-white px-4 py-2 dark:bg-[#2C2C2C]"
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
</template>
