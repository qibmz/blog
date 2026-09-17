import { createError, defineEventHandler, getValidatedRouterParams, readValidatedBody } from 'h3'
import { and, asc, eq } from 'drizzle-orm'
import {
  getModel,
  PREFERRED_DEFAULT_MODEL,
  modelSupportsCustomTools,
  modelSupportsImages,
  modelSupportsThinking,
  modelSupportsWebSearch
} from '../../utils/models'
import { chartTool } from '#shared/utils/tools/chart'
import { checkDailyLimit } from '../../utils/rateLimiter'
import { getRequestAbortSignal } from '../../utils/requestAbort'
import { assertAllowedChatFileUrls } from '../../utils/r2'
import {
  awaitMimoSources,
  bindMimoRequestContext,
  MIMO_WEB_SEARCH_FLAG,
  withWebSearchSources,
  type ChatSource
} from '../../utils/webSearch'
import { getProvisionalChatTitle } from '#shared/utils/chatTitle'
import { z } from 'zod'
import {
  consumeStream,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateText,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage
} from 'ai'

function hasPersistableParts(parts: UIMessage['parts'] | undefined) {
  if (!Array.isArray(parts) || parts.length === 0) return false
  return parts.some((part) => {
    if (part.type === 'text' || part.type === 'reasoning') {
      return Boolean(part.text?.trim())
    }
    return part.type !== 'step-start'
  })
}

function toUIMessage(row: {
  id: string
  role: 'user' | 'assistant' | 'system'
  parts: Record<string, unknown>[] | null
}): UIMessage {
  return {
    id: row.id,
    role: row.role,
    parts: (Array.isArray(row.parts) ? row.parts : []) as UIMessage['parts']
  }
}

type LoosePart = { type?: string, text?: string, url?: string, mediaType?: string }

/** 只比语义字段，避免 JSON 键序 / 可选字段导致误判「未落库」 */
function normalizeUserPartsForCompare(
  parts: UIMessage['parts'] | Record<string, unknown>[] | null | undefined
) {
  if (!Array.isArray(parts)) return []
  return parts.map((raw) => {
    const p = raw as LoosePart
    if (p.type === 'text') return { type: 'text', text: p.text ?? '' }
    if (p.type === 'file') {
      return { type: 'file', url: p.url ?? '', mediaType: p.mediaType ?? '' }
    }
    return { type: String(p.type ?? '') }
  })
}

function isSameUserParts(
  a: UIMessage['parts'] | Record<string, unknown>[] | null | undefined,
  b: UIMessage['parts'] | Record<string, unknown>[] | null | undefined
) {
  return JSON.stringify(normalizeUserPartsForCompare(a))
    === JSON.stringify(normalizeUserPartsForCompare(b))
}

