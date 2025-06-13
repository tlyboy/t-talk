import request from '@/utils/request'

export const register = (data: any): Promise<any> => {
  return request.post('/users', data)
}

export const login = (data: any): Promise<any> => {
  return request.post('/users/login', data)
}
