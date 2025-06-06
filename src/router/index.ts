import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import { setupLayouts } from 'virtual:generated-layouts'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: setupLayouts(routes),
})

const whiteList = ['/login', '/settings']

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  if (!whiteList.includes(to.path) && !userStore.id) {
    next('/login')
  } else {
    next()
  }
})

export default router
