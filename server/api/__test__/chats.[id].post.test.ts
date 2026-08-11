import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockDbFindFirst, mockDbUpdate, mockDb, mockUser, mockReadValidatedBody } from '../../utils/__test__/setup'

// ─── Mocks ──────────────────────────────────────────────────────────────────
const mockCheckDailyLimit = vi.fn()
const mockGetModel = vi.fn(() => ({ provider: 'mock', modelId: 'mock' }))
const mockModelSupportsImages = vi.fn(async () => true)
const mockStreamText = vi.fn()
const mockGenerateText = vi.fn()
const mockConvertToModelMessages = vi.fn((msgs: unknown[]) => msgs)
const mockSmoothStream = vi.fn(() => ({ _type: 'smoothStream' }))
const mockConsumeStream = vi.fn()
const mockAbortSignal = new AbortController().signal
const mockGetRequestAbortSignal = vi.fn(() => mockAbortSignal)

const mockToUIMessageStream = vi.fn(() => ({ _type: 'ui-message-stream' }))
const mockCreateUIMessageStream = vi.fn((opts: any) => ({
  _type: 'ui-message-stream',
  _execute: opts.execute,
  _onFinish: opts.onFinish
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
  modelSupportsThinking: vi.fn(() => true),
  modelSupportsWebSearch: vi.fn(async () => false)
}))

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
  streamText: (args: any) => mockStreamText(args)
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockGetRequestAbortSignal.mockReturnValue(mockAbortSignal)
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

    const onFinish = mockCreateUIMessageStream.mock.calls[0]?.[0]?.onFinish
    await onFinish({
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

    const onFinish = mockCreateUIMessageStream.mock.calls[0]?.[0]?.onFinish
    await onFinish({
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

    const onFinish = mockCreateUIMessageStream.mock.calls[0]?.[0]?.onFinish
    await onFinish({
      isAborted: true,
      responseMessage: {
        id: 'assistant-1',
        role: 'assistant',
        parts: [{ type: 'text', text: '   ' }]
      }
    })

    expect(mockDb.insert).not.toHaveBeenCalled()
  })

  it('should swallow assistant persistence errors in onFinish', async () => {
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

    const onFinish = mockCreateUIMessageStream.mock.calls[0]?.[0]?.onFinish
    await expect(onFinish({
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
})
