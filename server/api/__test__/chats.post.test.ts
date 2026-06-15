import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockDbInsertReturning, mockUser, mockReadValidatedBody } from '../../utils/__test__/setup'

const mockCheckDailyLimit = vi.fn()

vi.mock('../../utils/rateLimiter', () => ({
  getTodayCount: vi.fn(),
  checkDailyLimit: mockCheckDailyLimit,
  DAILY_LIMIT: 5
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/chats', () => {
  it('should create a chat with first message', async () => {
    const chatRow = { id: 'new-chat-1', userId: mockUser.id, model: 'deepseek-v4-pro' }
    mockDbInsertReturning.mockResolvedValue([chatRow])

    const { default: handler } = await import('../chats.post')

    const event = { context: {}, path: '/api/chats' } as any
    const result = await handler(event)

    expect(result).toHaveProperty('id', 'new-chat-1')
    expect(mockCheckDailyLimit).toHaveBeenCalledWith(mockUser.id)
  })

  it('should create chat with custom model', async () => {
    const chatRow = { id: 'new-chat-2', userId: mockUser.id, model: 'mimo-v2.5' }
    mockDbInsertReturning.mockResolvedValue([chatRow])

    const { default: handler } = await import('../chats.post')

    const event = { context: {}, path: '/api/chats' } as any
    const result = await handler(event)

    expect(result).toHaveProperty('id')
    expect(mockCheckDailyLimit).toHaveBeenCalled()
  })

  it('should accept options.thinkingMode without error', async () => {
    const chatRow = { id: 'new-chat-3', userId: mockUser.id }
    mockDbInsertReturning.mockResolvedValue([chatRow])

    // Override default body to include options
    mockReadValidatedBody.mockImplementationOnce(
      async (_event: unknown, validateFn?: (b: unknown) => unknown) => {
        const body = {
          model: 'deepseek-v4-pro',
          message: { id: 'msg-1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
          options: { thinkingMode: false }
        }
        return typeof validateFn === 'function' ? validateFn(body) : body
      }
    )

    const { default: handler } = await import('../chats.post')

    const event = { context: {}, path: '/api/chats' } as any
    const result = await handler(event)

    expect(result).toHaveProperty('id', 'new-chat-3')
  })
})
