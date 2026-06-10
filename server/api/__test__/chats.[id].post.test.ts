import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockDbFindFirst, mockUser, mockReadValidatedBody } from '../../utils/__test__/setup'

// ─── Mocks ──────────────────────────────────────────────────────────────────
const mockCheckDailyLimit = vi.fn()
const mockGetModel = vi.fn(() => ({ provider: 'mock', modelId: 'mock' }))
const mockStreamText = vi.fn()
const mockGenerateText = vi.fn()
const mockConvertToModelMessages = vi.fn((msgs: unknown[]) => msgs)
const mockSmoothStream = vi.fn(() => ({ _type: 'smoothStream' }))

const mockToUIMessageStream = vi.fn(() => ({ _type: 'ui-message-stream' }))

vi.mock('../../utils/rateLimiter', () => ({
  getTodayCount: vi.fn(),
  checkDailyLimit: mockCheckDailyLimit,
  DAILY_LIMIT: 5
}))

vi.mock('../../utils/models', () => ({
  getModel: mockGetModel,
  DEFAULT_MODEL: 'deepseek-v4-pro',
  MODEL_OPTIONS: []
}))

vi.mock('ai', () => ({
  convertToModelMessages: (msgs: any) => mockConvertToModelMessages(msgs),
  createUIMessageStream: vi.fn((opts: any) => ({
    _type: 'ui-message-stream',
    _execute: opts.execute,
    _onFinish: opts.onFinish
  })),
  createUIMessageStreamResponse: vi.fn(({ stream }: any) =>
    new Response(JSON.stringify({ stream }), {
      headers: { 'content-type': 'application/json' }
    })
  ),
  generateText: (args: any) => mockGenerateText(args),
  smoothStream: () => mockSmoothStream(),
  streamText: (args: any) => mockStreamText(args)
}))

beforeEach(() => {
  vi.clearAllMocks()
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
})
