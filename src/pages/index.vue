<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import Shiki from '@shikijs/markdown-it'
import { transformerColorizedBrackets } from '@shikijs/colorized-brackets'
import LinkAttributes from 'markdown-it-link-attributes'
import MarkdownItCopyCode, { useCopyCode } from 'markdown-it-copy-code'
import 'markdown-it-copy-code/styles/base.css'
import 'markdown-it-copy-code/styles/medium.css'
import { useUpload } from '@/composables/useUpload'

const userStore = useUserStore()
const settingsStore = useSettingsStore()
const messageStore = useMessageStore()
const friendStore = useFriendStore()
const uiStore = useUiStore()
const { uploading, progress, upload, uploadAndGetMarkdown } = useUpload()

const results = ref<any[]>([])
const text = ref('')
const drawer = ref(false)
const sending = ref(false)
const chatListLoading = ref(false)
const messagesLoading = ref(false)
const creatingChat = ref(false)
const clearingChat = ref(false)
const exitingChat = ref(false)
const isDragOver = ref(false)
const membersLoading = ref(false)
const removingMember = ref<number | null>(null)
const invitesLoading = ref(false)
const inviting = ref(false)
const processingInvite = ref<number | null>(null)
const inviteDialogVisible = ref(false)
const inviteeIds = ref<number[]>([])

// 消息选择模式状态
const selectMode = ref(false)
const selectedMessages = ref<number[]>([])
const summaryDialogVisible = ref(false)
const summaryContent = ref('')
const summarizing = ref(false)
// 当前右键的消息
const contextMessage = ref<any>(null)

// 移动端视图状态
const mobileView = ref<'list' | 'chat'>('list')
const isMobile = ref(typeof window !== 'undefined' && window.innerWidth < 768)

// 检测是否为移动端
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

// 返回聊天列表
const backToList = () => {
  mobileView.value = 'list'
}

const resultRef = useTemplateRef('resultRef')
const textareaRef = useTemplateRef('textareaRef')
const fileInputRef = useTemplateRef<HTMLInputElement>('fileInputRef')
const chatAvatarInputRef =
  useTemplateRef<HTMLInputElement>('chatAvatarInputRef')
const dialogVisible = ref(false)
const formRef = useTemplateRef('formRef')
const usernameRef = useTemplateRef('usernameRef')
const form = ref({
  title: '',
  memberIds: [] as number[],
})

// 判断当前用户是否是群主
const isOwner = computed(() => {
  const chat = messageStore.currentMessage
  return chat?.myRole === 'owner' || chat?.ownerId === userStore.user.id
})

const md = MarkdownIt({
  html: true, // 允许 HTML 标签（用于视频、音频等）
  linkify: true, // 自动识别链接
})

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

// 在光标位置插入文本
const insertAtCursor = (insertText: string) => {
  const textarea = textareaRef.value
  if (!textarea) {
    text.value += insertText
    return
  }
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const before = text.value.substring(0, start)
  const after = text.value.substring(end)
  text.value = before + insertText + after
  nextTick(() => {
    textarea.selectionStart = textarea.selectionEnd = start + insertText.length
    textarea.focus()
  })
}

// 上传文件并插入
const uploadAndInsert = async (file: File) => {
  const markdown = await uploadAndGetMarkdown(file)
  if (markdown) {
    insertAtCursor(markdown)
  }
}

// 处理粘贴事件
const handlePaste = async (event: ClipboardEvent) => {
  const items = event.clipboardData?.items
  if (!items) return

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      event.preventDefault()
      const file = item.getAsFile()
      if (file) await uploadAndInsert(file)
      return
    }
  }
}

// 触发文件选择
const triggerFileSelect = (type: 'image' | 'video' | 'file') => {
  if (fileInputRef.value) {
    const acceptMap = {
      image: 'image/*',
      video: 'video/*',
      file: '*',
    }
    fileInputRef.value.accept = acceptMap[type]
    fileInputRef.value.click()
  }
}

// 处理文件选择
const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    await uploadAndInsert(file)
  }
  // 清空 input 以便下次选择同一文件
  target.value = ''
}

// 处理拖拽进入
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = true
}

// 处理拖拽离开
const handleDragLeave = () => {
  isDragOver.value = false
}

