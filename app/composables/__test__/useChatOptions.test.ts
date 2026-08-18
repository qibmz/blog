import { beforeEach, describe, expect, it, vi } from 'vitest'

const cookieStore = new Map<string, { value: boolean }>()

vi.stubGlobal('useCookie', (name: string, opts?: {
  default?: () => boolean
  decode?: (v: string) => boolean
  encode?: (v: boolean) => string
}) => {
  if (!cookieStore.has(name)) {
    cookieStore.set(name, { value: opts?.default?.() ?? false })
  }
  return cookieStore.get(name)!
})

describe('useChatOptions', () => {
  beforeEach(() => {
    cookieStore.clear()
    vi.resetModules()
  })

  it('should turn off web search when enabling thinking', async () => {
    const { useChatOptions } = await import('../useChatOptions')
    const { thinkingMode, webSearch, toggleThinkingMode, toggleWebSearch } = useChatOptions()

    toggleWebSearch()
    expect(webSearch.value).toBe(true)
    expect(thinkingMode.value).toBe(false)

    toggleThinkingMode()
    expect(thinkingMode.value).toBe(true)
    expect(webSearch.value).toBe(false)
  })

  it('should turn off thinking when enabling web search', async () => {
    const { useChatOptions } = await import('../useChatOptions')
    const { thinkingMode, webSearch, toggleWebSearch } = useChatOptions()

    expect(thinkingMode.value).toBe(true)

    toggleWebSearch()
    expect(webSearch.value).toBe(true)
    expect(thinkingMode.value).toBe(false)
  })

  it('should reconcile stale cookies where both flags were true', async () => {
    cookieStore.set('chat-thinking-mode', { value: true })
    cookieStore.set('chat-web-search', { value: true })

    const { useChatOptions } = await import('../useChatOptions')
    const { thinkingMode, webSearch } = useChatOptions()

    expect(webSearch.value).toBe(true)
    expect(thinkingMode.value).toBe(false)
  })
})
