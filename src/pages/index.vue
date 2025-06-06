<script setup lang="ts">
import Shiki from '@shikijs/markdown-it'
import MarkdownIt from 'markdown-it'
import MarkdownItCopyCode, { useCopyCode } from 'markdown-it-copy-code'
import 'markdown-it-copy-code/styles/base.css'
import 'markdown-it-copy-code/styles/medium.css'

const md = MarkdownIt()

const result = ref('')
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

  const res = await fetch('/README.md')

  result.value = md.render(await res.text())
}

initMd()

const handleEnter = async (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    result.value += md.render(text.value)
    text.value = ''
    await nextTick()
    resultRef.value?.scrollTo({
      top: resultRef.value?.scrollHeight,
      behavior: 'smooth',
    })
  }
}

onMounted(() => {
  useCopyCode()
})
</script>

<template>
  <div class="flex h-full flex-col justify-between">
    <div ref="resultRef" class="flex-1 overflow-y-auto p-4">
      <div class="prose dark:prose-invert max-w-none" v-html="result"></div>
    </div>

    <div class="p-4">
      <textarea
        class="h-full w-full rounded bg-white p-2 dark:bg-black"
        v-model="text"
        @keydown.enter="handleEnter"
      />
    </div>
  </div>
</template>
