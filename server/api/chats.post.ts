import { defineEventHandler, readValidatedBody } from 'h3'
import { DEFAULT_MODEL, modelSupportsImages } from '../utils/models'
import { checkDailyLimit } from '../utils/rateLimiter'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const { message, model, options: _options } = await readValidatedBody(event, z.object({
    message: UIMessageSchema,
    model: z.string().optional(),
    options: z.object({ thinkingMode: z.boolean().optional() }).optional()
  }).parse)

  // 非视觉模型拒绝图片
  const modelValue = model ?? DEFAULT_MODEL
  const hasImageParts = message.parts?.some(p => (p as { type: string }).type === 'file')
  if (hasImageParts && !modelSupportsImages(modelValue)) {
    throw createError({ statusCode: 400, statusMessage: '当前模型不支持图片输入' })
  }

  // Note: check-then-insert 非事务性，并发请求可能绕过限制
  await checkDailyLimit(user.id)

  const [chat] = await db.insert(schema.chats).values({
    userId: user.id,
    model: model ?? DEFAULT_MODEL
  }).returning()

  await db.insert(schema.messages).values({
    chatId: chat!.id,
    role: 'user',
    parts: Array.isArray(message.parts) ? message.parts : []
  })

  return chat
})
