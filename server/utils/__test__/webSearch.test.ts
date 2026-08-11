import { describe, it, expect, vi } from 'vitest'
import {
  extractUrlCitations,
  MIMO_WEB_SEARCH_TOOL,
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

describe('createMimoFetch', () => {
  it('should inject web_search tools when context is bound to AbortSignal', async () => {
    let capturedBody: string | undefined
    const baseFetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      capturedBody = typeof init?.body === 'string' ? init.body : undefined
      return new Response('{}', { status: 200 })
    }) as unknown as typeof globalThis.fetch

    const fetchFn = createMimoFetch(baseFetch)
    const signal = new AbortController().signal
    bindMimoRequestContext(signal, { webSearch: true, sources: [] })

    await fetchFn('https://api.xiaomimimo.com/v1/chat/completions', {
      method: 'POST',
      signal,
      body: JSON.stringify({ model: 'mimo-v2.5-pro', messages: [] })
    })

    expect(capturedBody).toBeDefined()
    const parsed = JSON.parse(capturedBody!)
    expect(parsed.tools).toEqual([MIMO_WEB_SEARCH_TOOL])
    expect(parsed.tool_choice).toBe('auto')
  })

  it('should not inject tools when webSearch is off', async () => {
    let capturedBody: string | undefined
    const baseFetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      capturedBody = typeof init?.body === 'string' ? init.body : undefined
      return new Response('{}', { status: 200 })
    }) as unknown as typeof globalThis.fetch

    const fetchFn = createMimoFetch(baseFetch)
    await fetchFn('https://api.xiaomimimo.com/v1/chat/completions', {
      method: 'POST',
      body: JSON.stringify({ model: 'mimo-v2.5-pro', messages: [] })
    })

    const parsed = JSON.parse(capturedBody!)
    expect(parsed.tools).toBeUndefined()
  })
})