// 处理拖拽放下
const handleDrop = async (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    await uploadAndInsert(files[0])
  }
}

// 触发群聊头像选择
const triggerChatAvatarSelect = () => {
  chatAvatarInputRef.value?.click()
}

// 处理群聊头像选择
const handleChatAvatarSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file && messageStore.currentMessage) {
    const result = await upload(file)
    if (result) {
      await messageStore.updateChatAvatar(
        messageStore.currentMessage.id,
        result.url,
      )
      ElMessage.success('群头像更新成功')
    }
  }
  target.value = ''
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

// 点击消息处理（选择模式下）
const handleMessageClick = (messageId: number) => {
  if (!selectMode.value) return
  toggleMessageSelect(messageId)
}

// 右键菜单命令处理
const handleContextCommand = (command: string) => {
  if (!contextMessage.value) return

  switch (command) {
    case 'multiSelect':
      selectMode.value = true
      selectedMessages.value = [contextMessage.value.id]
      break
    case 'copy':
      // 复制纯文本内容
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = contextMessage.value.content
      navigator.clipboard.writeText(tempDiv.textContent || '')
      ElMessage.success('已复制')
      break
  }
}

// 切换消息选择
const toggleMessageSelect = (messageId: number) => {
  const index = selectedMessages.value.indexOf(messageId)
  if (index === -1) {
    selectedMessages.value.push(messageId)
  } else {
    selectedMessages.value.splice(index, 1)
  }
}

// 全选消息
const selectAllMessages = () => {
  const messages = messageStore.currentMessage?.messages || []
  selectedMessages.value = messages.map((m: any) => m.id)
}

// 退出选择模式
const exitSelectMode = () => {
  selectMode.value = false
  selectedMessages.value = []
}

// 从消息内容中提取图片 URL
const extractImageUrls = (content: string): string[] => {
  const imgRegex = /!\[.*?\]\((.*?)\)/g
  const urls: string[] = []
  let match
  while ((match = imgRegex.exec(content)) !== null) {
    urls.push(match[1])
  }
  return urls
}

// 将图片 URL 转换为 base64
const imageUrlToBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('图片转 base64 失败:', url, error)
    return ''
  }
}

// AI 总结
const handleSummary = async () => {
  if (selectedMessages.value.length === 0) {
    ElMessage.warning('请先选择要总结的消息')
    return
  }

  // 获取选中的消息内容
  const messages = messageStore.currentMessage?.messages || []
  const selectedMsgs = messages.filter((m: any) =>
    selectedMessages.value.includes(m.id),
  )

  // 构建用户消息内容
  let userContent: any
  const visionEnabled = settingsStore.settings.visionEnabled

  // 提取所有图片 URL
  const allImageUrls: string[] = []
  if (visionEnabled) {
    for (const msg of selectedMsgs) {
      const imageUrls = extractImageUrls(msg.content)
      allImageUrls.push(...imageUrls)
    }
  }

  // 只有在有图片且开启视觉时才使用多模态格式
  if (visionEnabled && allImageUrls.length > 0) {
    // 视觉模式：构建多模态内容
    const contentParts: any[] = []

    // 添加文本内容
    const textContent = selectedMsgs
      .map(
        (m: any) =>
          `${m.nickname || m.username}: ${m.content.replace(/!\[.*?\]\(.*?\)/g, '[图片]')}`,
      )
      .join('\n')
    contentParts.push({ type: 'text', text: textContent })

    // 转换图片为 base64 并添加
    for (const url of allImageUrls) {
      const base64 = await imageUrlToBase64(url)
      if (base64) {
        contentParts.push({
          type: 'image_url',
          image_url: { url: base64 },
        })
      }
    }

    userContent = contentParts
  } else {
    // 纯文本模式
    userContent = selectedMsgs
      .map((m: any) => `${m.nickname || m.username}: ${m.content}`)
      .join('\n')
  }

  summaryDialogVisible.value = true
  summaryContent.value = ''
  summarizing.value = true

  try {
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
              content: settingsStore.settings.summaryPrompt,
            },
            {
              role: 'user',
              content: userContent,
            },
          ],
          stream: true,
        }),
      },
    )

    if (!res.ok) {
      const errorText = await res.text()
      console.error('AI API 错误:', errorText)
      throw new Error(errorText || `HTTP error! status: ${res.status}`)
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
          if (data === '[DONE]') break

          try {
            const json = JSON.parse(data)
            const content = json.choices?.[0]?.delta?.content
            if (content) {
              summaryContent.value += content
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    }

    // 退出选择模式
    exitSelectMode()
  } catch (error: any) {
    console.error('总结失败:', error)
    const msg = error?.message || '未知错误'
    ElMessage.error(`总结失败: ${msg.substring(0, 100)}`)
  } finally {
    summarizing.value = false
  }
}

