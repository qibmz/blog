/**
 * MiMo 联网搜索：通过 transformRequestBody / 自定义 fetch 注入 tools。
 * （openai-compatible 会把顶层 tools 写成 undefined，不能只靠 streamText tools）
 * @see https://mimo.mi.com/docs/zh-CN/quick-start/usage-guide/text-generation/tool-calling/web-search
 */

export interface ChatSource {
  url: string
  title?: string
  summary?: string
  siteName?: string
  publishTime?: string
  logoUrl?: string
}

export interface MimoRequestContext {
  webSearch?: boolean
  sources?: ChatSource[]
  /** onFinish 前 await，确保 SSE 解析完成 */
  sourcesReady?: Promise<void>
}

/** 按 AbortSignal 绑定请求上下文（streamText 会把 signal 传到 fetch） */
const mimoContextBySignal = new WeakMap<AbortSignal, MimoRequestContext>()

/** 并发兜底：同一 isolate 内最近一次请求上下文（transformRequestBody 用） */
let activeMimoCtx: MimoRequestContext | null = null

export function bindMimoRequestContext(signal: AbortSignal | undefined, ctx: MimoRequestContext) {
  activeMimoCtx = ctx
  if (signal) mimoContextBySignal.set(signal, ctx)
}

export function getMimoRequestContext(signal?: AbortSignal | null): MimoRequestContext | undefined {
  if (signal) {
    const bySignal = mimoContextBySignal.get(signal)
    if (bySignal) return bySignal
  }
  return activeMimoCtx ?? undefined
}

export const MIMO_WEB_SEARCH_TOOL = {
  type: 'web_search' as const,
  // 用户主动打开开关时强制搜索，避免意图识别判定「无需联网」导致无 annotations
  force_search: true,
  max_keyword: 3,
  limit: 5
}

/** 写入 providerOptions.mimo，供 transformRequestBody 转成 tools */
export const MIMO_WEB_SEARCH_FLAG = 'x_web_search' as const

export function applyMimoWebSearchToRequestBody(args: Record<string, unknown>): Record<string, unknown> {
  const enabled = Boolean(args[MIMO_WEB_SEARCH_FLAG])
  const { [MIMO_WEB_SEARCH_FLAG]: _flag, ...rest } = args
  if (!enabled) return rest

  return {
    ...rest,
    tools: [MIMO_WEB_SEARCH_TOOL],
    tool_choice: 'auto'
  }
}

export function extractUrlCitations(annotations: unknown): ChatSource[] {
  if (!Array.isArray(annotations)) return []
  return annotations
    .filter((a): a is Record<string, unknown> =>
      Boolean(a) && typeof a === 'object' && (a as { type?: string }).type === 'url_citation'
    )
    .map(a => ({
      url: String(a.url ?? ''),
      title: typeof a.title === 'string' ? a.title : undefined,
      summary: typeof a.summary === 'string' ? a.summary : undefined,
      siteName: typeof a.site_name === 'string' ? a.site_name : undefined,
      publishTime: typeof a.publish_time === 'string' ? a.publish_time : undefined,
      logoUrl: typeof a.logo_url === 'string' ? a.logo_url : undefined
    }))
    .filter(s => s.url.length > 0)
}

function collectAnnotationsFromPayload(payload: unknown, out: ChatSource[]) {
  if (!payload || typeof payload !== 'object') return
  const obj = payload as Record<string, unknown>

  if (Array.isArray(obj.annotations)) {
    out.push(...extractUrlCitations(obj.annotations))
  }

  const choice = Array.isArray(obj.choices) ? obj.choices[0] as Record<string, unknown> | undefined : undefined
  if (choice) {
    const message = choice.message as Record<string, unknown> | undefined
    const delta = choice.delta as Record<string, unknown> | undefined
    if (message?.annotations) out.push(...extractUrlCitations(message.annotations))
    if (delta?.annotations) out.push(...extractUrlCitations(delta.annotations))
  }
}

function requestBodyHasWebSearch(init?: RequestInit): boolean {
  if (!init?.body || typeof init.body !== 'string') return false
  try {
    const body = JSON.parse(init.body) as { tools?: Array<{ type?: string }> }
    return Array.isArray(body.tools) && body.tools.some(t => t?.type === 'web_search')
  } catch {
    return false
  }
}

/** 从 SSE / JSON 响应中尽量提取 url_citation，写入 context.sources */
async function captureSourcesFromBody(body: ReadableStream<Uint8Array>, ctx: MimoRequestContext) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  const found: ChatSource[] = []

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const data = trimmed.slice(5).trim()
        if (!data || data === '[DONE]') continue
        try {
          collectAnnotationsFromPayload(JSON.parse(data), found)
        } catch {
          // ignore partial JSON
        }
      }
    }

    if (found.length === 0 && buffer.trim()) {
      try {
        collectAnnotationsFromPayload(JSON.parse(buffer), found)
      } catch {
        // ignore
      }
    }
  } catch {
    // 解析失败不影响主流程
  }

  if (found.length > 0) {
    const seen = new Set<string>()
    ctx.sources = found.filter((s) => {
      if (seen.has(s.url)) return false
      seen.add(s.url)
      return true
    })
  }
}

export function createMimoFetch(baseFetch: typeof globalThis.fetch = globalThis.fetch): typeof globalThis.fetch {
  return async (input, init) => {
    const ctx = getMimoRequestContext(init?.signal ?? undefined)
    const shouldCapture = Boolean(ctx?.webSearch) || requestBodyHasWebSearch(init)

    const response = await baseFetch(input, init)

    if (shouldCapture && ctx && response.body) {
      const [forClient, forParse] = response.body.tee()
      ctx.sourcesReady = captureSourcesFromBody(forParse, ctx)
      return new Response(forClient, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      })
    }

    return response
  }
}
