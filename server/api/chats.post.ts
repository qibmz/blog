import { defineEventHandler, readValidatedBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { DEFAULT_MODEL, modelSupportsImages } from '../utils/models'
import { checkDailyLimit } from '../utils/rateLimiter'
import { isUniqueViolation, raiseConflict } from '../utils/errors'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const { id, message, model, options: _options } = await readValidatedBody(event, z.object({
    // 客户端生成 UUID，用于乐观跳转
    id: z.string().uuid().optional(),
    message: UIMessageSchema,
    model: z.string().optional(),
    options: z.object({ thinkingMode: z.boolean().optional() }).optional()
  }).parse)

  // 非视觉模型拒绝图片
  const modelValue = model ?? DEFAULT_MODEL
  const hasImageParts = message.parts?.some(p => (p as { type: string }).type === 'file')
  if (hasImageParts && !(await modelSupportsImages(modelValue))) {
    throw createError({ statusCode: 400, statusMessage: '当前模型不支持图片输入' })
  }

  // Note: check-then-insert 非事务性，并发请求可能绕过限制
  await checkDailyLimit(user.id)

  try {
    const [chat] = await db.insert(schema.chats).values({
      ...(id ? { id } : {}),
      userId: user.id,
      model: model ?? DEFAULT_MODEL
    }).returning()
    if (!chat) {
      throw createError({ statusCode: 500, statusMessage: 'Failed to create chat' })
    }

    // neon-http 不支持 db.transaction；消息写入失败时补偿删除，避免留下空会话
    try {
      await db.insert(schema.messages).values({
        chatId: chat.id,
        role: 'user',
        parts: Array.isArray(message.parts) ? message.parts : []
      })
    } catch (err) {
      try {
        await db.delete(schema.chats).where(eq(schema.chats.id, chat.id))
      } catch (cleanupErr) {
        console.error('[chats.post] failed to cleanup orphan chat', chat.id, cleanupErr)
      }
      throw err
    }

    return chat
  } catch (err) {
    if (id && isUniqueViolation(err)) {
      throw raiseConflict('Chat already exists')
    }
    throw err
  }
})
