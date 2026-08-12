import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockDbFindMany, mockUser } from '../../utils/__test__/setup'

const mockGetTodayCount = vi.fn()
const mockGetRemainingToday = vi.fn()
const mockIsDailyLimitEnabled = vi.fn(() => true)

vi.mock('../../utils/rateLimiter', () => ({
  getTodayCount: mockGetTodayCount,
  getRemainingToday: mockGetRemainingToday,
  checkDailyLimit: vi.fn(),
  DAILY_LIMIT: 5,
  isDailyLimitEnabled: () => mockIsDailyLimitEnabled()
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockIsDailyLimitEnabled.mockReturnValue(true)
})

describe('GET /api/chats', () => {
  it('should return chats list and remaining count', async () => {
    const mockChats = [
      { id: 'chat-1', userId: mockUser.id, title: 'Test Chat', model: 'deepseek-v4-pro', createdAt: new Date() }
    ]
    mockDbFindMany.mockResolvedValue(mockChats)
    mockGetRemainingToday.mockResolvedValue(3)

    const { default: handler } = await import('../chats.get')
    const event = { context: {}, path: '/api/chats' } as any
    const result = await handler(event)

    expect(result).toHaveProperty('chats')
    expect(result).toHaveProperty('remainingToday')
    expect(result.chats).toEqual(mockChats)
    expect(result.remainingToday).toBe(3)
    expect(result.dailyLimit).toBe(5)
  })

  it('should return empty chats array for new user', async () => {
    mockDbFindMany.mockResolvedValue([])
    mockGetRemainingToday.mockResolvedValue(5)

    const { default: handler } = await import('../chats.get')
    const event = { context: {}, path: '/api/chats' } as any
    const result = await handler(event)

    expect(result.chats).toEqual([])
    expect(result.remainingToday).toBe(5)
  })

  it('should return 0 remaining when limit reached', async () => {
    mockDbFindMany.mockResolvedValue([])
    mockGetRemainingToday.mockResolvedValue(0)

    const { default: handler } = await import('../chats.get')
    const event = { context: {}, path: '/api/chats' } as any
    const result = await handler(event)

    expect(result.remainingToday).toBe(0)
  })

  it('should return unlimited on Preview', async () => {
    mockIsDailyLimitEnabled.mockReturnValue(false)
    mockDbFindMany.mockResolvedValue([])
    mockGetRemainingToday.mockResolvedValue(null)

    const { default: handler } = await import('../chats.get')
    const event = { context: {}, path: '/api/chats' } as any
    const result = await handler(event)

    expect(result.remainingToday).toBeNull()
    expect(result.dailyLimit).toBeNull()
  })

  it('should return empty data for unauthenticated users', async () => {
    vi.stubGlobal('getUserSession', () => Promise.resolve(null))

    const { default: handler } = await import('../chats.get')
    const event = { context: {}, path: '/api/chats' } as any
    const result = await handler(event)

    expect(result).toEqual({ chats: [], remainingToday: 5, dailyLimit: 5 })
    expect(mockDbFindMany).not.toHaveBeenCalled()
    expect(mockGetRemainingToday).not.toHaveBeenCalled()
  })
})
