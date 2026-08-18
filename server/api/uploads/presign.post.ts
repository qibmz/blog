import { defineEventHandler, readValidatedBody, createError } from 'h3'
import { z } from 'zod'
import {
  createPresignedUpload,
  extensionForMime,
  isChatImageMimeType,
  MAX_CHAT_IMAGE_BYTES,
  publicUrlForKey
} from '../../utils/r2'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const { contentType, contentLength, filename } = await readValidatedBody(event, z.object({
    contentType: z.string().min(1),
    contentLength: z.number().int().positive().max(MAX_CHAT_IMAGE_BYTES),
    filename: z.string().optional()
  }).parse)

  if (!isChatImageMimeType(contentType)) {
    throw createError({ statusCode: 400, statusMessage: '不支持的图片类型' })
  }

  const key = `chat/${user.id}/${crypto.randomUUID()}${extensionForMime(contentType)}`
  const uploadUrl = await createPresignedUpload({ key, contentType, contentLength })
  const publicUrl = publicUrlForKey(key)

  return {
    uploadUrl,
    publicUrl,
    key,
    contentLength,
    ...(filename ? { filename } : {})
  }
})
