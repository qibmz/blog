/**
 * MiMo 联网搜索：通过自定义 fetch 注入 tools（openai-compatible 会用 undefined 覆盖顶层 tools）。
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

export function bindMimoRequestContext(signal: AbortSignal | undefined, ctx: MimoRequestContext) {
  if (signal) mimoContextBySignal.set(signal, ctx)
}

export function getMimoRequestContext(signal?: AbortSignal | null): MimoRequestContext | undefined {
  if (signal) return mimoContextBySignal.get(signal)
  return undefined
}

export const MIMO_WEB_SEARCH_TOOL = {
  type: 'web_search' as const,
  force_search: false,
  max_keyword: 3,
  limit: 5
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
    let nextInit = init

    if (ctx?.webSearch && init?.body && typeof init.body === 'string') {
      try {
        const body = JSON.parse(init.body) as Record<string, unknown>
        body.tools = [MIMO_WEB_SEARCH_TOOL]
        body.tool_choice = 'auto'
        nextInit = { ...init, body: JSON.stringify(body) }
      } catch {
        nextInit = init
      }
    }

    const response = await baseFetch(input, nextInit)

    if (ctx?.webSearch && response.body) {
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
