import request from '@/utils/request'

export const register = (data: any): Promise<any> => {
  return request.post('/user/register', data)
}

export const login = (data: any): Promise<any> => {
  return request.post('/user/login', data)
}

export const getUserList = (): Promise<any> => {
  return request.get('/user/list')
}

export const updateNickname = (nickname: string): Promise<any> => {
  return request.put('/user/nickname', { nickname })
}

// 刷新 Token
export const refreshToken = (data: { refreshToken: string }): Promise<any> => {
  return request.post('/user/refresh', data)
}

// 登出
export const logout = (data: { refreshToken?: string; logoutAll?: boolean }): Promise<any> => {
  return request.post('/user/logout', data)
}
