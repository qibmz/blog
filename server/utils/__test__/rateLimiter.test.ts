import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockDbSelectResult } from './setup'

beforeEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
})

describe('getTodayCount', () => {
  it('should return the count from database', async () => {
    mockDbSelectResult.mockResolvedValue([{ total: 3 }])

    const { getTodayCount } = await import('../rateLimiter')
    const count = await getTodayCount('user-1')

    expect(count).toBe(3)
    expect(mockDbSelectResult).toHaveBeenCalled()
  })

  it('should return 0 when no rows returned', async () => {
    mockDbSelectResult.mockResolvedValue([])

    const { getTodayCount } = await import('../rateLimiter')
    const count = await getTodayCount('user-1')

    expect(count).toBe(0)
  })
})

describe('isDailyLimitEnabled', () => {
  it('should be disabled on Vercel Preview', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    vi.resetModules()
    const { isDailyLimitEnabled } = await import('../rateLimiter')
    expect(isDailyLimitEnabled()).toBe(false)
  })

  it('should be enabled on Production', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.resetModules()
    const { isDailyLimitEnabled } = await import('../rateLimiter')
    expect(isDailyLimitEnabled()).toBe(true)
  })
})

describe('checkDailyLimit', () => {
  it('should not throw when count < 5', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.resetModules()
    mockDbSelectResult.mockResolvedValue([{ total: 3 }])

    const { checkDailyLimit } = await import('../rateLimiter')
    await expect(checkDailyLimit('user-1')).resolves.toBeUndefined()
  })

  it('should throw 429 when count >= 5', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.resetModules()
    mockDbSelectResult.mockResolvedValue([{ total: 5 }])

    const { checkDailyLimit } = await import('../rateLimiter')
    await expect(checkDailyLimit('user-1')).rejects.toMatchObject({
      statusCode: 429
    })
  })

  it('should throw 429 when count exceeds 5', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.resetModules()
    mockDbSelectResult.mockResolvedValue([{ total: 7 }])

    const { checkDailyLimit } = await import('../rateLimiter')
    await expect(checkDailyLimit('user-1')).rejects.toMatchObject({
      statusCode: 429
    })
  })

  it('should skip limit on Preview', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    vi.resetModules()
    mockDbSelectResult.mockResolvedValue([{ total: 99 }])

    const { checkDailyLimit } = await import('../rateLimiter')
    await expect(checkDailyLimit('user-1')).resolves.toBeUndefined()
    expect(mockDbSelectResult).not.toHaveBeenCalled()
  })
})

describe('getRemainingToday', () => {
  it('should return null on Preview', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    vi.resetModules()

    const { getRemainingToday } = await import('../rateLimiter')
    await expect(getRemainingToday('user-1')).resolves.toBeNull()
  })

  it('should return remaining count on Production', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.resetModules()
    mockDbSelectResult.mockResolvedValue([{ total: 2 }])

    const { getRemainingToday } = await import('../rateLimiter')
    await expect(getRemainingToday('user-1')).resolves.toBe(3)
  })
})
