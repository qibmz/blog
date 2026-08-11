import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockDbInsertReturning, mockDbInsertValues, mockDbDelete, mockUser, mockReadValidatedBody } from '../../utils/__test__/setup'

const mockCheckDailyLimit = vi.fn()

vi.mock('../../utils/rateLimiter', () => ({
  getTodayCount: vi.fn(),
  checkDailyLimit: mockCheckDailyLimit,
  DAILY_LIMIT: 5
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockDbInsertValues.mockResolvedValue(undefined)
  mockDbDelete.mockResolvedValue(undefined)
})

describe('POST /api/chats', () => {
  it('should create a chat with first message', async () => {
    const chatRow = { id: 'new-chat-1', userId: mockUser.id, model: 'deepseek-v4-pro', title: 'Hello' }
    mockDbInsertReturning.mockResolvedValue([chatRow])

    const { default: handler } = await import('../chats.post')
    const { mockDb } = await import('../../utils/__test__/setup')

    const event = { context: {}, path: '/api/chats' } as any
    const result = await handler(event)

    expect(result).toHaveProperty('id', 'new-chat-1')
    expect(mockCheckDailyLimit).toHaveBeenCalledWith(mockUser.id)
    const valuesFn = mockDb.insert.mock.results[0]?.value?.values
    expect(valuesFn).toHaveBeenCalledWith(expect.objectContaining({ title: 'Hello' }))
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

  it('should accept client-provided chat id for optimistic navigation', async () => {
    const clientId = '550e8400-e29b-41d4-a716-446655440000'
    const chatRow = { id: clientId, userId: mockUser.id, model: 'deepseek-v4-pro' }
    mockDbInsertReturning.mockResolvedValue([chatRow])

    mockReadValidatedBody.mockImplementationOnce(
      async (_event: unknown, validateFn?: (b: unknown) => unknown) => {
        const body = {
          id: clientId,
          model: 'deepseek-v4-pro',
          message: { id: 'msg-1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }
        }
        return typeof validateFn === 'function' ? validateFn(body) : body
      }
    )

    const { default: handler } = await import('../chats.post')

    const event = { context: {}, path: '/api/chats' } as any
    const result = await handler(event)

    expect(result).toHaveProperty('id', clientId)
    expect(mockCheckDailyLimit).toHaveBeenCalledWith(mockUser.id)
  })

  it('should return 409 when client-provided chat id already exists', async () => {
    const clientId = '550e8400-e29b-41d4-a716-446655440000'
    mockDbInsertReturning.mockRejectedValueOnce({ code: '23505' })

    mockReadValidatedBody.mockImplementationOnce(
      async (_event: unknown, validateFn?: (b: unknown) => unknown) => {
        const body = {
          id: clientId,
          model: 'deepseek-v4-pro',
          message: { id: 'msg-1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }
        }
        return typeof validateFn === 'function' ? validateFn(body) : body
      }
    )

    const { default: handler } = await import('../chats.post')

    await expect(handler({ context: {}, path: '/api/chats' } as any)).rejects.toMatchObject({
      statusCode: 409,
      statusMessage: 'Chat already exists'
    })
  })

  it('should delete the chat when the first message insert fails', async () => {
    const chatRow = { id: 'orphan-chat', userId: mockUser.id, model: 'deepseek-v4-pro' }
    mockDbInsertReturning.mockResolvedValueOnce([chatRow])
    mockDbInsertValues.mockRejectedValueOnce(new Error('message insert failed'))

    const { default: handler } = await import('../chats.post')

    await expect(handler({ context: {}, path: '/api/chats' } as any)).rejects.toThrow('message insert failed')
    expect(mockDbDelete).toHaveBeenCalled()
  })
})