function historyHasFileParts(messages: UIMessage[]) {
  return messages.some(msg =>
    msg.parts?.some(p => (p as { type: string }).type === 'file')
  )
}

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string()
  }).parse)

  const {
    model: modelValue = PREFERRED_DEFAULT_MODEL,
    message,
    trigger,
    options
  } = await readValidatedBody(event, PostChatBodySchema.parse)

  const chat = await db.query.chats.findFirst({
    where: and(eq(schema.chats.id, id), eq(schema.chats.userId, user.id)),
    with: {
      messages: {
        orderBy: () => asc(schema.messages.createdAt)
      }
    }
  })

  if (!chat) {
    throw raiseNotFound('Chat not found')
  }

  let history = (chat.messages ?? []).map(toUIMessage)

  if (trigger === 'regenerate-message') {
    // 去掉末尾助手消息再重生成；计一次提问
    await checkDailyLimit(user.id)
    while (history.at(-1)?.role === 'assistant') {
      const last = history.pop()!
      await db.delete(schema.messages).where(eq(schema.messages.id, last.id))
    }
    if (history.at(-1)?.role !== 'user') {
      throw createError({ statusCode: 400, statusMessage: '没有可重新生成的用户消息' })
    }
  } else {
    // submit-message：以 body.message 为本轮用户输入
    const incoming = message!
    assertAllowedChatFileUrls(incoming.parts)

    const lastDb = history.at(-1)

    if (lastDb?.role === 'user') {
      // 末条仍是 user：等待助手中，禁止再插一条。语义不同则更新末条（中断后改写）
      if (!isSameUserParts(lastDb.parts, incoming.parts)) {
        const nextParts = Array.isArray(incoming.parts) ? incoming.parts : []
        assertAllowedChatFileUrls(nextParts)
        await db.update(schema.messages)
          .set({ parts: nextParts })
          .where(eq(schema.messages.id, lastDb.id))
        history = [
          ...history.slice(0, -1),
          {
            id: lastDb.id,
            role: 'user',
            parts: nextParts as UIMessage['parts']
          }
        ]
      }
    } else {
      // 末条是 assistant / 空会话：新一轮 user
      if (history.length > 0) {
        await checkDailyLimit(user.id)
      }
      await db.insert(schema.messages).values({
        chatId: id,
        role: 'user',
        parts: Array.isArray(incoming.parts) ? incoming.parts : []
      })
      history = [
        ...history,
        {
          id: incoming.id,
          role: 'user' as const,
          parts: (Array.isArray(incoming.parts) ? incoming.parts : []) as UIMessage['parts']
        }
      ]
    }
  }

  if (history.length === 0 || history.at(-1)?.role !== 'user') {
    throw createError({ statusCode: 400, statusMessage: '对话上下文无效' })
  }

  // 整段历史（含 regenerate）只要有图，就必须是视觉模型
  if (historyHasFileParts(history) && !(await modelSupportsImages(modelValue))) {
    throw createError({ statusCode: 400, statusMessage: '当前模型不支持图片输入' })
  }

  const model = getModel(modelValue)

  // 首轮：仅有一条 user 时补临时标题并异步精炼
  const userTurns = history.filter(m => m.role === 'user')
  const assistantTurns = history.filter(m => m.role === 'assistant')
  if (userTurns.length === 1 && assistantTurns.length === 0) {
    const firstUser = userTurns[0]!
    const firstParts = firstUser.parts ?? []
    const textParts = firstParts.filter(p => p.type === 'text') as { type: 'text', text: string }[]
    const userText = textParts.map(p => p.text).join(' ').trim()
    const provisionalTitle = getProvisionalChatTitle(firstParts as Array<{ type: string, text?: string }>)

    if (!chat.title) {
      await db.update(schema.chats)
        .set({ title: provisionalTitle, model: modelValue })
        .where(eq(schema.chats.id, id))
    }

    const alreadyRefined = Boolean(chat.title && chat.title !== provisionalTitle)
    if (userText && !alreadyRefined) {
      const titlePromise = generateText({
        model,
        instructions: '根据用户的第一条消息生成一个简短标题（最多15个字，不加标点和引号）。',
        prompt: JSON.stringify(firstUser)
      }).then(async ({ text: title }) => {
        const safeTitle = title.trim()
          ? (title.length > 20 ? title.slice(0, 20) : title)
          : provisionalTitle
        await db.update(schema.chats)
          .set({ title: safeTitle, model: modelValue })
          .where(eq(schema.chats.id, id))
        return safeTitle
      }).catch((err) => {
        console.error('Failed to generate chat title:', err)
        return null
      })
      event.waitUntil?.(titlePromise)
    }
  }

  // MiMo 官方建议：调用 tool（含 web_search）时关闭 thinking，否则易卡顿且不稳定
  const webSearchEnabled = options?.webSearch === true
    && await modelSupportsWebSearch(modelValue)

  const canThink = await modelSupportsThinking(modelValue)
  const thinkingType = canThink
    && options?.thinkingMode !== false
    && !webSearchEnabled
    ? 'enabled' as const
    : 'disabled' as const

  const tools = modelSupportsCustomTools(modelValue)
    ? { chart: chartTool }
    : undefined

  const abortSignal = getRequestAbortSignal(event)
  const mimoCtx = { webSearch: webSearchEnabled, sources: [] as ChatSource[] }
  bindMimoRequestContext(abortSignal, mimoCtx)

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const result = streamText({
        model,
        instructions: `你是迦勒底的人工智能助手。回答友好、简洁、有帮助；语气可轻度带有《Fate/Grand Order》风格（如称呼用户为 Master、偶尔用「契约」「灵基」等轻松比喻），但不要过度角色扮演，也不要强行把无关问题硬扯到 FGO。优先把问题讲清楚。

用户要求画图、看趋势、对比或占比时，调用 chart 工具，不要只用 markdown 表格代替。`,
        messages: await convertToModelMessages(history, tools ? { tools } : undefined),
        abortSignal,
        ...(tools ? { tools, stopWhen: isStepCount(5) } : {}),
        providerOptions: {
          deepseek: {
            thinking: { type: thinkingType }
          },
          mimo: {
            thinking: { type: thinkingType },
            ...(webSearchEnabled ? { [MIMO_WEB_SEARCH_FLAG]: true } : {})
          }
        }
      })

      // finish 前注入 data-sources，客户端即时可见（勿只靠落库后 refresh）
      // 独立 toUIMessageStream + result.stream（实例方法已弃用）；传 tools 才能带上 tool parts
      writer.merge(withWebSearchSources(
        toUIMessageStream({
          stream: result.stream,
          ...(tools ? { tools } : {}),
          sendReasoning: true
        }),
        () => awaitMimoSources(mimoCtx)
      ))
    },
    onEnd: async ({ responseMessage, isAborted }) => {
      let parts = Array.isArray(responseMessage.parts) ? [...responseMessage.parts] : []
      // 中断且无实质内容时不落库，避免空助手消息；有半截内容则保留
      if (isAborted && !hasPersistableParts(parts)) return

      const sources = await awaitMimoSources(mimoCtx)

      // 流里已是 data-sources；落库统一成 type: 'sources'，兼容刷新后读取
      const withoutStreamSources = parts.filter(p => (p as { type: string }).type !== 'data-sources')
      if (sources.length > 0) {
        parts = [
          ...withoutStreamSources,
          { type: 'sources', sources } as unknown as UIMessage['parts'][number]
        ]
      } else {
        parts = withoutStreamSources
      }

      try {
        await db.insert(schema.messages).values({
          chatId: chat.id,
          role: responseMessage.role as 'user' | 'assistant',
          parts
        })
      } catch (err) {
        // 流已开始，落库失败不能变成未处理 rejection
        console.error('Failed to persist assistant message:', err)
      }
    }
  })

  return createUIMessageStreamResponse({
    stream,
    // 确保客户端 abort 时 onEnd 仍会执行（含 isAborted）
    consumeSseStream: consumeStream
  })
})
