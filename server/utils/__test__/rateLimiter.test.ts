import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockDbSelectResult } from './setup'

// 必须在导入被测模块前设置 mock 返回值，因为 getTodayCount 在模块顶层引用 db
beforeEach(() => {
  vi.clearAllMocks()
})

describe('getTodayCount', () => {
  it('should return the count from database', async () => {
    mockDbSelectResult.mockResolvedValue([{ total: 3 }])

    // 动态导入以使用当前 mock 状态
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

describe('checkDailyLimit', () => {
  it('should not throw when count < 5', async () => {
    mockDbSelectResult.mockResolvedValue([{ total: 3 }])

    const { checkDailyLimit } = await import('../rateLimiter')
    await expect(checkDailyLimit('user-1')).resolves.toBeUndefined()
  })

  it('should throw 429 when count >= 5', async () => {
    mockDbSelectResult.mockResolvedValue([{ total: 5 }])

    const { checkDailyLimit } = await import('../rateLimiter')
    await expect(checkDailyLimit('user-1')).rejects.toMatchObject({
      statusCode: 429
    })
  })

  it('should throw 429 when count exceeds 5', async () => {
    mockDbSelectResult.mockResolvedValue([{ total: 7 }])

    const { checkDailyLimit } = await import('../rateLimiter')
    await expect(checkDailyLimit('user-1')).rejects.toMatchObject({
      statusCode: 429
    })
  })
})
