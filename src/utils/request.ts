import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const request = axios.create({})

// 存储正在刷新时的请求队列
let isRefreshing = false
let failedQueue: {
  resolve: (value: any) => void
  reject: (error: any) => void
  config: InternalAxiosRequestConfig
}[] = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      resolve(request(config))
    } else {
      reject(error)
    }
  })
  failedQueue = []
}

// 添加请求拦截器
request.interceptors.request.use(
  function (config) {
    const settingsStore = useSettingsStore()
    const { server, devMode } = settingsStore.settings
    config.baseURL = `${devMode ? 'http' : 'https'}://${server}/v1`

    const userStore = useUserStore()
    if (userStore.user.token) {
      config.headers.Authorization = `Bearer ${userStore.user.token}`
    }

    return config
  },
  function (error) {
    return Promise.reject(error)
  },
)

// 添加响应拦截器
request.interceptors.response.use(
  function (response) {
    return response.data
  },
  async function (error: AxiosError) {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // 处理 401 认证错误
    if (error.response?.status === 401) {
      const userStore = useUserStore()

      // 检查是否是 Token 过期（而非其他 401 错误）
      const statusMessage = (error.response?.data as any)?.statusMessage

      // 如果是 Refresh Token 接口返回的 401，说明需要重新登录
      if (originalRequest.url?.includes('/user/refresh')) {
        userStore.clearLocal()
        if (window.location.pathname !== '/login') {
          ElMessage.error('登录已过期，请重新登录')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }

      // Token 过期，尝试刷新
      if (statusMessage === 'TOKEN_EXPIRED' && !originalRequest._retry) {
        originalRequest._retry = true

        // 如果已经在刷新中，加入队列等待
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject, config: originalRequest })
          })
        }

        isRefreshing = true

        try {
          const newToken = await userStore.refresh()

          if (newToken) {
            // 刷新成功，重试原请求
            processQueue(null, newToken)
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            return request(originalRequest)
          } else {
            // 刷新失败，跳转登录
            processQueue(error, null)
            userStore.clearLocal()
            if (window.location.pathname !== '/login') {
              ElMessage.error('登录已过期，请重新登录')
              window.location.href = '/login'
            }
            return Promise.reject(error)
          }
        } catch (refreshError) {
          processQueue(refreshError, null)
          userStore.clearLocal()
          if (window.location.pathname !== '/login') {
            ElMessage.error('登录已过期，请重新登录')
            window.location.href = '/login'
          }
          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      }

      // 非 Token 过期的 401 错误（如未提供 token）
      userStore.clearLocal()
      if (window.location.pathname !== '/login') {
        ElMessage.error('登录已过期，请重新登录')
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }

    ElMessage.error((error.response?.data as any)?.message || '请求失败')
    return Promise.reject(error)
  },
)

export default request
