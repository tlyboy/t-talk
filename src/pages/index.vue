<script setup lang="ts">
import Shiki from '@shikijs/markdown-it'
import MarkdownIt from 'markdown-it'
import MarkdownItCopyCode, { useCopyCode } from 'markdown-it-copy-code'
import 'markdown-it-copy-code/styles/base.css'
import 'markdown-it-copy-code/styles/medium.css'
import logo from '@/assets/images/logo.png'

const settingsStore = useSettingsStore()

const md = MarkdownIt({
  html: true,
  linkify: true,
})

// 自定义HTML标签过滤
const originalRender =
  md.renderer.rules.html_block ||
  function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options)
  }

md.renderer.rules.html_block = function (tokens, idx, options, env, self) {
  const content = tokens[idx].content

  // 只允许 details, summary 等安全标签
  if (content.match(/^<\/?(?:details|summary)[\s>]/)) {
    return originalRender(tokens, idx, options, env, self)
  }

  // 其他HTML标签会被转义
  return content.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// 同样处理行内HTML
md.renderer.rules.html_inline = md.renderer.rules.html_block

// 配置链接在新标签页打开
const defaultRender =
  md.renderer.rules.link_open ||
  function (tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options)
  }

md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  const token = tokens[idx]

  // 确保token.attrs存在
  if (!token.attrs) {
    token.attrs = []
  }

  // 添加 target="_blank" 和 rel="noopener noreferrer" 属性
  const aIndex = token.attrIndex('target')
  if (aIndex < 0) {
    token.attrPush(['target', '_blank'])
  } else {
    token.attrs[aIndex][1] = '_blank'
  }

  // 添加安全相关属性
  const relIndex = token.attrIndex('rel')
  if (relIndex < 0) {
    token.attrPush(['rel', 'noopener noreferrer'])
  } else {
    token.attrs[relIndex][1] = 'noopener noreferrer'
  }

  return defaultRender(tokens, idx, options, env, self)
}

const messageStore = useMessageStore()
const results = ref<any[]>([])
const text = ref('')

const resultRef = useTemplateRef('resultRef')
const textareaRef = useTemplateRef('textareaRef')

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
  results.value = messageStore.list.map((item) => {
    return {
      ...item,
      content: md.render(item.content),
    }
  })
  text.value = ''
  await nextTick()
  resultRef.value?.scrollTo({
    top: resultRef.value?.scrollHeight,
    behavior: 'smooth',
  })
}

const parseThinkContent = (content: string) => {
  return content
    .replace(/<think>/g, '\n\n<details open>\n<summary>思考过程</summary>\n\n')
    .replace(/<\/think>/g, '\n\n</details>\n\n')
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
      results.value = messageStore.list.map((item) => {
        return {
          ...item,
          content: md.render(item.content),
        }
      })
    }

    updateResults()
    await nextTick()
    resultRef.value?.scrollTo({
      top: resultRef.value?.scrollHeight,
      behavior: 'smooth',
    })

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
            await nextTick()
            resultRef.value?.scrollTo({
              top: resultRef.value?.scrollHeight,
              behavior: 'smooth',
            })
          } catch (e) {
            console.error('Error parsing JSON:', e)
          }
        }
      }
    }
  } catch (error) {
    console.error('Error:', error)
    ElMessage.error('生成失败，请重试')
  }
}

const scrollTextareaToBottom = () => {
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.scrollTop = textareaRef.value.scrollHeight
    }
  })
}

const handlePolish = async () => {
  try {
    const polishPrompt = `请帮我润色和改进以下文本，使其更加专业、流畅和优雅，同时保持原有的核心意思。直接返回润色后的文本，不要有任何解释、思考过程或额外标记：\n\n${text.value}`

    const originalText = text.value
    text.value = '正在润色中...'
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
              role: 'user',
              content: polishPrompt,
            },
          ],
          stream: true,
        }),
      },
    )

    if (!res.ok) {
      text.value = originalText
      throw new Error(`HTTP error! status: ${res.status}`)
    }

    const reader = res.body?.getReader()
    if (!reader) {
      text.value = originalText
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

    // 统一在最后进行内容过滤
    const cleanContent = fullContent
      // 移除think标签及其内容
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      // 移除常见的思考过程开头
      .replace(
        /^(让我来润色这段文本：?|我来帮您润色：?|润色后的文本：?|润色后的版本：?|以下是润色后的文本：?|我理解了您的文本，|经过润色后的文本：?|我已经理解了您的需求，|这是润色后的版本：?)/g,
        '',
      )
      // 提取引号中的内容（如果整个内容被引号包裹）
      .replace(/^["""]\s*([\s\S]*?)["""]\s*$/, '$1')
      // 移除可能的步骤说明
      .replace(/第[一二三四五六七八九十]步[：:]/g, '')
      .replace(/[1-9][.、]|首先|接下来|然后|最后|总的来说/g, '')
      // 移除其他可能的标记
      .replace(/\[润色\]|\[优化\]|\[改进\]/g, '')
      // 移除空行和首尾空白
      .replace(/^\s+|\s+$/g, '')
      .replace(/\n\s*\n/g, '\n')

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

  results.value = messageStore.list.map((item) => {
    return {
      ...item,
      content: md.render(item.content),
    }
  })

  useCopyCode()

  resultRef.value?.scrollTo({
    top: resultRef.value?.scrollHeight,
    behavior: 'smooth',
  })
})

onActivated(async () => {
  results.value = messageStore.list.map((item) => {
    return {
      ...item,
      content: md.render(item.content),
    }
  })

  resultRef.value?.scrollTo({
    top: resultRef.value?.scrollHeight,
    behavior: 'smooth',
  })
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

      <div class="flex justify-end gap-2">
        <el-button type="primary" plain :disabled="!text" @click="handlePolish">
          AI 润色
        </el-button>
        <el-button type="primary" plain :disabled="!text" @click="handleAi">
          AI 生成
        </el-button>
        <el-button type="primary" :disabled="!text" @click="handleSend">
          发送
        </el-button>
      </div>
    </div>
  </div>
</template>

<style>
.think-block {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  border-left: 4px solid #4b5563;
}

.dark .think-block {
  border-left-color: #6b7280;
}
</style>
