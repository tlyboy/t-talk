<script setup lang="ts">
const userStore = useUserStore()
const uiStore = useUiStore()
</script>

<template>
  <div class="flex h-full flex-col md:flex-row">
    <!-- 桌面端：左侧导航栏 -->
    <div
      class="hidden flex-col justify-between border-r border-[#DADADA] bg-[#EDEDED] px-2 py-4 md:flex dark:border-[#292929] dark:bg-[#121212]"
    >
      <!-- 顶部：用户头像/Logo -->
      <div class="flex flex-col items-center gap-4 text-xl">
        <RouterLink v-if="userStore.user.id" to="/profile" class="block">
          <UserAvatar
            :avatar="userStore.user.avatar"
            :name="userStore.user.nickname || userStore.user.username"
            :size="40"
            class="cursor-pointer transition-opacity hover:opacity-80"
            :class="{ 'ring-2 ring-[#3498db]': $route.path === '/profile' }"
          />
        </RouterLink>
        <img
          v-else
          src="@/assets/images/logo.png"
          alt="T-Talk"
          class="h-10 w-10"
        />

        <RouterLink
          to="/"
          :class="{ 'text-[#3498db]': $route.path === '/' }"
          class="icon-btn i-carbon-chat"
          title="聊天"
        ></RouterLink>

        <RouterLink
          to="/user"
          :class="{ 'text-[#3498db]': $route.path === '/user' }"
          class="icon-btn i-carbon-user-multiple"
          title="好友"
        ></RouterLink>
      </div>

      <!-- 底部：应用设置 -->
      <div class="flex flex-col items-center gap-4 text-xl">
        <a
          class="i-carbon-logo-github icon-btn"
          href="https://github.com/tlyboy/t-talk"
          target="_blank"
          rel="noopener noreferrer"
          title="GitHub"
        ></a>

        <DarkToggle />

        <RouterLink
          to="/settings"
          :class="{ 'text-[#3498db]': $route.path === '/settings' }"
          class="icon-btn i-carbon-settings"
          title="设置"
        ></RouterLink>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="min-h-0 flex-1 overflow-hidden">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </div>

    <!-- 移动端：底部导航栏（flex 布局，非 fixed） -->
    <div
      v-if="!uiStore.isMobileChatView"
      class="safe-area-bottom flex shrink-0 border-t border-[#DADADA] bg-[#EDEDED] md:hidden dark:border-[#292929] dark:bg-[#121212]"
    >
      <RouterLink
        to="/"
        class="flex flex-1 flex-col items-center gap-1 py-2"
        :class="$route.path === '/' ? 'text-[#3498db]' : 'text-gray-500'"
      >
        <div class="i-carbon-chat text-xl"></div>
        <span class="text-xs">聊天</span>
      </RouterLink>

      <RouterLink
        to="/user"
        class="flex flex-1 flex-col items-center gap-1 py-2"
        :class="$route.path === '/user' ? 'text-[#3498db]' : 'text-gray-500'"
      >
        <div class="i-carbon-user-multiple text-xl"></div>
        <span class="text-xs">联系人</span>
      </RouterLink>

      <RouterLink
        to="/profile"
        class="flex flex-1 flex-col items-center gap-1 py-2"
        :class="$route.path === '/profile' ? 'text-[#3498db]' : 'text-gray-500'"
      >
        <div class="i-carbon-user-avatar text-xl"></div>
        <span class="text-xs">我的</span>
      </RouterLink>

      <RouterLink
        to="/settings"
        class="flex flex-1 flex-col items-center gap-1 py-2"
        :class="
          $route.path === '/settings' ? 'text-[#3498db]' : 'text-gray-500'
        "
      >
        <div class="i-carbon-settings text-xl"></div>
        <span class="text-xs">设置</span>
      </RouterLink>
    </div>
  </div>
</template>
