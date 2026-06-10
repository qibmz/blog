import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockDbInsertReturning, mockUser } from '../../utils/__test__/setup'

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
})
