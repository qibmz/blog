import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockDbFindFirst, mockDbUpdate, mockDb, mockUser, mockReadValidatedBody } from '../../utils/__test__/setup'

// ─── Mocks ──────────────────────────────────────────────────────────────────
const mockCheckDailyLimit = vi.fn()
const mockGetModel = vi.fn(() => ({ provider: 'mock', modelId: 'mock' }))
const mockModelSupportsImages = vi.fn(async () => true)
const mockModelSupportsWebSearch = vi.fn(async () => false)
const mockModelSupportsThinking = vi.fn(() => true)
const mockModelSupportsCustomTools = vi.fn(() => true)
const mockIsStepCount = vi.fn((n: number) => ({ _type: 'isStepCount', n }))
const mockStreamText = vi.fn()
const mockGenerateText = vi.fn()
const mockConvertToModelMessages = vi.fn((msgs: unknown[]) => msgs)
const mockSmoothStream = vi.fn(() => ({ _type: 'smoothStream' }))
const mockConsumeStream = vi.fn()
const mockAbortSignal = new AbortController().signal
const mockGetRequestAbortSignal = vi.fn(() => mockAbortSignal)
const mockAwaitMimoSources = vi.fn(async () => [] as Array<{ url: string, title?: string }>)

const mockToUIMessageStream = vi.fn(() => new ReadableStream({
  start(controller) {
    controller.close()
  }
}))
const mockCreateUIMessageStream = vi.fn((opts: any) => ({
  _type: 'ui-message-stream',
  _execute: opts.execute,
  _onEnd: opts.onEnd
}))
const mockCreateUIMessageStreamResponse = vi.fn(({ stream }: any) =>
  new Response(JSON.stringify({ stream }), {
    headers: { 'content-type': 'application/json' }
  })
)

vi.mock('../../utils/rateLimiter', () => ({
  getTodayCount: vi.fn(),
  checkDailyLimit: mockCheckDailyLimit,
  DAILY_LIMIT: 5
}))

vi.mock('../../utils/models', () => ({
  getModel: mockGetModel,
  DEFAULT_MODEL: 'deepseek-v4-pro',
  MODEL_OPTIONS: [],
  modelSupportsImages: mockModelSupportsImages,
  modelSupportsThinking: mockModelSupportsThinking,
  modelSupportsWebSearch: mockModelSupportsWebSearch,
  modelSupportsCustomTools: mockModelSupportsCustomTools
}))

vi.mock('../../utils/webSearch', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../utils/webSearch')>()
  return {
    ...actual,
    awaitMimoSources: mockAwaitMimoSources
  }
})

vi.mock('../../utils/requestAbort', () => ({
  getRequestAbortSignal: mockGetRequestAbortSignal
}))

