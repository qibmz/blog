import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createError } from 'h3'
import { mockDbFindFirst, mockDbUpdate, mockDb, mockUser, mockReadValidatedBody } from '../../utils/__test__/setup'

// ─── Mocks ──────────────────────────────────────────────────────────────────
const mockCheckDailyLimit = vi.fn()
const mockGetModel = vi.fn(() => ({ provider: 'mock', modelId: 'mock' }))
const mockModelSupportsImages = vi.fn(async () => true)
const mockModelSupportsWebSearch = vi.fn(async () => false)
const mockModelSupportsThinking = vi.fn(async () => true)
const mockModelSupportsCustomTools = vi.fn(() => true)
const mockIsStepCount = vi.fn((n: number) => ({ _type: 'isStepCount', n }))
const mockStreamText = vi.fn()
const mockGenerateText = vi.fn()
const mockConvertToModelMessages = vi.fn((msgs: unknown[]) => msgs)
const mockConsumeStream = vi.fn()
const mockAbortSignal = new AbortController().signal
const mockGetRequestAbortSignal = vi.fn(() => mockAbortSignal)
const mockAwaitMimoSources = vi.fn(async () => [] as Array<{ url: string, title?: string }>)

const mockToUIMessageStream = vi.fn((_args?: unknown) => new ReadableStream({
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

const mockAssertModelEnabled = vi.fn(async () => {})

vi.mock('../../utils/models', () => ({
  assertModelEnabled: mockAssertModelEnabled,
  getModel: mockGetModel,
  PREFERRED_DEFAULT_MODEL: 'deepseek-flash',
  pickDefaultModel: (list: { value: string }[]) => list[0]?.value ?? 'deepseek-flash',
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
  streamText: (args: any) => mockStreamText(args),
  toUIMessageStream: (args: any) => mockToUIMessageStream(args),
  isStepCount: (n: number) => mockIsStepCount(n),
  tool: (def: unknown) => def
}))

const helloParts = [{ type: 'text', text: 'Hello' }] as const

function chatFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'chat-1',
    userId: mockUser.id,
    title: 'Existing Chat',
    model: 'deepseek-v4-pro',
    messages: [
      { id: 'db-msg-1', role: 'user' as const, parts: [...helloParts] }
    ],
    ...overrides
  }
}

function bodyWith(
  partial: Record<string, unknown>,
  validateFn?: (b: unknown) => unknown
) {
  const body = {
    model: 'deepseek-v4-pro',
    trigger: 'submit-message' as const,
    message: { id: 'msg-1', role: 'user' as const, parts: [...helloParts] },
    ...partial
  }
  return typeof validateFn === 'function' ? validateFn(body) : body
}

beforeEach(() => {
  vi.clearAllMocks()
  mockAssertModelEnabled.mockResolvedValue(undefined)
  mockGetRequestAbortSignal.mockReturnValue(mockAbortSignal)
  mockModelSupportsImages.mockResolvedValue(true)
  mockModelSupportsWebSearch.mockResolvedValue(false)
  mockModelSupportsThinking.mockResolvedValue(true)
  mockModelSupportsCustomTools.mockReturnValue(true)
  mockAwaitMimoSources.mockResolvedValue([])
  mockDbFindFirst.mockResolvedValue(chatFixture())
  mockStreamText.mockReturnValue({
    stream: new ReadableStream({
      start(controller) {
        controller.close()
      }
    })
  })
})

describe('POST /api/chats/:id', () => {
  it('should return a stream response for valid chat', async () => {
    const { default: handler } = await import('../chats/[id].post')

    const event = {
      context: {},
      path: '/api/chats/chat-1',
      waitUntil: vi.fn()
    } as any

    const result = await handler(event)

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

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('should assemble model context from DB history, not client full transcript', async () => {
    mockDbFindFirst.mockResolvedValue(chatFixture({
      messages: [
        { id: 'db-1', role: 'user', parts: [{ type: 'text', text: '第一轮' }] },
        { id: 'db-2', role: 'assistant', parts: [{ type: 'text', text: '答复' }] }
      ]
    }))
    mockReadValidatedBody.mockImplementationOnce(
      async (_e, validateFn) => bodyWith({
        message: { id: 'msg-new', role: 'user', parts: [{ type: 'text', text: '第二轮' }] }
      }, validateFn)
    )

    const { default: handler } = await import('../chats/[id].post')
    await handler({ context: {}, path: '/api/chats/chat-1', waitUntil: vi.fn() } as any)

    const executeFn = mockCreateUIMessageStream.mock.calls[0]?.[0]?.execute
    await executeFn({ writer: { merge: vi.fn() } })

    expect(mockConvertToModelMessages.mock.calls[0]?.[0]).toEqual([
      { id: 'db-1', role: 'user', parts: [{ type: 'text', text: '第一轮' }] },
      { id: 'db-2', role: 'assistant', parts: [{ type: 'text', text: '答复' }] },
      { id: 'msg-new', role: 'user', parts: [{ type: 'text', text: '第二轮' }] }
    ])
  })

  it('should reject disabled or unknown model before mutating history', async () => {
    mockAssertModelEnabled.mockRejectedValueOnce(
      createError({ statusCode: 400, statusMessage: '模型不可用或已禁用' })
    )
    const { default: handler } = await import('../chats/[id].post')
    await expect(
      handler({ context: {}, path: '/api/chats/chat-1', waitUntil: vi.fn() } as any)
    ).rejects.toMatchObject({ statusCode: 400, statusMessage: '模型不可用或已禁用' })
    expect(mockDb.insert).not.toHaveBeenCalled()
    expect(mockDb.delete).not.toHaveBeenCalled()
  })

  it('should not re-insert but still rate-limit when first user message already in DB', async () => {
    const { default: handler } = await import('../chats/[id].post')
    await handler({ context: {}, path: '/api/chats/chat-1', waitUntil: vi.fn() } as any)

    expect(mockCheckDailyLimit).toHaveBeenCalledWith(mockUser.id)
    expect(mockDb.insert).not.toHaveBeenCalled()
  })

  it('should not duplicate user when client parts only differ by optional fields', async () => {
    mockDbFindFirst.mockResolvedValue(chatFixture({
      messages: [{
        id: 'db-1',
        role: 'user',
        parts: [{ type: 'text', text: 'Hello' }]
      }]
    }))
    mockReadValidatedBody.mockImplementationOnce(
      async (_e, validateFn) => bodyWith({
        // 多一个 filename / 键序不同，语义仍是同一条
        message: {
          id: 'client-1',
          role: 'user',
          parts: [{ type: 'text', text: 'Hello', foo: 'bar' }]
        }
      }, validateFn)
    )

    const { default: handler } = await import('../chats/[id].post')
    await handler({ context: {}, path: '/api/chats/chat-1', waitUntil: vi.fn() } as any)

    expect(mockCheckDailyLimit).toHaveBeenCalledWith(mockUser.id)
    expect(mockDb.insert).not.toHaveBeenCalled()
    expect(mockDbUpdate).not.toHaveBeenCalled()
  })

  it('should reject non-vision model when DB history contains images (regenerate)', async () => {
    mockModelSupportsImages.mockResolvedValue(false)
    mockDbFindFirst.mockResolvedValue(chatFixture({
      messages: [
        {
          id: 'db-1',
          role: 'user',
          parts: [
            { type: 'file', url: 'https://img.qibmz.com/chat/u1/a.png', mediaType: 'image/png' },
            { type: 'text', text: '这是什么' }
          ]
        },
        { id: 'db-2', role: 'assistant', parts: [{ type: 'text', text: '旧答复' }] }
      ]
    }))
    mockReadValidatedBody.mockImplementationOnce(
      async (_e, validateFn) => bodyWith({
        trigger: 'regenerate-message',
        message: undefined
      }, validateFn)
    )

    const { default: handler } = await import('../chats/[id].post')
    await expect(
      handler({ context: {}, path: '/api/chats/chat-1', waitUntil: vi.fn() } as any)
    ).rejects.toMatchObject({ statusCode: 400, statusMessage: '当前模型不支持图片输入' })
  })

  it('should disable thinking when options.thinkingMode is false', async () => {
    mockReadValidatedBody.mockImplementationOnce(
      async (_e, validateFn) => bodyWith({
        options: { thinkingMode: false },
        message: { id: 'msg-2', role: 'user', parts: [{ type: 'text', text: 'Follow up' }] }
      }, validateFn)
    )
    mockDbFindFirst.mockResolvedValue(chatFixture({
      messages: [
        { id: 'db-1', role: 'user', parts: [...helloParts] },
        { id: 'db-2', role: 'assistant', parts: [{ type: 'text', text: 'Hi' }] }
      ]
    }))

    const { default: handler } = await import('../chats/[id].post')
    await handler({ context: {}, path: '/api/chats/chat-1', waitUntil: vi.fn() } as any)

    const executeFn = mockCreateUIMessageStream.mock.calls[0]?.[0]?.execute
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
    mockDbFindFirst.mockResolvedValue(chatFixture({
      messages: [
        { id: 'db-1', role: 'user', parts: [...helloParts] },
        { id: 'db-2', role: 'assistant', parts: [{ type: 'text', text: 'Hi' }] }
      ]
    }))
    mockReadValidatedBody.mockImplementationOnce(
      async (_e, validateFn) => bodyWith({
        message: { id: 'msg-2', role: 'user', parts: [{ type: 'text', text: 'Follow up' }] }
      }, validateFn)
    )

    const { default: handler } = await import('../chats/[id].post')
    await handler({ context: {}, path: '/api/chats/chat-1', waitUntil: vi.fn() } as any)

    expect(mockCheckDailyLimit).toHaveBeenCalledWith(mockUser.id)
    expect(mockDb.insert).toHaveBeenCalled()
  })

  it('should regenerate by dropping trailing assistant and rate-limiting', async () => {
    mockDbFindFirst.mockResolvedValue(chatFixture({
      messages: [
        { id: 'db-1', role: 'user', parts: [...helloParts] },
        { id: 'db-2', role: 'assistant', parts: [{ type: 'text', text: '旧答复' }] }
      ]
    }))
    mockReadValidatedBody.mockImplementationOnce(
      async (_e, validateFn) => bodyWith({
        trigger: 'regenerate-message',
        message: undefined
      }, validateFn)
    )

    const { default: handler } = await import('../chats/[id].post')
    await handler({ context: {}, path: '/api/chats/chat-1', waitUntil: vi.fn() } as any)

    expect(mockCheckDailyLimit).toHaveBeenCalledWith(mockUser.id)
    expect(mockDb.delete).not.toHaveBeenCalled()

    const streamOpts = mockCreateUIMessageStream.mock.calls[0]?.[0]
    const executeFn = streamOpts?.execute
    await executeFn({ writer: { merge: vi.fn() } })
    expect(mockConvertToModelMessages.mock.calls[0]?.[0]).toEqual([
      { id: 'db-1', role: 'user', parts: [...helloParts] }
    ])

    // 成功落库新回复时才删除旧 assistant
    await streamOpts?.onEnd({
      responseMessage: { role: 'assistant', parts: [{ type: 'text', text: '新答复' }] },
      isAborted: false
    })
    expect(mockDb.delete).toHaveBeenCalled()
  })

  it('should set provisional title for image-only first message without calling vision generateText', async () => {
    const imageParts = [
      { type: 'file', url: 'https://img.qibmz.com/chat/u1/a.png', mediaType: 'image/png' }
    ]
    mockDbFindFirst.mockResolvedValue(chatFixture({
      title: null,
      model: 'mimo-v2.5',
      messages: [{ id: 'db-1', role: 'user', parts: imageParts }]
    }))
    mockReadValidatedBody.mockImplementationOnce(
      async (_e, validateFn) => bodyWith({
        model: 'mimo-v2.5',
        message: { id: 'msg-1', role: 'user', parts: imageParts }
      }, validateFn)
    )

    const { default: handler } = await import('../chats/[id].post')
    await handler({ context: {}, path: '/api/chats/chat-1', waitUntil: vi.fn() } as any)

    expect(mockDbUpdate).toHaveBeenCalled()
    const setFn = mockDbUpdate.mock.results[0]?.value?.set
    expect(setFn).toHaveBeenCalledWith(expect.objectContaining({ title: '图片对话' }))
    expect(mockGenerateText).not.toHaveBeenCalled()
  })

  it('should refine title with text prompt when first message has text', async () => {
    const parts = [
      { type: 'file', url: 'https://img.qibmz.com/chat/u1/a.png', mediaType: 'image/png' },
      { type: 'text', text: '这是什么图' }
    ]
    mockDbFindFirst.mockResolvedValue(chatFixture({
      title: null,
      messages: [{ id: 'db-1', role: 'user', parts }]
    }))
    mockGenerateText.mockResolvedValue({ text: '精炼标题' })
    mockReadValidatedBody.mockImplementationOnce(
      async (_e, validateFn) => bodyWith({
        message: { id: 'msg-1', role: 'user', parts }
      }, validateFn)
    )

    const { default: handler } = await import('../chats/[id].post')
    const event = { context: {}, path: '/api/chats/chat-1', waitUntil: vi.fn() } as any
    await handler(event)

    expect(mockGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: JSON.stringify({
          id: 'db-1',
          role: 'user',
          parts
        })
      })
    )
    expect(event.waitUntil).toHaveBeenCalled()
  })

  it('should still refine when chat already has provisional title from create', async () => {
    const parts = [{ type: 'text', text: '这是什么图' }]
    mockDbFindFirst.mockResolvedValue(chatFixture({
      title: '这是什么图',
      messages: [{ id: 'db-1', role: 'user', parts }]
    }))
    mockGenerateText.mockResolvedValue({ text: '图片问答' })
    mockReadValidatedBody.mockImplementationOnce(
      async (_e, validateFn) => bodyWith({
        message: { id: 'msg-1', role: 'user', parts }
      }, validateFn)
    )

    const { default: handler } = await import('../chats/[id].post')
    const event = { context: {}, path: '/api/chats/chat-1', waitUntil: vi.fn() } as any
    await handler(event)

    expect(mockGenerateText).toHaveBeenCalled()
    expect(event.waitUntil).toHaveBeenCalled()
  })

  it('should not refine again when title was already AI-refined', async () => {
    const parts = [{ type: 'text', text: '这是什么图' }]
    mockDbFindFirst.mockResolvedValue(chatFixture({
      title: '图片内容问答',
      messages: [{ id: 'db-1', role: 'user', parts }]
    }))
    mockReadValidatedBody.mockImplementationOnce(
      async (_e, validateFn) => bodyWith({
        message: { id: 'msg-1', role: 'user', parts }
      }, validateFn)
    )

    const { default: handler } = await import('../chats/[id].post')
    await handler({ context: {}, path: '/api/chats/chat-1', waitUntil: vi.fn() } as any)

    expect(mockGenerateText).not.toHaveBeenCalled()
  })

  it('should persist assistant message when stream finishes normally', async () => {
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
    mockDb.insert.mockImplementationOnce(() => ({
      values: vi.fn(() => {
        const pending = Promise.reject(new Error('db down'))
        return Object.assign(pending, {
          returning: () => Promise.reject(new Error('db down')),
          onConflictDoNothing: vi.fn(() => Promise.reject(new Error('db down'))),
          onConflictDoUpdate: vi.fn(() => Promise.reject(new Error('db down')))
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
    mockDbFindFirst.mockResolvedValue(chatFixture({
      model: 'mimo-v2.5-pro',
      messages: [
        { id: 'db-1', role: 'user', parts: [...helloParts] },
        { id: 'db-2', role: 'assistant', parts: [{ type: 'text', text: 'Hi' }] }
      ]
    }))
    mockReadValidatedBody.mockImplementationOnce(
      async (_e, validateFn) => bodyWith({
        model: 'mimo-v2.5-pro',
        options: { webSearch: true },
        message: { id: 'msg-3', role: 'user', parts: [{ type: 'text', text: '搜一下新闻' }] }
      }, validateFn)
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
    mockModelSupportsThinking.mockResolvedValue(true)
    mockReadValidatedBody.mockImplementationOnce(
      async (_e, validateFn) => bodyWith({
        model: 'mimo-v2.5-pro',
        options: { thinkingMode: true, webSearch: true }
      }, validateFn)
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

    const { default: handler } = await import('../chats/[id].post')
    await handler({ context: {}, path: '/api/chats/chat-1', waitUntil: vi.fn() } as any)

    const executeFn = mockCreateUIMessageStream.mock.calls[0]?.[0]?.execute
    await executeFn({ writer: { merge: vi.fn() } })

    const args = mockStreamText.mock.calls[0]?.[0]
    expect(args.tools).toBeUndefined()
    expect(args.stopWhen).toBeUndefined()
  })
})
