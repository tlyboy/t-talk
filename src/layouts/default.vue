<script setup lang="ts">
import logo from '@/assets/images/logo.png'
</script>

<template>
  <div class="flex h-full">
    <div class="flex flex-col justify-between bg-white p-4 dark:bg-black">
      <div class="flex flex-col items-center gap-4 text-xl">
        <img :src="logo" alt="logo" class="h-9 w-9" />

        <RouterLink
          to="/"
          :class="{ 'text-[#3498db]': $route.path === '/' }"
          class="icon-btn i-carbon-chat"
        ></RouterLink>

        <RouterLink
          to="/user"
          :class="{ 'text-[#3498db]': $route.path === '/user' }"
          class="icon-btn i-carbon-user"
        ></RouterLink>
      </div>

      <div class="flex flex-col items-center gap-4 text-xl">
        <a
          class="i-carbon-logo-github icon-btn"
          href="https://github.com/tlyboy/t-talk"
          target="_blank"
          rel="noopener noreferrer"
        ></a>

        <DarkToggle />

        <RouterLink
          to="/settings"
          :class="{ 'text-[#3498db]': $route.path === '/settings' }"
          class="icon-btn i-carbon-settings"
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