vi.mock('ai', () => ({
  convertToModelMessages: (msgs: any) => mockConvertToModelMessages(msgs),
  createUIMessageStream: mockCreateUIMessageStream,
  createUIMessageStreamResponse: mockCreateUIMessageStreamResponse,
  consumeStream: mockConsumeStream,
  generateText: (args: any) => mockGenerateText(args),
  smoothStream: () => mockSmoothStream(),
  streamText: (args: any) => mockStreamText(args),
  isStepCount: (n: number) => mockIsStepCount(n),
  tool: (def: unknown) => def
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockGetRequestAbortSignal.mockReturnValue(mockAbortSignal)
  mockModelSupportsWebSearch.mockResolvedValue(false)
  mockModelSupportsThinking.mockReturnValue(true)
  mockModelSupportsCustomTools.mockReturnValue(true)
  mockAwaitMimoSources.mockResolvedValue([])
})

describe('POST /api/chats/:id', () => {
  it('should return a stream response for valid chat', async () => {
    mockDbFindFirst.mockResolvedValue({
      id: 'chat-1',
      userId: mockUser.id,
      title: 'Existing Chat',
      model: 'deepseek-v4-pro'
    })

    // Mock streamText to return a stream-like object
    mockStreamText.mockReturnValue({
      toUIMessageStream: mockToUIMessageStream
    })

    const { default: handler } = await import('../chats/[id].post')

    const event = {
      context: {},
      path: '/api/chats/chat-1',
      waitUntil: vi.fn()
    } as any

    const result = await handler(event)

    // Should return a Response (from createUIMessageStreamResponse)
    expect(result).toBeInstanceOf(Response)
    expect(mockCreateUIMessageStreamResponse).toHaveBeenCalledWith(
      expect.objectContaining({ consumeSseStream: mockConsumeStream })
    )
  })

  it('should throw 404 when chat not found', async () => {
    mockDbFindFirst.mockResolvedValue(null)

    const { default: handler } = await import('../chats/[id].post')

    const event = {
      context: {},
      path: '/api/chats/non-existent',
      waitUntil: vi.fn()
    } as any

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 404
    })
  })

  it('should skip rate limit check for first message in chat', async () => {
    mockDbFindFirst.mockResolvedValue({
      id: 'chat-1',
      userId: mockUser.id,
      title: 'Existing Chat',
      model: 'deepseek-v4-pro'
    })

    mockStreamText.mockReturnValue({
      toUIMessageStream: mockToUIMessageStream
    })

    const { default: handler } = await import('../chats/[id].post')

    const event = {
      context: {},
      path: '/api/chats/chat-1',
      waitUntil: vi.fn()
    } as any

    await handler(event)

    // First message (messages.length === 1) is counted in chats.post.ts,
    // so checkDailyLimit should NOT be called for the first message in a chat
    expect(mockCheckDailyLimit).not.toHaveBeenCalled()
  })

  it('should enable thinking by default when options not provided', async () => {
    mockDbFindFirst.mockResolvedValue({
      id: 'chat-1',
      userId: mockUser.id,
      title: 'Existing Chat',
      model: 'deepseek-v4-pro'
    })

    mockStreamText.mockReturnValue({
      toUIMessageStream: mockToUIMessageStream
    })

    const { default: handler } = await import('../chats/[id].post')

    const event = {
      context: {},
      path: '/api/chats/chat-1',
      waitUntil: vi.fn()
    } as any

    await handler(event)

    // streamText is called inside createUIMessageStream's lazy execute callback
    const executeFn = mockCreateUIMessageStream.mock.calls[0]?.[0]?.execute
    expect(executeFn).toBeDefined()
    await executeFn({ writer: { merge: vi.fn() } })

    expect(mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({
        abortSignal: mockAbortSignal,
        providerOptions: {
          deepseek: { thinking: { type: 'enabled' } },
          mimo: { thinking: { type: 'enabled' } }
        }
      })
    )
  })

  it('should disable thinking when options.thinkingMode is false', async () => {
    mockDbFindFirst.mockResolvedValue({
      id: 'chat-1',
      userId: mockUser.id,
      title: 'Existing Chat',
      model: 'deepseek-v4-pro'
    })

    mockStreamText.mockReturnValue({
      toUIMessageStream: mockToUIMessageStream
    })

    mockReadValidatedBody.mockImplementationOnce(
      async (_event: unknown, validateFn?: (b: unknown) => unknown) => {
        const body = {
          model: 'deepseek-v4-pro',
          messages: [
            { id: 'msg-1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
            { id: 'msg-2', role: 'user', parts: [{ type: 'text', text: 'Follow up' }] }
          ],
          options: { thinkingMode: false }
        }
        return typeof validateFn === 'function' ? validateFn(body) : body
      }
    )

    const { default: handler } = await import('../chats/[id].post')

    const event = {
      context: {},
      path: '/api/chats/chat-1',
      waitUntil: vi.fn()
    } as any

    await handler(event)

    const executeFn = mockCreateUIMessageStream.mock.calls[0]?.[0]?.execute
    expect(executeFn).toBeDefined()
    await executeFn({ writer: { merge: vi.fn() } })

    expect(mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({
        providerOptions: {
          deepseek: { thinking: { type: 'disabled' } },
          mimo: { thinking: { type: 'disabled' } }
        }
      })
    )
  })

  it('should check rate limit for follow-up messages', async () => {
    mockDbFindFirst.mockResolvedValue({
      id: 'chat-1',
      userId: mockUser.id,
      title: 'Existing Chat',
      model: 'deepseek-v4-pro'
    })

    mockStreamText.mockReturnValue({
      toUIMessageStream: mockToUIMessageStream
    })

    // Override readValidatedBody to return 2 messages (simulating follow-up)
    mockReadValidatedBody.mockImplementationOnce(
      async (_event: unknown, validateFn?: (b: unknown) => unknown) => {
        const body = {
          model: 'deepseek-v4-pro',
          messages: [
            { id: 'msg-1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
            { id: 'msg-2', role: 'user', parts: [{ type: 'text', text: 'Follow up' }] }
          ]
        }
        return typeof validateFn === 'function' ? validateFn(body) : body
      }
    )

    const { default: handler } = await import('../chats/[id].post')

    const event = {
      context: {},
      path: '/api/chats/chat-1',
      waitUntil: vi.fn()
    } as any

    await handler(event)

    // Follow-up messages (messages.length > 1) should trigger rate limit check
    expect(mockCheckDailyLimit).toHaveBeenCalledWith(mockUser.id)
  })

  it('should set provisional title for image-only first message without calling vision generateText', async () => {
    mockDbFindFirst.mockResolvedValue({
      id: 'chat-1',
      userId: mockUser.id,
      title: null,
      model: 'mimo-v2.5'
    })
    mockStreamText.mockReturnValue({
      toUIMessageStream: mockToUIMessageStream
    })
    mockReadValidatedBody.mockImplementationOnce(
      async (_event: unknown, validateFn?: (b: unknown) => unknown) => {
        const body = {
          model: 'mimo-v2.5',
          messages: [{
            id: 'msg-1',
            role: 'user',
            parts: [{ type: 'file', url: 'data:image/png;base64,xxx', mediaType: 'image/png' }]
          }]
        }
        return typeof validateFn === 'function' ? validateFn(body) : body
      }
    )

    const { default: handler } = await import('../chats/[id].post')
    const event = { context: {}, path: '/api/chats/chat-1', waitUntil: vi.fn() } as any
    await handler(event)

    expect(mockDbUpdate).toHaveBeenCalled()
    const setFn = mockDbUpdate.mock.results[0]?.value?.set
    expect(setFn).toHaveBeenCalledWith(expect.objectContaining({ title: '图片对话' }))
    expect(mockGenerateText).not.toHaveBeenCalled()
  })

  it('should refine title with text prompt when first message has text', async () => {
    mockDbFindFirst.mockResolvedValue({
      id: 'chat-1',
      userId: mockUser.id,
      title: null,
      model: 'deepseek-v4-pro'
    })
    mockStreamText.mockReturnValue({
      toUIMessageStream: mockToUIMessageStream
    })
    mockGenerateText.mockResolvedValue({ text: '精炼标题' })
    mockReadValidatedBody.mockImplementationOnce(
      async (_event: unknown, validateFn?: (b: unknown) => unknown) => {
        const body = {
          model: 'deepseek-v4-pro',
          messages: [{
            id: 'msg-1',
            role: 'user',
            parts: [
              { type: 'file', url: 'data:image/png;base64,xxx', mediaType: 'image/png' },
              { type: 'text', text: '这是什么图' }
            ]
          }]
        }
        return typeof validateFn === 'function' ? validateFn(body) : body
      }
    )

    const { default: handler } = await import('../chats/[id].post')
    const event = { context: {}, path: '/api/chats/chat-1', waitUntil: vi.fn() } as any
    await handler(event)

    expect(mockGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: JSON.stringify({
          id: 'msg-1',
          role: 'user',
          parts: [
            { type: 'file', url: 'data:image/png;base64,xxx', mediaType: 'image/png' },
            { type: 'text', text: '这是什么图' }
          ]
        })
      })
    )
    expect(event.waitUntil).toHaveBeenCalled()
  })

  it('should still refine when chat already has provisional title from create', async () => {
    mockDbFindFirst.mockResolvedValue({
      id: 'chat-1',
      userId: mockUser.id,
      title: '这是什么图',
      model: 'deepseek-v4-pro'
    })
    mockStreamText.mockReturnValue({
      toUIMessageStream: mockToUIMessageStream
    })
    mockGenerateText.mockResolvedValue({ text: '图片问答' })
    mockReadValidatedBody.mockImplementationOnce(
      async (_event: unknown, validateFn?: (b: unknown) => unknown) => {
        const body = {
          model: 'deepseek-v4-pro',
          messages: [{
            id: 'msg-1',
            role: 'user',
            parts: [{ type: 'text', text: '这是什么图' }]
          }]
        }
        return typeof validateFn === 'function' ? validateFn(body) : body
      }
    )

    const { default: handler } = await import('../chats/[id].post')
    const event = { context: {}, path: '/api/chats/chat-1', waitUntil: vi.fn() } as any
    await handler(event)

    expect(mockGenerateText).toHaveBeenCalled()
    expect(event.waitUntil).toHaveBeenCalled()
  })

  it('should not refine again when title was already AI-refined', async () => {
    mockDbFindFirst.mockResolvedValue({
      id: 'chat-1',
      userId: mockUser.id,
      title: '图片内容问答',
      model: 'deepseek-v4-pro'
    })
    mockStreamText.mockReturnValue({
      toUIMessageStream: mockToUIMessageStream
    })
    mockReadValidatedBody.mockImplementationOnce(
      async (_event: unknown, validateFn?: (b: unknown) => unknown) => {
        const body = {
          model: 'deepseek-v4-pro',
          messages: [{
            id: 'msg-1',
            role: 'user',
            parts: [{ type: 'text', text: '这是什么图' }]
          }]
        }
        return typeof validateFn === 'function' ? validateFn(body) : body
      }
    )

    const { default: handler } = await import('../chats/[id].post')
    const event = { context: {}, path: '/api/chats/chat-1', waitUntil: vi.fn() } as any
    await handler(event)

    expect(mockGenerateText).not.toHaveBeenCalled()
  })

  it('should persist assistant message when stream finishes normally', async () => {
    mockDbFindFirst.mockResolvedValue({
      id: 'chat-1',
      userId: mockUser.id,
      title: 'Existing Chat',
      model: 'deepseek-v4-pro'
    })
    mockStreamText.mockReturnValue({
      toUIMessageStream: mockToUIMessageStream
    })

    const { default: handler } = await import('../chats/[id].post')
    await handler({ context: {}, path: '/api/chats/chat-1', waitUntil: vi.fn() } as any)

    const onEnd = mockCreateUIMessageStream.mock.calls[0]?.[0]?.onEnd
    await onEnd({
      isAborted: false,
      responseMessage: {
        id: 'assistant-1',
        role: 'assistant',
        parts: [{ type: 'text', text: '完整回复' }]
      }
    })

    expect(mockDb.insert).toHaveBeenCalled()
    const valuesFn = mockDb.insert.mock.results[0]?.value?.values
    expect(valuesFn).toHaveBeenCalledWith({
      chatId: 'chat-1',
      role: 'assistant',
      parts: [{ type: 'text', text: '完整回复' }]
    })
  })

  it('should persist partial assistant message when stream is aborted with content', async () => {
    mockDbFindFirst.mockResolvedValue({
      id: 'chat-1',
      userId: mockUser.id,
      title: 'Existing Chat',
      model: 'deepseek-v4-pro'
    })
    mockStreamText.mockReturnValue({
      toUIMessageStream: mockToUIMessageStream
    })

    const { default: handler } = await import('../chats/[id].post')
    await handler({ context: {}, path: '/api/chats/chat-1', waitUntil: vi.fn() } as any)

    const onEnd = mockCreateUIMessageStream.mock.calls[0]?.[0]?.onEnd
    await onEnd({
      isAborted: true,
      responseMessage: {
        id: 'assistant-1',
        role: 'assistant',
        parts: [{ type: 'text', text: '半截回复' }]
      }
    })

    expect(mockDb.insert).toHaveBeenCalled()
  })

  it('should skip persistence when stream is aborted without content', async () => {
    mockDbFindFirst.mockResolvedValue({
      id: 'chat-1',
      userId: mockUser.id,
      title: 'Existing Chat',
      model: 'deepseek-v4-pro'
    })
    mockStreamText.mockReturnValue({
      toUIMessageStream: mockToUIMessageStream
    })

    const { default: handler } = await import('../chats/[id].post')
    await handler({ context: {}, path: '/api/chats/chat-1', waitUntil: vi.fn() } as any)

    const onEnd = mockCreateUIMessageStream.mock.calls[0]?.[0]?.onEnd
    await onEnd({
      isAborted: true,
      responseMessage: {
        id: 'assistant-1',
        role: 'assistant',
        parts: [{ type: 'text', text: '   ' }]
      }
    })

    expect(mockDb.insert).not.toHaveBeenCalled()
  })

  it('should swallow assistant persistence errors in onEnd', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockDbFindFirst.mockResolvedValue({
      id: 'chat-1',
      userId: mockUser.id,
      title: 'Existing Chat',
      model: 'deepseek-v4-pro'
    })
    mockStreamText.mockReturnValue({
      toUIMessageStream: mockToUIMessageStream
    })
    mockDb.insert.mockImplementationOnce(() => ({
      values: vi.fn(() => {
        const pending = Promise.reject(new Error('db down'))
        return Object.assign(pending, {
          returning: () => Promise.reject(new Error('db down'))
        })
      })
    }))

    const { default: handler } = await import('../chats/[id].post')
    await handler({ context: {}, path: '/api/chats/chat-1', waitUntil: vi.fn() } as any)

    const onEnd = mockCreateUIMessageStream.mock.calls[0]?.[0]?.onEnd
    await expect(onEnd({
      isAborted: false,
      responseMessage: {
        id: 'assistant-1',
        role: 'assistant',
        parts: [{ type: 'text', text: '完整回复' }]
      }
    })).resolves.toBeUndefined()

    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })

  it('should send MiMo web-search flag and persist sources when web search is enabled', async () => {
    mockModelSupportsWebSearch.mockResolvedValue(true)
    mockAwaitMimoSources.mockResolvedValue([
      { url: 'https://example.com/a', title: 'Source A' }
    ])
    mockDbFindFirst.mockResolvedValue({
      id: 'chat-1',
      userId: mockUser.id,
      title: 'Existing Chat',
      model: 'mimo-v2.5-pro'
    })
    mockStreamText.mockReturnValue({
      toUIMessageStream: mockToUIMessageStream
    })
    mockReadValidatedBody.mockImplementationOnce(
      async (_event: unknown, validateFn?: (b: unknown) => unknown) => {
        const body = {
          model: 'mimo-v2.5-pro',
          options: { webSearch: true },
          messages: [
            { id: 'msg-1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
            { id: 'msg-2', role: 'assistant', parts: [{ type: 'text', text: 'Hi' }] },
            { id: 'msg-3', role: 'user', parts: [{ type: 'text', text: '搜一下新闻' }] }
          ]
        }
        return typeof validateFn === 'function' ? validateFn(body) : body
      }
    )

    const { MIMO_WEB_SEARCH_FLAG } = await import('../../utils/webSearch')
    const { default: handler } = await import('../chats/[id].post')
    await handler({ context: {}, path: '/api/chats/chat-1', waitUntil: vi.fn() } as any)

    const streamOpts = mockCreateUIMessageStream.mock.calls[0]?.[0]
    await streamOpts.execute({ writer: { merge: vi.fn() } })

    expect(mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({
        providerOptions: expect.objectContaining({
          mimo: expect.objectContaining({
            [MIMO_WEB_SEARCH_FLAG]: true,
            // 联网时强制关思考，避免 tool + thinking 叠加卡顿
            thinking: { type: 'disabled' }
          })
        })
      })
    )

    await streamOpts.onEnd({
      isAborted: false,
      responseMessage: {
        id: 'assistant-1',
        role: 'assistant',
        parts: [{ type: 'text', text: '带引用的回复' }]
      }
    })

    expect(mockAwaitMimoSources).toHaveBeenCalled()
    const valuesCalls = mockDb.insert.mock.results
      .map(result => result.value?.values)
      .filter(Boolean)
      .flatMap(valuesFn => valuesFn.mock.calls.map((call: unknown[]) => call[0]))
    const assistantInsert = valuesCalls.find(payload => payload?.role === 'assistant')
    expect(assistantInsert).toEqual(expect.objectContaining({
      role: 'assistant',
      parts: [
        { type: 'text', text: '带引用的回复' },
        { type: 'sources', sources: [{ url: 'https://example.com/a', title: 'Source A' }] }
      ]
    }))
  })

  it('should disable thinking even when thinkingMode is true if web search is enabled', async () => {
    mockModelSupportsWebSearch.mockResolvedValue(true)
    mockModelSupportsThinking.mockReturnValue(true)
    mockDbFindFirst.mockResolvedValue({
      id: 'chat-1',
      userId: mockUser.id,
      title: 'Existing Chat',
      model: 'mimo-v2.5-pro'
    })
    mockStreamText.mockReturnValue({
      toUIMessageStream: mockToUIMessageStream
    })
    mockReadValidatedBody.mockImplementationOnce(
      async (_event: unknown, validateFn?: (b: unknown) => unknown) => {
        const body = {
          model: 'mimo-v2.5-pro',
          options: { thinkingMode: true, webSearch: true },
          messages: [
            { id: 'msg-1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }
          ]
        }
        return typeof validateFn === 'function' ? validateFn(body) : body
      }
    )

    const { default: handler } = await import('../chats/[id].post')
    await handler({ context: {}, path: '/api/chats/chat-1', waitUntil: vi.fn() } as any)

    const streamOpts = mockCreateUIMessageStream.mock.calls[0]?.[0]
    await streamOpts.execute({ writer: { merge: vi.fn() } })

    expect(mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({
        providerOptions: expect.objectContaining({
          mimo: expect.objectContaining({
            thinking: { type: 'disabled' }
          })
        })
      })
    )
  })

  it('should pass chart tool and stopWhen for models that support custom tools', async () => {
    mockDbFindFirst.mockResolvedValue({
      id: 'chat-1',
      userId: mockUser.id,
      title: 'Existing Chat',
      model: 'deepseek-v4-pro'
    })
    mockStreamText.mockReturnValue({
      toUIMessageStream: mockToUIMessageStream
    })

    const { default: handler } = await import('../chats/[id].post')
    await handler({ context: {}, path: '/api/chats/chat-1', waitUntil: vi.fn() } as any)

    const executeFn = mockCreateUIMessageStream.mock.calls[0]?.[0]?.execute
    await executeFn({ writer: { merge: vi.fn() } })

    expect(mockStreamText).toHaveBeenCalledWith(
      expect.objectContaining({
        tools: expect.objectContaining({ chart: expect.anything() }),
        stopWhen: { _type: 'isStepCount', n: 5 }
      })
    )
  })

  it('should omit chart tool for models without custom tool support', async () => {
    mockModelSupportsCustomTools.mockReturnValue(false)
    mockDbFindFirst.mockResolvedValue({
      id: 'chat-1',
      userId: mockUser.id,
      title: 'Existing Chat',
      model: 'mimo-v2.5-pro'
    })
    mockStreamText.mockReturnValue({
      toUIMessageStream: mockToUIMessageStream
    })

    const { default: handler } = await import('../chats/[id].post')
    await handler({ context: {}, path: '/api/chats/chat-1', waitUntil: vi.fn() } as any)

    const executeFn = mockCreateUIMessageStream.mock.calls[0]?.[0]?.execute
    await executeFn({ writer: { merge: vi.fn() } })

    const args = mockStreamText.mock.calls[0]?.[0]
    expect(args.tools).toBeUndefined()
    expect(args.stopWhen).toBeUndefined()
  })
})
