import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockDbFindMany, mockUser } from '../../utils/__test__/setup'

// Mock rate limiter getTodayCount
const mockGetTodayCount = vi.fn()

vi.mock('../../utils/rateLimiter', () => ({
  getTodayCount: mockGetTodayCount,
  checkDailyLimit: vi.fn(),
  DAILY_LIMIT: 5
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/chats', () => {
  it('should return chats list and remaining count', async () => {
    const mockChats = [
      { id: 'chat-1', userId: mockUser.id, title: 'Test Chat', model: 'deepseek-v4-pro', createdAt: new Date() }
    ]
    mockDbFindMany.mockResolvedValue(mockChats)
    mockGetTodayCount.mockResolvedValue(2)

    const { default: handler } = await import('../chats.get')
    const event = { context: {}, path: '/api/chats' } as any
    const result = await handler(event)

    expect(result).toHaveProperty('chats')
    expect(result).toHaveProperty('remainingToday')
    expect(result.chats).toEqual(mockChats)
    expect(result.remainingToday).toBe(3) // 5 - 2 = 3
  })

  it('should return empty chats array for new user', async () => {
    mockDbFindMany.mockResolvedValue([])
    mockGetTodayCount.mockResolvedValue(0)

    const { default: handler } = await import('../chats.get')
    const event = { context: {}, path: '/api/chats' } as any
    const result = await handler(event)

    expect(result.chats).toEqual([])
    expect(result.remainingToday).toBe(5)
  })

  it('should return 0 remaining when limit reached', async () => {
    mockDbFindMany.mockResolvedValue([])
    mockGetTodayCount.mockResolvedValue(5)

    const { default: handler } = await import('../chats.get')
    const event = { context: {}, path: '/api/chats' } as any
    const result = await handler(event)

    expect(result.remainingToday).toBe(0)
  })

  it('should return empty data for unauthenticated users', async () => {
    // Override global stub: getUserSession returns null (no session)
    vi.stubGlobal('getUserSession', () => Promise.resolve(null))

    const { default: handler } = await import('../chats.get')
    const event = { context: {}, path: '/api/chats' } as any
    const result = await handler(event)

    expect(result).toEqual({ chats: [], remainingToday: 5 })
    // db and rateLimiter should NOT be called for unauthenticated users
    expect(mockDbFindMany).not.toHaveBeenCalled()
    expect(mockGetTodayCount).not.toHaveBeenCalled()
  })
})