// 渲染后的总结内容
const renderedSummary = computed(() => {
  return summaryContent.value ? renderMd(summaryContent.value) : ''
})

// 复制总结内容
const copySummary = async () => {
  try {
    await navigator.clipboard.writeText(summaryContent.value)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

const handleSelectMessage = async (index: number) => {
  messageStore.current = index

  // 移动端：切换到聊天视图
  if (isMobile.value) {
    mobileView.value = 'chat'
  }

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
  const isGroup = messageStore.currentMessage?.type === 'group'
  await ElMessageBox.confirm(
    isGroup ? '确定退出该群聊吗？' : '确定删除该会话吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    },
  )

  const chatId = messageStore.currentMessage?.id
  if (chatId) {
    exitingChat.value = true
    try {
      await messageStore.removeChat(chatId)
      drawer.value = false
      results.value =
        messageStore.currentMessage?.messages.map((item: any) => ({
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

// 解散群聊（仅群主）
const handleDismissGroup = async () => {
  await ElMessageBox.confirm('确定解散该群聊吗？此操作不可恢复。', '解散群聊', {
    confirmButtonText: '确定解散',
    cancelButtonText: '取消',
    type: 'error',
  })

  const chatId = messageStore.currentMessage?.id
  if (chatId) {
    exitingChat.value = true
    try {
      await messageStore.removeChat(chatId)
      drawer.value = false
      results.value =
        messageStore.currentMessage?.messages.map((item: any) => ({
          ...item,
          content: renderMd(item.content),
        })) || []
      text.value = ''
      ElMessage.success('群聊已解散')
    } catch (error) {
      console.error('解散群聊失败:', error)
      ElMessage.error('解散群聊失败')
    } finally {
      exitingChat.value = false
    }
  }
}

// 打开抽屉时加载群成员和邀请
const handleDrawerOpen = async () => {
  const chat = messageStore.currentMessage
  if (chat?.type === 'group' && chat.id) {
    membersLoading.value = true
    try {
      await messageStore.loadMembers(chat.id)
    } catch (error) {
      console.error('加载群成员失败:', error)
    } finally {
      membersLoading.value = false
    }

    // 群主加载待审核邀请
    if (isOwner.value) {
      invitesLoading.value = true
      try {
        await messageStore.loadInvites(chat.id)
      } catch (error) {
        console.error('加载邀请列表失败:', error)
      } finally {
        invitesLoading.value = false
      }
    }
  }
}

// 移除群成员
const handleRemoveMember = async (userId: number) => {
  await ElMessageBox.confirm('确定移除该成员吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })

  const chatId = messageStore.currentMessage?.id
  if (chatId) {
    removingMember.value = userId
    try {
      await messageStore.removeMember(chatId, userId)
      ElMessage.success('已移除成员')
    } catch (error: any) {
      console.error('移除成员失败:', error)
      ElMessage.error(error.response?.data?.message || '移除成员失败')
    } finally {
      removingMember.value = null
    }
  }
}

// 打开邀请好友对话框
const handleOpenInviteDialog = async () => {
  inviteeIds.value = []
  // 加载好友列表
  if (friendStore.friends.length === 0) {
    try {
      await friendStore.getFriendList()
    } catch (error) {
      console.error('获取好友列表失败:', error)
    }
  }
  inviteDialogVisible.value = true
}

// 获取可邀请的好友（排除已是群成员的，私聊时排除对方）
const availableFriendsToInvite = computed(() => {
  const chat = messageStore.currentMessage
  const memberIds = new Set(chat?.members?.map((m) => m.userId) || [])
  // 私聊时排除对方
  if (chat?.type === 'private' && chat?.participantId) {
    memberIds.add(chat.participantId)
  }
  return friendStore.friends.filter((f) => !memberIds.has(f.id))
})

// 发送邀请
const handleInvite = async () => {
  if (inviteeIds.value.length === 0) {
    ElMessage.warning('请选择要邀请的好友')
    return
  }

  const chatId = messageStore.currentMessage?.id
  if (!chatId) return

  inviting.value = true
  try {
    const result = await messageStore.inviteToChat(chatId, inviteeIds.value)
    if (result.invitedCount > 0) {
      ElMessage.success(result.message || '邀请已发送')
    } else {
      ElMessage.warning(result.message || '没有发送任何邀请')
    }
    inviteDialogVisible.value = false
    inviteeIds.value = []
    // 如果私聊转群聊，刷新聊天列表以更新状态
    if (result.convertedToGroup) {
      await messageStore.getChatList()
    }
  } catch (error: any) {
    console.error('邀请失败:', error)
    ElMessage.error(error.response?.data?.message || '邀请失败')
  } finally {
    inviting.value = false
  }
}

// 审核邀请
const handleProcessInvite = async (
  inviteId: number,
  action: 'accept' | 'reject',
) => {
  const chatId = messageStore.currentMessage?.id
  if (!chatId) return

  processingInvite.value = inviteId
  try {
    const result = await messageStore.processInvite(chatId, inviteId, action)
    ElMessage.success(result.message)
  } catch (error: any) {
    console.error('处理邀请失败:', error)
    ElMessage.error(error.response?.data?.message || '处理邀请失败')
  } finally {
    processingInvite.value = null
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

  // 初始化移动端检测
  checkMobile()
  window.addEventListener('resize', checkMobile)

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
  results.value =
    messageStore.currentMessage?.messages.map((item: any) => ({
      ...item,
      content: renderMd(item.content),
    })) || []

  useCopyCode()
  scrollResultToBottom()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

onActivated(() => {
  results.value =
    messageStore.currentMessage?.messages.map((item: any) => ({
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

// 同步移动端聊天视图状态到 UI store（控制底部导航栏显示）
watch(
  [isMobile, mobileView],
  ([mobile, view]) => {
    uiStore.isMobileChatView = mobile && view === 'chat'
  },
  { immediate: true },
)
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInputRef"
      type="file"
      class="hidden"
      @change="handleFileSelect"
    />
    <!-- 顶部栏：移动端根据视图切换显示，固定高度 56px -->
    <div class="flex h-14">
      <!-- 搜索栏：移动端列表视图显示，桌面端始终显示 -->
      <div
        class="flex w-full md:w-52 items-center gap-2 border-b md:border-r border-[#DADADA] bg-[#F7F7F7] px-3 dark:border-[#292929] dark:bg-[#191919]"
        :class="{ 'hidden': isMobile && mobileView === 'chat' }"
      >
        <el-input
          size="small"
          v-model="messageStore.search"
          placeholder="搜索"
          clearable
          class="flex-1"
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

      <!-- 聊天标题栏：移动端聊天视图显示，桌面端始终显示 -->
      <div
        class="flex flex-1 items-center justify-between border-b border-[#DADADA] px-4 dark:border-[#292929]"
        :class="{ 'hidden': isMobile && mobileView === 'list' }"
      >
        <div class="flex items-center gap-3">
          <!-- 移动端返回按钮 -->
          <button
            v-if="isMobile"
            @click="backToList"
            class="icon-btn flex items-center justify-center"
          >
            <div class="i-carbon-arrow-left text-xl"></div>
          </button>
          <span class="text-base">
            {{
              messageStore.currentMessage?.displayName ||
              messageStore.currentMessage?.title
            }}
          </span>
        </div>
        <button
          v-if="messageStore.currentMessage"
          class="icon-btn flex items-center justify-center"
          @click="drawer = true"
        >
          <div class="i-carbon-overflow-menu-horizontal text-xl"></div>
        </button>
      </div>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <!-- 聊天列表：移动端全宽，桌面端固定宽度 -->
      <div
        class="w-full md:w-52 overflow-y-auto border-r border-[#DADADA] dark:border-[#292929]"
        :class="{ 'hidden': isMobile && mobileView === 'chat' }"
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
          <UserAvatar
            :avatar="item.displayAvatar"
            :name="item.displayName || item.title"
            bg-color="#FFFFFF"
            text-color="#333"
          />
          <div class="flex-1 overflow-hidden">
            <div class="truncate">{{ item.displayName || item.title }}</div>
            <div class="truncate text-xs text-gray-500">
              {{ item.lastMessage || '暂无消息' }}
            </div>
          </div>
        </div>
        <el-empty
          v-if="!chatListLoading && messageStore.filteredList.length === 0"
          description="暂无聊天"
        />
      </div>

      <!-- 消息区域：移动端列表视图时隐藏 -->
      <div
        class="flex-1 flex-col overflow-hidden"
        :class="{
          'hidden': isMobile && mobileView === 'list',
          'flex': !isMobile || mobileView === 'chat'
        }"
      >
        <!-- 选择模式工具栏 -->
        <div
          v-if="selectMode"
          class="flex items-center justify-between border-b border-[#DADADA] bg-blue-50 px-4 py-2 dark:border-[#292929] dark:bg-blue-900/20"
        >
          <span class="text-sm"
            >已选择 {{ selectedMessages.length }} 条消息</span
          >
          <div class="flex gap-2">
            <el-button size="small" @click="selectAllMessages">全选</el-button>
            <el-button size="small" @click="exitSelectMode">取消</el-button>
          </div>
        </div>

        <div
          ref="resultRef"
          class="flex flex-1 flex-col gap-4 overflow-y-auto p-4"
          v-loading="messagesLoading"
        >
          <div
            class="flex items-start gap-2"
            v-for="(result, index) in results"
            :key="index"
            @click="handleMessageClick(result.id)"
          >
            <!-- 选择模式下显示复选框（始终在左边） -->
            <el-checkbox
              v-if="selectMode"
              :model-value="selectedMessages.includes(result.id)"
              @click.stop
              @change="toggleMessageSelect(result.id)"
              class="mr-2"
            />
            <!-- 消息内容区域 -->
            <div
              class="flex flex-1 gap-4 overflow-hidden"
              :class="{
                'flex-row-reverse': result.userId === userStore.user.id,
                'flex-row': result.userId !== userStore.user.id,
              }"
            >
              <UserAvatar
                :avatar="result.avatar"
                :name="result.nickname"
                :bg-color="
                  result.userId === userStore.user.id ? '#3498db' : '#FFFFFF'
                "
                :text-color="
                  result.userId === userStore.user.id ? 'white' : '#333'
                "
              />
              <el-dropdown
                trigger="contextmenu"
                @command="handleContextCommand"
                @visible-change="(visible: boolean) => visible && (contextMessage = result)"
              >
                <div
                  class="prose dark:prose-invert max-w-none overflow-hidden rounded-lg bg-white px-4 py-2 dark:bg-[#2C2C2C]"
                  v-html="result.content"
                ></div>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="multiSelect">
                      <div class="i-carbon-checkbox-checked mr-2 inline-block"></div>
                      多选
                    </el-dropdown-item>
                    <el-dropdown-item command="copy">
                      <div class="i-carbon-copy mr-2 inline-block"></div>
                      复制
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>

        <!-- 选择模式下显示 AI 总结按钮 -->
        <div
          v-if="selectMode"
          class="flex items-center justify-center border-t border-[#DADADA] p-4 dark:border-[#292929]"
          :class="{ 'safe-area-bottom': isMobile && mobileView === 'chat' }"
        >
          <el-button
            type="primary"
            size="large"
            :disabled="selectedMessages.length === 0"
            @click="handleSummary"
          >
            <template #icon>
              <div class="i-carbon-document-summary"></div>
            </template>
            AI 总结 ({{ selectedMessages.length }} 条消息)
          </el-button>
        </div>

        <!-- 正常输入区域 -->
        <div
          v-else
          class="flex flex-col gap-2 border-t border-[#DADADA] p-4 dark:border-[#292929]"
          :class="{
            'ring-2 ring-blue-400 ring-inset': isDragOver,
            'safe-area-bottom': isMobile && mobileView === 'chat'
          }"
          @dragover="handleDragOver"
          @dragleave="handleDragLeave"
          @drop="handleDrop"
        >
          <!-- 上传进度条 -->
          <div v-if="uploading" class="mb-2">
            <el-progress :percentage="progress" :stroke-width="4" />
          </div>

          <div class="flex justify-between text-xl">
            <div class="flex gap-4">
              <button
                class="i-carbon-image icon-btn"
                @click="triggerFileSelect('image')"
                title="上传图片"
                :disabled="uploading"
              ></button>
              <button
                class="i-carbon-video icon-btn"
                @click="triggerFileSelect('video')"
                title="上传视频"
                :disabled="uploading"
              ></button>
              <button
                class="i-carbon-document icon-btn"
                @click="triggerFileSelect('file')"
                title="上传文件"
                :disabled="uploading"
              ></button>
            </div>
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
            :placeholder="
              isDragOver
                ? '松开以上传文件...'
                : '输入消息，按 Enter 发送，Shift+Enter 换行'
            "
            @keydown.enter="handleEnter"
            @paste="handlePaste"
          />

          <div class="flex justify-end">
            <el-button
              type="primary"
              :disabled="!text || sending || !messageStore.currentMessage"
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

    <el-dialog
      v-model="dialogVisible"
      title="新建群聊"
      width="90%"
      class="max-w-md!"
      align-center
      @opened="opened"
    >
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
                <UserAvatar
                  :avatar="friend.avatar"
                  :name="friend.nickname || friend.username"
                  :size="24"
                />
                <span>{{ friend.nickname || friend.username }}</span>
                <el-tag v-if="friend.isOnline" type="success" size="small"
                  >在线</el-tag
                >
              </div>
            </el-option>
          </el-select>
          <div
            v-if="friendStore.friends.length === 0"
            class="mt-1 text-xs text-gray-500"
          >
            暂无好友，请先到好友页面添加好友
          </div>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :disabled="creatingChat"
            @click="handleSubmit"
          >
            <template v-if="creatingChat">
              <span class="i-carbon-circle-dash mr-1 animate-spin"></span>
              创建中...
            </template>
            <template v-else>创建群聊</template>
          </el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <el-drawer
      v-model="drawer"
      direction="rtl"
      :with-header="false"
      size="320px"
      @open="handleDrawerOpen"
      class="chat-drawer"
    >
      <div class="flex h-full flex-col bg-[#F7F7F7] dark:bg-[#191919]">
        <!-- 群聊信息 -->
        <div
          v-if="messageStore.currentMessage?.type === 'group'"
          class="border-b border-[#DADADA] bg-white p-4 dark:border-[#292929] dark:bg-[#2C2C2C]"
        >
          <div class="flex flex-col items-center gap-3">
            <!-- 群头像 -->
            <div
              class="relative"
              :class="{ 'cursor-pointer': isOwner }"
              @click="isOwner && triggerChatAvatarSelect()"
            >
              <UserAvatar
                :avatar="
                  messageStore.currentMessage?.displayAvatar ||
                  messageStore.currentMessage?.avatar
                "
                :name="
                  messageStore.currentMessage?.displayName ||
                  messageStore.currentMessage?.title
                "
                :size="72"
              />
              <div
                v-if="isOwner"
                class="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity hover:opacity-100"
              >
                <div class="i-carbon-camera text-xl text-white"></div>
              </div>
            </div>
            <input
              ref="chatAvatarInputRef"
              type="file"
              class="hidden"
              accept="image/*"
              @change="handleChatAvatarSelect"
            />

            <!-- 群名称 -->
            <div class="w-full">
              <el-input
                v-if="isOwner"
                v-model="messageStore.currentMessage.title"
                placeholder="群名称"
                class="text-center"
              />
              <div v-else class="text-center text-lg font-medium">
                {{ messageStore.currentMessage?.title }}
              </div>
            </div>
          </div>
        </div>

        <!-- 私聊信息 -->
        <div
          v-else
          class="border-b border-[#DADADA] bg-white p-4 dark:border-[#292929] dark:bg-[#2C2C2C]"
        >
          <div class="flex flex-col items-center gap-3">
            <UserAvatar
              :avatar="messageStore.currentMessage?.displayAvatar"
              :name="
                messageStore.currentMessage?.displayName ||
                messageStore.currentMessage?.title
              "
              :size="72"
            />
            <div class="text-lg font-medium">
              {{
                messageStore.currentMessage?.displayName ||
                messageStore.currentMessage?.title
              }}
            </div>
          </div>
        </div>

        <!-- 私聊邀请好友（会转为群聊） -->
        <div
          v-if="messageStore.currentMessage?.type === 'private'"
          class="border-b border-[#DADADA] p-4 dark:border-[#292929]"
        >
          <el-button class="!ml-0 !w-full" @click="handleOpenInviteDialog">
            <template #icon>
              <div class="i-carbon-user-follow"></div>
            </template>
            邀请好友建群
          </el-button>
        </div>

        <!-- 群成员列表 -->
        <div
          v-if="messageStore.currentMessage?.type === 'group'"
          class="flex-1 overflow-y-auto"
        >
          <!-- 邀请好友按钮 -->
          <div class="border-b border-[#DADADA] p-4 dark:border-[#292929]">
            <el-button class="!ml-0 !w-full" @click="handleOpenInviteDialog">
              <template #icon>
                <div class="i-carbon-user-follow"></div>
              </template>
              邀请好友入群
            </el-button>
          </div>

          <!-- 待审核邀请（仅群主可见） -->
          <div
            v-if="isOwner && messageStore.currentMessage?.invites?.length"
            class="border-b border-[#DADADA] p-4 dark:border-[#292929]"
          >
            <div
              class="mb-3 flex items-center gap-2 text-sm text-[#666] dark:text-[#999]"
            >
              待审核邀请
              <el-tag type="danger" size="small">{{
                messageStore.currentMessage.invites.length
              }}</el-tag>
            </div>
            <div v-loading="invitesLoading" class="space-y-2">
              <div
                v-for="invite in messageStore.currentMessage.invites"
                :key="invite.id"
                class="rounded-lg bg-[#EAEAEA] p-3 dark:bg-[#252525]"
              >
                <div class="mb-2 flex items-center gap-2">
                  <UserAvatar
                    :avatar="invite.inviteeAvatar"
                    :name="invite.inviteeNickname || invite.inviteeUsername"
                    :size="32"
                  />
                  <div class="min-w-0 flex-1">
                    <div class="truncate font-medium">
                      {{ invite.inviteeNickname || invite.inviteeUsername }}
                    </div>
                    <div class="text-xs text-[#999] dark:text-[#666]">
                      由
                      {{
                        invite.inviterNickname || invite.inviterUsername
                      }}
                      邀请
                    </div>
                  </div>
                </div>
                <div class="flex gap-2">
                  <el-button
                    size="small"
                    type="primary"
                    :loading="processingInvite === invite.id"
                    @click="handleProcessInvite(invite.id, 'accept')"
                  >
                    同意
                  </el-button>
                  <el-button
                    size="small"
                    :loading="processingInvite === invite.id"
                    @click="handleProcessInvite(invite.id, 'reject')"
                  >
                    拒绝
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <!-- 群成员 -->
          <div class="p-4">
            <div class="mb-3 text-sm text-[#666] dark:text-[#999]">
              群成员 ({{ messageStore.currentMessage?.members?.length || 0 }})
            </div>
            <div v-loading="membersLoading" class="space-y-1">
              <div
                v-for="member in messageStore.currentMessage?.members"
                :key="member.userId"
                class="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-[#EAEAEA] dark:hover:bg-[#252525]"
              >
                <div class="flex items-center gap-3">
                  <UserAvatar
                    :avatar="member.avatar"
                    :name="member.nickname || member.username"
                    :size="36"
                  />
                  <div>
                    <div class="flex items-center gap-2">
                      <span>{{ member.nickname || member.username }}</span>
                      <el-tag
                        v-if="member.role === 'owner'"
                        type="warning"
                        size="small"
                        >群主</el-tag
                      >
                      <el-tag
                        v-else-if="member.role === 'admin'"
                        type="primary"
                        size="small"
                        >管理员</el-tag
                      >
                    </div>
                    <div class="text-xs text-[#999] dark:text-[#666]">
                      @{{ member.username }}
                    </div>
                  </div>
                </div>
                <!-- 只有群主可以移除成员，且不能移除自己 -->
                <el-button
                  v-if="isOwner && member.userId !== userStore.user.id"
                  type="danger"
                  link
                  size="small"
                  :loading="removingMember === member.userId"
                  @click="handleRemoveMember(member.userId)"
                >
                  移除
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 占位，私聊时撑开空间 -->
        <div v-else class="flex-1"></div>

        <!-- 操作按钮 -->
        <div
          class="flex flex-col gap-2 border-t border-[#DADADA] bg-white p-4 dark:border-[#292929] dark:bg-[#2C2C2C]"
        >
          <el-button
            class="!ml-0 !w-full"
            type="warning"
            plain
            :loading="clearingChat"
            @click="handleClear"
          >
            <template #icon>
              <div class="i-carbon-trash-can"></div>
            </template>
            清空聊天记录
          </el-button>

          <!-- 群主可以解散群，其他人只能退出 -->
          <el-button
            v-if="isOwner && messageStore.currentMessage?.type === 'group'"
            class="!ml-0 !w-full"
            type="danger"
            :loading="exitingChat"
            @click="handleDismissGroup"
          >
            <template #icon>
              <div class="i-carbon-close-outline"></div>
            </template>
            解散群聊
          </el-button>
          <el-button
            v-else
            class="!ml-0 !w-full"
            type="danger"
            plain
            :loading="exitingChat"
            @click="handleExit"
          >
            <template #icon>
              <div class="i-carbon-logout"></div>
            </template>
            {{
              messageStore.currentMessage?.type === 'group'
                ? '退出群聊'
                : '删除会话'
            }}
          </el-button>
        </div>
      </div>
    </el-drawer>

    <!-- 邀请好友对话框 -->
    <el-dialog
      v-model="inviteDialogVisible"
      title="邀请好友入群"
      width="90%"
      class="max-w-md!"
      align-center
    >
      <div
        v-if="availableFriendsToInvite.length === 0"
        class="py-4 text-center text-[#999]"
      >
        没有可邀请的好友（好友已全部加入群聊或暂无好友）
      </div>
      <el-select
        v-else
        v-model="inviteeIds"
        placeholder="选择要邀请的好友"
        multiple
        filterable
        class="w-full"
      >
        <el-option
          v-for="friend in availableFriendsToInvite"
          :key="friend.id"
          :label="friend.nickname || friend.username"
          :value="friend.id"
        >
          <div class="flex items-center gap-2">
            <UserAvatar
              :avatar="friend.avatar"
              :name="friend.nickname || friend.username"
              :size="24"
            />
            <span>{{ friend.nickname || friend.username }}</span>
          </div>
        </el-option>
      </el-select>
      <template #footer>
        <el-button @click="inviteDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="inviting"
          :disabled="inviteeIds.length === 0"
          @click="handleInvite"
        >
          发送邀请
        </el-button>
      </template>
    </el-dialog>

    <!-- AI 总结弹窗 -->
    <el-dialog
      v-model="summaryDialogVisible"
      title="AI 总结"
      width="90%"
      class="max-w-xl!"
      align-center
      :close-on-click-modal="!summarizing"
      :close-on-press-escape="!summarizing"
    >
      <div v-loading="summarizing" element-loading-text="正在生成总结...">
        <div
          v-if="summaryContent"
          class="prose dark:prose-invert max-h-[400px] min-h-[200px] max-w-none overflow-y-auto rounded-lg bg-gray-50 p-4 dark:bg-[#2C2C2C]"
          v-html="renderedSummary"
        ></div>
        <div v-else-if="!summarizing" class="py-8 text-center text-gray-500">
          暂无内容
        </div>
      </div>
      <template #footer>
        <el-button @click="summaryDialogVisible = false">关闭</el-button>
        <el-button
          type="primary"
          :disabled="!summaryContent || summarizing"
          @click="copySummary"
        >
          <template #icon>
            <div class="i-carbon-copy"></div>
          </template>
          复制
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style>
/* 抽屉暗色模式背景 */
.dark .chat-drawer .el-drawer__body {
  background-color: #191919;
}
</style>
