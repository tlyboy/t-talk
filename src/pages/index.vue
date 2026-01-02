<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import Shiki from '@shikijs/markdown-it'
import { transformerColorizedBrackets } from '@shikijs/colorized-brackets'
import LinkAttributes from 'markdown-it-link-attributes'
import MarkdownItCopyCode, { useCopyCode } from 'markdown-it-copy-code'
import 'markdown-it-copy-code/styles/base.css'
import 'markdown-it-copy-code/styles/medium.css'
import { useChatWebSocket } from '@/composables/useWebSocket'

const userStore = useUserStore()
const settingsStore = useSettingsStore()
const messageStore = useMessageStore()
const friendStore = useFriendStore()
const { connect, disconnect } = useChatWebSocket()

const results = ref<any[]>([])
const text = ref('')
const drawer = ref(false)
const sending = ref(false)
const chatListLoading = ref(false)
const messagesLoading = ref(false)
const creatingChat = ref(false)
const clearingChat = ref(false)
const exitingChat = ref(false)
const resultRef = useTemplateRef('resultRef')
const textareaRef = useTemplateRef('textareaRef')
const dialogVisible = ref(false)
const formRef = useTemplateRef('formRef')
const usernameRef = useTemplateRef('usernameRef')
const form = ref({
  title: '',
  memberIds: [] as number[],
})

const md = MarkdownIt()

