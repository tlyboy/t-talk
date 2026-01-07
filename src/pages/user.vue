<script setup lang="ts">
const router = useRouter()
const friendStore = useFriendStore()
const messageStore = useMessageStore()

const activeTab = ref('friends')
const searchKeyword = ref('')
const searchResults = ref<any[]>([])
const searchLoading = ref(false)
const pageLoading = ref(false)
const sendingRequest = ref<number | null>(null)
const acceptingRequest = ref<number | null>(null)
const rejectingRequest = ref<number | null>(null)
const removingFriend = ref<number | null>(null)
const startingChat = ref<number | null>(null)
const processingInvite = ref<number | null>(null)

onMounted(async () => {
  pageLoading.value = true
  try {
    await Promise.all([
      friendStore.getFriendList(),
      friendStore.getFriendRequests(),
    ])
  } finally {
    pageLoading.value = false
  }
})

const handleSearch = async () => {
  if (!searchKeyword.value.trim()) {
    searchResults.value = []
    return
  }
  searchLoading.value = true
  try {
    searchResults.value = await friendStore.searchUsers(searchKeyword.value)
  } finally {
    searchLoading.value = false
  }
}

const handleSendRequest = async (userId: number) => {
  sendingRequest.value = userId
  try {
    await friendStore.sendRequest(userId)
    // 更新搜索结果中的状态
    const user = searchResults.value.find((u) => u.id === userId)
    if (user) {
      user.isPending = true
      user.pendingType = 'sent'
    }
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '发送好友申请失败')
  } finally {
    sendingRequest.value = null
  }
}

const handleAccept = async (requestId: number) => {
  acceptingRequest.value = requestId
  try {
    await friendStore.acceptRequest(requestId)
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '接受好友申请失败')
  } finally {
    acceptingRequest.value = null
  }
}

const handleReject = async (requestId: number) => {
  rejectingRequest.value = requestId
  try {
    await friendStore.rejectRequest(requestId)
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '拒绝好友申请失败')
  } finally {
    rejectingRequest.value = null
  }
}

const handleRemoveFriend = async (friendId: number) => {
  try {
    await ElMessageBox.confirm('确定要删除该好友吗？', '提示', {
      type: 'warning',
    })
    removingFriend.value = friendId
    await friendStore.removeFriend(friendId)
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '删除好友失败')
    }
  } finally {
    removingFriend.value = null
  }
}

const handleStartChat = async (friend: any) => {
  startingChat.value = friend.id
  try {
    await messageStore.getOrCreatePrivateChat(
      friend.id,
      friend.nickname || friend.username,
    )
    router.push('/')
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '创建聊天失败')
  } finally {
    startingChat.value = null
  }
}

const handleProcessInvite = async (
  invite: any,
  action: 'accept' | 'reject',
) => {
  processingInvite.value = invite.id
  try {
    await messageStore.processInvite(invite.chatId, invite.id, action)
    ElMessage.success(action === 'accept' ? '已同意入群申请' : '已拒绝入群申请')
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '处理邀请失败')
  } finally {
    processingInvite.value = null
  }
}
</script>

