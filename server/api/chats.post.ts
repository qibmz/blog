import { defineEventHandler, readValidatedBody } from 'h3'
import { DEFAULT_MODEL } from '../utils/models'
import { checkDailyLimit } from '../utils/rateLimiter'
import { z } from 'zod'
import type { UIMessage } from 'ai'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const { message, model } = await readValidatedBody(event, z.object({
    message: z.custom<UIMessage>(),
    model: z.string().optional()
  }).parse)

  await checkDailyLimit(user.id)

  const [chat] = await db.insert(schema.chats).values({
    userId: user.id,
    model: model ?? DEFAULT_MODEL
  }).returning()

  await db.insert(schema.messages).values({
    chatId: chat!.id,
    role: 'user',
    parts: message.parts as Record<string, unknown>[]
  })

  return chat
})
