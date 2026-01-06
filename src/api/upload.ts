import request from '@/utils/request'

export interface UploadResult {
  url: string
  filename: string
  originalName: string
  size: number
  mimeType: string
}

// 上传文件
export const uploadFile = (
  file: File,
  onProgress?: (percent: number) => void,
): Promise<UploadResult> => {
  const formData = new FormData()
  formData.append('file', file)

  return request.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total,
        )
        onProgress(percent)
      }
    },
  })
}

// 更新用户头像
export const updateAvatar = (
  avatar: string,
): Promise<{ success: boolean; avatar: string }> => {
  return request.put('/user/avatar', { avatar })
}
