import { uploadFile, type UploadResult } from '@/api/upload'

// 文件大小限制
const MAX_MEDIA_SIZE = 50 * 1024 * 1024 // 50MB (图片/视频)
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB (其他文件)

export function useUpload() {
  const uploading = ref(false)
  const progress = ref(0)

  // 判断是否为媒体文件（图片/视频）
  const isMedia = (file: File): boolean => {
    return file.type.startsWith('image/') || file.type.startsWith('video/')
  }

  // 验证文件
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const maxSize = isMedia(file) ? MAX_MEDIA_SIZE : MAX_FILE_SIZE
    if (file.size > maxSize) {
      return { valid: false, error: `文件大小超过限制 (最大 ${maxSize / 1024 / 1024}MB)` }
    }
    return { valid: true }
  }

  // 判断是否为图片
  const isImage = (file: File): boolean => {
    return file.type.startsWith('image/')
  }

  // 上传文件
  const upload = async (file: File): Promise<UploadResult | null> => {
    const validation = validateFile(file)
    if (!validation.valid) {
      ElMessage.error(validation.error!)
      return null
    }

    uploading.value = true
    progress.value = 0

    try {
      const result = await uploadFile(file, (percent) => {
        progress.value = percent
      })
      return result
    } catch (error: any) {
      ElMessage.error(error.response?.data?.message || '上传失败')
      return null
    } finally {
      uploading.value = false
      progress.value = 0
    }
  }

  // 转换为 Markdown/HTML 格式
  const toMarkdown = (result: UploadResult): string => {
    const { mimeType, url, originalName } = result

    // 图片：使用 markdown 图片语法
    if (mimeType.startsWith('image/')) {
      return `![${originalName}](${url})`
    }

    // 视频：使用 HTML video 标签
    if (mimeType.startsWith('video/')) {
      return `<video src="${url}" controls style="max-width: 100%; max-height: 400px;"></video>`
    }

    // 音频：使用 HTML audio 标签
    if (mimeType.startsWith('audio/')) {
      return `<audio src="${url}" controls></audio>`
    }

    // 其他文件：使用 markdown 链接
    return `[${originalName}](${url})`
  }

  // 上传并返回 Markdown
  const uploadAndGetMarkdown = async (file: File): Promise<string | null> => {
    const result = await upload(file)
    if (result) {
      return toMarkdown(result)
    }
    return null
  }

  return {
    uploading,
    progress,
    validateFile,
    isMedia,
    isImage,
    upload,
    toMarkdown,
    uploadAndGetMarkdown,
  }
}