// 安全的 markdown 渲染
const renderMd = (content: any) => {
  if (typeof content !== 'string') {
    return content?.toString?.() || ''
  }
  return md.render(content)
}

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
  const chatId = messageStore.currentMessage?.id
  if (!chatId || !text.value.trim()) return

  sending.value = true
  try {
    // 调用 API 发送消息
    await messageStore.sendMessageToChat(chatId, text.value)

    // 更新渲染结果
    results.value = messageStore.currentMessage?.messages.map((item: any) => ({
      ...item,
      content: renderMd(item.content),
    }))
    text.value = ''
    scrollResultToBottom()
  } catch (error) {
    console.error('发送消息失败:', error)
    ElMessage.error('发送消息失败')
  } finally {
    sending.value = false
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

const handleSelectMessage = async (index: number) => {
  messageStore.current = index

  // 如果消息列表为空，从服务器加载
  const chat = messageStore.currentMessage
  if (chat && chat.messages.length === 0) {
    messagesLoading.value = true
    try {
      await messageStore.loadMessages(chat.id)
    } catch (error) {
      console.error('加载消息失败:', error)
    } finally {
      messagesLoading.value = false
    }
  }

  results.value = messageStore.currentMessage?.messages.map((item: any) => ({
    ...item,
    content: renderMd(item.content),
  }))
  scrollResultToBottom()
}

const handleClear = async () => {
  await ElMessageBox.confirm('确定清空聊天记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })

  const chatId = messageStore.currentMessage?.id
  if (chatId) {
    clearingChat.value = true
    try {
      await messageStore.clearMessages(chatId)
      results.value = []
      text.value = ''
    } catch (error) {
      console.error('清空聊天记录失败:', error)
      ElMessage.error('清空聊天记录失败')
    } finally {
      clearingChat.value = false
    }
  }
}

const handleExit = async () => {
  await ElMessageBox.confirm('确定退出会话吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })

  const chatId = messageStore.currentMessage?.id
  if (chatId) {
    exitingChat.value = true
    try {
      await messageStore.removeChat(chatId)
      drawer.value = false
      results.value = messageStore.currentMessage?.messages.map((item: any) => ({
        ...item,
        content: renderMd(item.content),
      })) || []
      text.value = ''
    } catch (error) {
      console.error('删除聊天失败:', error)
      ElMessage.error('删除聊天失败')
    } finally {
      exitingChat.value = false
    }
  }
}

const handleSubmit = async () => {
  if (!form.value.title.trim()) {
    ElMessage.warning('请输入群聊名称')
    return
  }

  creatingChat.value = true
  try {
    await messageStore.createChat({
      title: form.value.title,
      type: 'group',
      memberIds: form.value.memberIds,
    })
    results.value = []
    dialogVisible.value = false
    form.value.title = ''
    form.value.memberIds = []
  } catch (error: any) {
    console.error('创建群聊失败:', error)
    ElMessage.error(error.response?.data?.message || '创建群聊失败')
  } finally {
    creatingChat.value = false
  }
}

const resetForm = () => {
  formRef.value?.resetFields()
}

const handleAdd = async () => {
  resetForm()
  // 加载好友列表
  if (friendStore.friends.length === 0) {
    try {
      await friendStore.getFriendList()
    } catch (error) {
      console.error('获取好友列表失败:', error)
    }
  }
  dialogVisible.value = true
}

const opened = async () => {
  usernameRef.value?.focus()
}

onMounted(async () => {
  await initMd()

  // 加载聊天列表
  chatListLoading.value = true
  try {
    await messageStore.getChatList()
  } catch (error) {
    console.error('加载聊天列表失败:', error)
  } finally {
    chatListLoading.value = false
  }

  // 渲染当前聊天的消息
  results.value = messageStore.currentMessage?.messages.map((item: any) => ({
    ...item,
    content: renderMd(item.content),
  })) || []

  useCopyCode()
  scrollResultToBottom()

  // 建立 WebSocket 连接
  connect()
})

onUnmounted(() => {
  disconnect()
})

onActivated(() => {
  results.value = messageStore.currentMessage?.messages.map((item: any) => ({
    ...item,
    content: renderMd(item.content),
  })) || []
  scrollResultToBottom()
})

// 监听当前聊天消息变化（用于 WebSocket 接收新消息时自动更新）
watch(
  () => messageStore.currentMessage?.messages,
  (messages) => {
    if (messages) {
      results.value = messages.map((item: any) => ({
        ...item,
        content: renderMd(item.content),
      }))
      scrollResultToBottom()
    }
  },
  { deep: true },
)
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
        v-loading="chatListLoading"
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
        <el-empty v-if="!chatListLoading && messageStore.filteredList.length === 0" description="暂无聊天" />
      </div>

      <div class="flex flex-1 flex-col overflow-hidden">
        <div
          ref="resultRef"
          class="flex flex-1 flex-col gap-4 overflow-y-auto p-4"
          v-loading="messagesLoading"
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
            <el-button
              type="primary"
              :disabled="!text || sending"
              :loading="sending"
              @click="handleSend"
            >
              <template #icon>
                <div class="i-carbon-send"></div>
              </template>
              发送
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" title="新建群聊" @opened="opened">
      <el-form
        ref="formRef"
        label-width="auto"
        label-position="top"
        :model="form"
        @submit.prevent="handleSubmit"
      >
        <el-form-item label="群聊名称" prop="title">
          <el-input ref="usernameRef" v-model="form.title" autofocus />
        </el-form-item>
        <el-form-item label="群成员（从好友中选择）">
          <el-select
            v-model="form.memberIds"
            placeholder="选择好友加入群聊"
            multiple
            filterable
            class="w-full"
          >
            <el-option
              v-for="friend in friendStore.friends"
              :key="friend.id"
              :label="friend.nickname || friend.username"
              :value="friend.id"
            >
              <div class="flex items-center gap-2">
                <span>{{ friend.nickname || friend.username }}</span>
                <el-tag v-if="friend.isOnline" type="success" size="small">在线</el-tag>
              </div>
            </el-option>
          </el-select>
          <div v-if="friendStore.friends.length === 0" class="mt-1 text-xs text-gray-500">
            暂无好友，请先到好友页面添加好友
          </div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :disabled="creatingChat" @click="handleSubmit">
            <template v-if="creatingChat">
              <span class="i-carbon-circle-dash animate-spin mr-1"></span>
              创建中...
            </template>
            <template v-else>创建群聊</template>
          </el-button>
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
          <el-button type="warning" link :loading="clearingChat" @click="handleClear">
            清空聊天记录
          </el-button>
        </div>

        <div>
          <el-button type="danger" link :loading="exitingChat" @click="handleExit">
            退出会话
          </el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>
