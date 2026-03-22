import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export interface StorageConfig {
  endpoint: string
  region: string
  bucket: string
  access_key_id: string
  secret_access_key: string
  public_url: string
  path_prefix: string
}

const STORAGE_KEY = 't-talk-storage-config'
let cachedClient: S3Client | null = null

export function getStorageConfig(): StorageConfig | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveStorageConfig(config: StorageConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  cachedClient = null
}

export function clearStorageCache() {
  cachedClient = null
}

function getS3Client(config: StorageConfig): S3Client {
  if (cachedClient) return cachedClient
  cachedClient = new S3Client({
    region: config.region || 'auto',
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.access_key_id,
      secretAccessKey: config.secret_access_key,
    },
    forcePathStyle: true,
  })
  return cachedClient
}

export async function uploadFile(path: string, file: File): Promise<string> {
  const config = getStorageConfig()
  if (!config) throw new Error('Storage not configured')

  const client = getS3Client(config)
  const fullPath = config.path_prefix ? `${config.path_prefix}/${path}` : path

  const ext = path.split('.').pop()?.toLowerCase() ?? ''
  const textMimeMap: Record<string, string> = {
    md: 'text/markdown',
    txt: 'text/plain',
    json: 'application/json',
    csv: 'text/csv',
    html: 'text/html',
    css: 'text/css',
    js: 'text/javascript',
    ts: 'text/typescript',
    xml: 'text/xml',
    svg: 'image/svg+xml',
    yaml: 'text/yaml',
    yml: 'text/yaml',
  }
  const mimeType = file.type || textMimeMap[ext] || 'application/octet-stream'
  const isText = mimeType.startsWith('text/') || mimeType === 'application/json'
  const contentType = isText ? `${mimeType}; charset=utf-8` : mimeType

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: fullPath,
    ContentType: contentType,
  })

  const presignedUrl = await getSignedUrl(client, command, { expiresIn: 600 })

  await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': contentType },
  })

  return `${config.public_url}/${fullPath}`
}

export async function uploadAvatar(userId: string, file: File) {
  const ext = file.name.split('.').pop() ?? 'webp'
  return uploadFile(`avatars/${userId}.${ext}`, file)
}

export async function uploadChatFile(chatId: number, file: File) {
  const uuid = crypto.randomUUID()
  const ext = file.name.split('.').pop() ?? 'bin'
  return uploadFile(`chat-files/${chatId}/${uuid}.${ext}`, file)
}
