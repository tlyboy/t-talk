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
