<script setup lang="ts">
const userStore = useUserStore()
</script>

<template>
  <div class="flex h-full">
    <div
      class="flex flex-col justify-between border-r border-[#DADADA] bg-[#EDEDED] px-2 py-4 dark:border-[#292929] dark:bg-[#121212]"
    >
      <!-- 顶部：用户头像 -->
      <div class="flex flex-col items-center gap-4 text-xl">
        <RouterLink to="/profile" class="block">
          <UserAvatar
            :avatar="userStore.user.avatar"
            :name="userStore.user.nickname || userStore.user.username"
            :size="40"
            class="cursor-pointer hover:opacity-80 transition-opacity"
            :class="{ 'ring-2 ring-[#3498db]': $route.path === '/profile' }"
          />
        </RouterLink>

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

    <div class="flex-1 overflow-hidden">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </div>
  </div>
</template>
