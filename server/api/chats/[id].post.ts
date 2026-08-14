import { defineEventHandler, getValidatedRouterParams, readValidatedBody } from 'h3'
import { and, eq } from 'drizzle-orm'
import {
  getModel,
  DEFAULT_MODEL,
  modelSupportsCustomTools,
  modelSupportsImages,
  modelSupportsThinking,
  modelSupportsWebSearch
} from '../../utils/models'
import { chartTool } from '#shared/utils/tools/chart'
import { checkDailyLimit } from '../../utils/rateLimiter'
import { getRequestAbortSignal } from '../../utils/requestAbort'
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

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string()
  }).parse)

  const { model: modelValue = DEFAULT_MODEL, messages, options } = await readValidatedBody(event, z.object({
    model: z.string().optional(),
    messages: z.array(UIMessageSchema),
    options: z.object({
      thinkingMode: z.boolean().optional(),
      webSearch: z.boolean().optional()
    }).optional()
  }).parse)

  // 非视觉模型拒绝图片
  const hasImageParts = messages.some(msg =>
    msg.parts?.some(p => (p as { type: string }).type === 'file')
  )
  if (hasImageParts && !(await modelSupportsImages(modelValue))) {
    throw createError({ statusCode: 400, statusMessage: '当前模型不支持图片输入' })
  }

  const chat = await db.query.chats.findFirst({
    where: and(eq(schema.chats.id, id), eq(schema.chats.userId, user.id))
  })

  if (!chat) {
    throw raiseNotFound('Chat not found')
  }

  const model = getModel(modelValue)

  // 首轮对话：确保有临时标题，并在有文字时异步精炼（不阻塞流式）
  if (messages.length === 1) {
    const firstParts = messages[0]!.parts ?? []
    const textParts = firstParts.filter(p => p.type === 'text') as { type: 'text', text: string }[]
    const userText = textParts.map(p => p.text).join(' ').trim()
    const provisionalTitle = getProvisionalChatTitle(firstParts as Array<{ type: string, text?: string }>)

    // 创建接口若未写入 title（或旧数据），这里补上临时标题
    if (!chat.title) {
      await db.update(schema.chats)
        .set({ title: provisionalTitle, model: modelValue })
        .where(eq(schema.chats.id, id))
    }

    // 有文字且尚未精炼过（title 仍为空或仍是临时截取）时异步精炼
    const alreadyRefined = Boolean(chat.title && chat.title !== provisionalTitle)
    if (userText && !alreadyRefined) {
      const titlePromise = generateText({
        model,
        instructions: '根据用户的第一条消息生成一个简短标题（最多15个字，不加标点和引号）。',
        prompt: JSON.stringify(messages[0])
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

  // 后续对话才检查限制（首次消息已在 chats.post.ts 中计数）并保存用户消息
  const lastMessage = messages[messages.length - 1]
  if (lastMessage?.role === 'user' && messages.length > 1) {
    // Note: check-then-insert 非事务性，并发请求可能绕过限制
    await checkDailyLimit(user.id)
    await db.insert(schema.messages).values({
      chatId: id,
      role: 'user',
      parts: Array.isArray(lastMessage.parts) ? lastMessage.parts : []
    })
  }

  // MiMo 官方建议：调用 tool（含 web_search）时关闭 thinking，否则易卡顿且不稳定
  const webSearchEnabled = options?.webSearch === true
    && await modelSupportsWebSearch(modelValue)

  const canThink = modelSupportsThinking(modelValue)
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

**图表：**
- 用户要求画图、看趋势、对比数据或占比时，调用 chart 工具
- type 按场景选择：趋势用 line/area，分类对比用 bar，占比构成用 donut
- donut 每个扇区用不同颜色（data.color 或多样 series.color）
- 不要只用 markdown 表格代替可视化`,
        messages: await convertToModelMessages(messages as UIMessage[], tools ? { tools } : undefined),
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
      // 使用 result.toUIMessageStream()：会带上 tools，且与 createUIMessageStream.merge 兼容
      writer.merge(withWebSearchSources(
        result.toUIMessageStream({ sendReasoning: true }),
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
