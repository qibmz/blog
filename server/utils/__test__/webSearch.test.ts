import { describe, it, expect, vi } from 'vitest'
import {
  extractUrlCitations,
  MIMO_WEB_SEARCH_TOOL,
  MIMO_WEB_SEARCH_FLAG,
  applyMimoWebSearchToRequestBody,
  createMimoFetch,
  bindMimoRequestContext
} from '../webSearch'

describe('extractUrlCitations', () => {
  it('should map url_citation annotations', () => {
    const sources = extractUrlCitations([
      {
        type: 'url_citation',
        url: 'https://example.com',
        title: 'Example',
        site_name: 'Example Site',
        summary: 'hello',
        publish_time: '2026-01-01',
        logo_url: 'https://example.com/logo.png'
      },
      { type: 'other' }
    ])

    expect(sources).toEqual([{
      url: 'https://example.com',
      title: 'Example',
      summary: 'hello',
      siteName: 'Example Site',
      publishTime: '2026-01-01',
      logoUrl: 'https://example.com/logo.png'
    }])
  })

  it('should return empty for null/undefined/non-array', () => {
    expect(extractUrlCitations(null)).toEqual([])
    expect(extractUrlCitations(undefined)).toEqual([])
    expect(extractUrlCitations({})).toEqual([])
  })
})

describe('applyMimoWebSearchToRequestBody', () => {
  it('should inject web_search tools when flag is set', () => {
    const result = applyMimoWebSearchToRequestBody({
      model: 'mimo-v2.5-pro',
      [MIMO_WEB_SEARCH_FLAG]: true
    })

    expect(result.tools).toEqual([MIMO_WEB_SEARCH_TOOL])
    expect(result.tool_choice).toBe('auto')
    expect(result[MIMO_WEB_SEARCH_FLAG]).toBeUndefined()
  })

  it('should not inject tools when flag is absent', () => {
    const result = applyMimoWebSearchToRequestBody({
      model: 'mimo-v2.5-pro'
    })

    expect(result.tools).toBeUndefined()
  })
})

describe('createMimoFetch', () => {
  it('should capture sources when web search context is bound', async () => {
    const sse = [
      'data: {"choices":[{"delta":{"annotations":[{"type":"url_citation","url":"https://a.com","title":"A","site_name":"Site"}]}}]}\n\n',
      'data: [DONE]\n\n'
    ].join('')

    const baseFetch = vi.fn(async () =>
      new Response(sse, { status: 200, headers: { 'content-type': 'text/event-stream' } })
    ) as unknown as typeof globalThis.fetch

    const fetchFn = createMimoFetch(baseFetch)
    const signal = new AbortController().signal
    const ctx = { webSearch: true, sources: [] as { url: string }[] }
    bindMimoRequestContext(signal, ctx)

    const res = await fetchFn('https://api.xiaomimimo.com/v1/chat/completions', {
      method: 'POST',
      signal,
      body: JSON.stringify({
        model: 'mimo-v2.5-pro',
        tools: [MIMO_WEB_SEARCH_TOOL]
      })
    })
    await res.text()
    await ctx.sourcesReady

    expect(ctx.sources).toEqual([{
      url: 'https://a.com',
      title: 'A',
      summary: undefined,
      siteName: 'Site',
      publishTime: undefined,
      logoUrl: undefined
    }])
  })
})
