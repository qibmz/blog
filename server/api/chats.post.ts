import { defineEventHandler, readValidatedBody } from 'h3'
import { DEFAULT_MODEL } from '../utils/models'
import { checkDailyLimit } from '../utils/rateLimiter'
import { UIMessageSchema } from '../utils/zod-schemas'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const { message, model, options: _options } = await readValidatedBody(event, z.object({
    message: UIMessageSchema,
    model: z.string().optional(),
    options: z.object({ thinkingMode: z.boolean().optional() }).optional()
  }).parse)

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
