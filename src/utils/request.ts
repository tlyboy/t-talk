import axios from 'axios'

const request = axios.create({})

// 添加请求拦截器
request.interceptors.request.use(
  function (config) {
    // 在发送请求之前做些什么

    const settingsStore = useSettingsStore()

    config.baseURL = settingsStore.settings.url

    const userStore = useUserStore()

    if (userStore.user.token) {
      config.headers.Authorization = `Bearer ${userStore.user.token}`
    }

    return config
  },
  function (error) {
    // 对请求错误做些什么
    return Promise.reject(error)
  },
)

// 添加响应拦截器
request.interceptors.response.use(
  function (response) {
    // 2xx 范围内的状态码都会触发该函数。
    // 对响应数据做点什么
    return response.data
  },
  function (error) {
    // 超出 2xx 范围的状态码都会触发该函数。
    // 对响应错误做点什么

    ElMessage.error(error.response.data.message)

    return Promise.reject(error)
  },
)

export default request
