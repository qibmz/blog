import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createError } from 'h3'

export const CHAT_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp'
] as const

export type ChatImageMimeType = (typeof CHAT_IMAGE_MIME_TYPES)[number]

/** 与前端 useChatFileUpload 一致 */
export const MAX_CHAT_IMAGE_BYTES = 5 * 1024 * 1024

const MIME_TO_EXT: Record<ChatImageMimeType, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/bmp': '.bmp'
}

const PRESIGN_EXPIRES_SECONDS = 120

let _client: S3Client | null = null

function getR2Config() {
  const config = useRuntimeConfig()
  const accountId = String(config.r2AccountId || '')
  const accessKeyId = String(config.r2AccessKeyId || '')
  const secretAccessKey = String(config.r2SecretAccessKey || '')
  const bucketName = String(config.r2BucketName || '')
  const publicBaseUrl = String(config.r2PublicBaseUrl || 'https://img.qibmz.com').replace(/\/$/, '')

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw createError({
      statusCode: 500,
      statusMessage: 'R2 未配置：请设置 R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME'
    })
  }

  return { accountId, accessKeyId, secretAccessKey, bucketName, publicBaseUrl }
}

function getS3Client() {
  if (_client) return _client
  const { accountId, accessKeyId, secretAccessKey } = getR2Config()
  _client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    // 浏览器直传不需要柔性校验和；否则预签名会带 x-amz-checksum-*，CORS 预检失败
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED'
  })
  return _client
}

export function isChatImageMimeType(value: string): value is ChatImageMimeType {
  return (CHAT_IMAGE_MIME_TYPES as readonly string[]).includes(value)
}

export function extensionForMime(contentType: ChatImageMimeType): string {
  return MIME_TO_EXT[contentType]
}

export function publicUrlForKey(key: string): string {
  const { publicBaseUrl } = getR2Config()
  return `${publicBaseUrl}/${key.replace(/^\//, '')}`
}

/** URL 白名单只需公开读基址，不要求完整 R2 密钥 */
export function getR2PublicBaseUrl(): string {
  const config = useRuntimeConfig()
  return String(config.r2PublicBaseUrl || 'https://img.qibmz.com').replace(/\/$/, '')
}

export async function createPresignedUpload(params: {
  key: string
  contentType: ChatImageMimeType
  contentLength: number
}): Promise<string> {
  const { bucketName } = getR2Config()
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: params.key,
    ContentType: params.contentType,
    ContentLength: params.contentLength
  })
  return getSignedUrl(getS3Client(), command, { expiresIn: PRESIGN_EXPIRES_SECONDS })
}

/**
 * 校验即将落库的 file part URL。
 * 新写入只允许 R2 公开域；不再接受 data:（旧库中的 data: 历史消息仍可被 GET 读出展示）。
 */
export function assertAllowedChatFileUrls(parts: unknown[] | undefined) {
  if (!Array.isArray(parts)) return

  const fileParts = parts.filter((part): part is { type: string, url?: string } =>
    Boolean(part && typeof part === 'object' && (part as { type?: string }).type === 'file')
  )
  if (fileParts.length === 0) return

  const publicBaseUrl = getR2PublicBaseUrl()

  for (const p of fileParts) {
    const url = typeof p.url === 'string' ? p.url : ''
    if (publicBaseUrl && (url === publicBaseUrl || url.startsWith(`${publicBaseUrl}/`))) continue
    throw createError({ statusCode: 400, statusMessage: '非法图片地址' })
  }
}
