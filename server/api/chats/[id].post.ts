import { defineEventHandler, getValidatedRouterParams, readValidatedBody } from 'h3'
import { and, eq } from 'drizzle-orm'
import { db, schema } from '../../db'
import { getModel, DEFAULT_MODEL } from '../../utils/models'
import { checkDailyLimit } from '../../utils/rateLimiter'
import { z } from 'zod'
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateText,
  streamText
} from 'ai'
import type { UIMessage } from 'ai'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string()
  }).parse)

  const { model: modelValue = DEFAULT_MODEL, messages } = await readValidatedBody(event, z.object({
    model: z.string().optional(),
    messages: z.array(z.custom<UIMessage>())
  }).parse)

  const chat = await db.query.chats.findFirst({
    where: and(eq(schema.chats.id, id), eq(schema.chats.userId, user.id))
  })

  if (!chat) {
    throw raiseNotFound('Chat not found')
  }

  const model = getModel(modelValue)

  // 首次对话自动生成标题（不阻塞数据流，通过 waitUntil 确保在 serverless 环境完整执行）
  if (!chat.title) {
    const titlePromise = generateText({
      model,
      system: '根据用户的第一条消息生成一个简短标题（最多15个字，不加标点和引号）。',
      prompt: JSON.stringify(messages[0])
    }).then(async ({ text: title }) => {
      await db.update(schema.chats)
        .set({ title, model: modelValue })
        .where(eq(schema.chats.id, id))
    }).catch((err) => {
      console.error('Failed to generate chat title:', err)
    })
    event.waitUntil?.(titlePromise)
  }

  // 后续对话才检查限制（首次消息已在 chats.post.ts 中计数）并保存用户消息
  const lastMessage = messages[messages.length - 1]
  if (lastMessage?.role === 'user' && messages.length > 1) {
    await checkDailyLimit(user.id)
    await db.insert(schema.messages).values({
      chatId: id,
      role: 'user',
      parts: lastMessage.parts as Record<string, unknown>[]
    })
  }

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const result = streamText({
        model,
        system: '你是一个友好、简洁的 AI 助手。',
        messages: await convertToModelMessages(messages)
      })

      if (!chat.title) {
        writer.write({
          type: 'data-chat-title',
          data: { message: 'Title generated' },
          transient: true
        })
      }

      writer.merge(result.toUIMessageStream())
    },
    onFinish: async ({ messages: finishedMessages }) => {
      await db.insert(schema.messages).values(
        finishedMessages.map(msg => ({
          chatId: chat.id,
          role: msg.role as 'user' | 'assistant',
          parts: msg.parts as Record<string, unknown>[]
        }))
      )
    }
  })

  return createUIMessageStreamResponse({ stream })
})
