<script setup lang="ts">
import Shiki from '@shikijs/markdown-it'
import MarkdownIt from 'markdown-it'
import MarkdownItCopyCode, { useCopyCode } from 'markdown-it-copy-code'
import 'markdown-it-copy-code/styles/base.css'
import 'markdown-it-copy-code/styles/medium.css'
import logo from '@/assets/images/logo.png'

const md = MarkdownIt()

const messageStore = useMessageStore()
const results = ref<any[]>([])
const text = ref('')

const resultRef = useTemplateRef('resultRef')

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

const handleAi = () => {}

onMounted(async () => {
  await initMd()

  results.value = messageStore.list.map((item) => {
    return {
      ...item,
      content: md.render(item.content),
    }
  })

  useCopyCode()
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
        class="h-full w-full resize-none rounded outline-none"
        v-model="text"
        @keydown.enter="handleEnter"
      />

      <div class="flex justify-end">
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