<template>
  <div class="flex h-full flex-col p-2 md:p-4" v-loading="pageLoading">
    <el-tabs v-model="activeTab">
      <!-- 好友列表 -->
      <el-tab-pane label="好友" name="friends">
        <div class="space-y-2">
          <div
            v-for="friend in friendStore.friends"
            :key="friend.id"
            class="flex items-center justify-between rounded-lg bg-white p-3 dark:bg-[#2C2C2C]"
          >
            <div class="flex items-center gap-3">
              <div class="relative">
                <UserAvatar
                  :avatar="friend.avatar"
                  :name="friend.nickname || friend.username"
                  :size="40"
                />
                <div
                  v-if="friend.isOnline"
                  class="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white bg-green-500"
                ></div>
              </div>
              <div>
                <div>{{ friend.nickname || friend.username }}</div>
                <div class="text-xs text-gray-500">
                  {{ friend.isOnline ? '在线' : '离线' }}
                </div>
              </div>
            </div>
            <div class="flex gap-2">
              <el-button
                type="primary"
                size="small"
                :loading="startingChat === friend.id"
                @click="handleStartChat(friend)"
              >
                聊天
              </el-button>
              <el-button
                type="danger"
                link
                :loading="removingFriend === friend.id"
                @click="handleRemoveFriend(friend.id)"
              >
                删除
              </el-button>
            </div>
          </div>
          <el-empty
            v-if="friendStore.friends.length === 0"
            description="暂无好友"
          />
        </div>
      </el-tab-pane>

      <!-- 好友申请 -->
      <el-tab-pane name="requests">
        <template #label>
          <span>
            好友申请
            <el-badge
              v-if="friendStore.pendingCount > 0"
              :value="friendStore.pendingCount"
              class="ml-1"
            />
          </span>
        </template>
        <div class="space-y-2">
          <div
            v-for="request in friendStore.requests"
            :key="request.id"
            class="flex items-center justify-between rounded-lg bg-white p-3 dark:bg-[#2C2C2C]"
          >
            <div class="flex items-center gap-3">
              <UserAvatar
                :avatar="request.avatar"
                :name="request.nickname || request.username"
                :size="40"
                bg-color="#9ca3af"
              />
              <div>
                <div>{{ request.nickname || request.username }}</div>
                <div class="text-xs text-gray-500">请求添加你为好友</div>
              </div>
            </div>
            <div class="flex gap-2">
              <el-button
                type="primary"
                size="small"
                :loading="acceptingRequest === request.id"
                @click="handleAccept(request.id)"
              >
                接受
              </el-button>
              <el-button
                size="small"
                :loading="rejectingRequest === request.id"
                @click="handleReject(request.id)"
              >
                拒绝
              </el-button>
            </div>
          </div>
          <el-empty
            v-if="friendStore.requests.length === 0"
            description="暂无好友申请"
          />
        </div>
      </el-tab-pane>

      <!-- 入群邀请 -->
      <el-tab-pane name="invites">
        <template #label>
          <span>
            入群邀请
            <el-badge
              v-if="messageStore.pendingInvites.length > 0"
              :value="messageStore.pendingInvites.length"
              class="ml-1"
            />
          </span>
        </template>
        <div class="space-y-2">
          <div
            v-for="invite in messageStore.pendingInvites"
            :key="invite.id"
            class="flex items-center justify-between rounded-lg bg-white p-3 dark:bg-[#2C2C2C]"
          >
            <div class="flex items-center gap-3">
              <UserAvatar
                :avatar="invite.inviteeAvatar"
                :name="invite.inviteeNickname || invite.inviteeUsername"
                :size="40"
                bg-color="#9ca3af"
              />
              <div>
                <div>
                  {{ invite.inviteeNickname || invite.inviteeUsername }}
                </div>
                <div class="text-xs text-gray-500">
                  由
                  {{ invite.inviterNickname || invite.inviterUsername }}
                  邀请加入「{{ invite.chatTitle }}」
                </div>
              </div>
            </div>
            <div class="flex gap-2">
              <el-button
                type="primary"
                size="small"
                :loading="processingInvite === invite.id"
                @click="handleProcessInvite(invite, 'accept')"
              >
                同意
              </el-button>
              <el-button
                size="small"
                :loading="processingInvite === invite.id"
                @click="handleProcessInvite(invite, 'reject')"
              >
                拒绝
              </el-button>
            </div>
          </div>
          <el-empty
            v-if="messageStore.pendingInvites.length === 0"
            description="暂无入群邀请"
          />
        </div>
      </el-tab-pane>

      <!-- 添加好友 -->
      <el-tab-pane label="添加好友" name="search">
        <div class="space-y-4">
          <div class="flex gap-2">
            <el-input
              v-model="searchKeyword"
              placeholder="输入用户名或昵称搜索"
              @keyup.enter="handleSearch"
            />
            <el-button
              type="primary"
              :loading="searchLoading"
              @click="handleSearch"
            >
              搜索
            </el-button>
          </div>

          <div class="space-y-2">
            <div
              v-for="user in searchResults"
              :key="user.id"
              class="flex items-center justify-between rounded-lg bg-white p-3 dark:bg-[#2C2C2C]"
            >
              <div class="flex items-center gap-3">
                <UserAvatar
                  :avatar="user.avatar"
                  :name="user.nickname || user.username"
                  :size="40"
                  bg-color="#9ca3af"
                />
                <div>{{ user.nickname || user.username }}</div>
              </div>
              <div>
                <el-tag v-if="user.isFriend" type="success">已是好友</el-tag>
                <el-tag
                  v-else-if="user.isPending && user.pendingType === 'sent'"
                  >已申请</el-tag
                >
                <el-tag
                  v-else-if="user.isPending && user.pendingType === 'received'"
                  type="warning"
                >
                  待处理
                </el-tag>
                <el-button
                  v-else
                  type="primary"
                  size="small"
                  :loading="sendingRequest === user.id"
                  @click="handleSendRequest(user.id)"
                >
                  添加好友
                </el-button>
              </div>
            </div>
            <el-empty
              v-if="
                searchKeyword && searchResults.length === 0 && !searchLoading
              "
              description="未找到用户"
            />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
