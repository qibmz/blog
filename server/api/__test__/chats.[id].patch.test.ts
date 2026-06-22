import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createError } from 'h3'
import {
  mockDbFindFirst, mockDbUpdate, mockUser,
  mockReadValidatedBody, mockRequireUserSession
} from '../../utils/__test__/setup'

beforeEach(() => {
  vi.resetAllMocks()
  // 每个测试开始前恢复 requireUserSession 默认实现（带用户会话）
  vi.stubGlobal('requireUserSession', mockRequireUserSession)
})

function patchBody(body: { action: string, title?: string, pinned?: boolean }) {
  mockReadValidatedBody.mockImplementationOnce(
    async (_event: unknown, validateFn?: (b: unknown) => unknown) => {
      return typeof validateFn === 'function' ? validateFn(body) : body
    }
  )
}

const mockChat = {
  id: 'test-chat-id',
  userId: mockUser.id,
  title: 'Test Chat',
  model: 'deepseek-v4-pro',
  pinned: false
}

describe('PATCH /api/chats/[id]', () => {
  it('should rename a chat', async () => {
    mockDbFindFirst.mockResolvedValue(mockChat)
    patchBody({ action: 'rename', title: 'New Title' })

    const { default: handler } = await import('../chats/[id].patch')
    const event = { context: {}, path: '/api/chats/test-chat-id' } as any
    const result = await handler(event)

    expect(result).toHaveProperty('title', 'New Title')
    expect(mockDbUpdate).toHaveBeenCalled()
  })

  it('should pin a chat', async () => {
    mockDbFindFirst.mockResolvedValue(mockChat)
    patchBody({ action: 'pin', pinned: true })

    const { default: handler } = await import('../chats/[id].patch')
    const event = { context: {}, path: '/api/chats/test-chat-id' } as any
    const result = await handler(event)

    expect(result).toHaveProperty('pinned', true)
    expect(mockDbUpdate).toHaveBeenCalled()
  })

  it('should unpin a chat', async () => {
    mockDbFindFirst.mockResolvedValue({ ...mockChat, pinned: true })
    patchBody({ action: 'pin', pinned: false })

    const { default: handler } = await import('../chats/[id].patch')
    const event = { context: {}, path: '/api/chats/test-chat-id' } as any
    const result = await handler(event)

    expect(result).toHaveProperty('pinned', false)
    expect(mockDbUpdate).toHaveBeenCalled()
  })

  it('should delete a chat', async () => {
    mockDbFindFirst.mockResolvedValue(mockChat)
    patchBody({ action: 'delete' })

    const { default: handler } = await import('../chats/[id].patch')
    const event = { context: {}, path: '/api/chats/test-chat-id' } as any
    const result = await handler(event)

    expect(result).toEqual({ deleted: true })
    expect(mockDbUpdate).toHaveBeenCalled()
  })

  it('should return 404 when chat not found', async () => {
    mockDbFindFirst.mockResolvedValue(null)
    patchBody({ action: 'rename', title: 'X' })

    const { default: handler } = await import('../chats/[id].patch')
    const event = { context: {}, path: '/api/chats/nonexistent' } as any
    await expect(handler(event)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('should return 401 when not authenticated', async () => {
    // 覆盖 requireUserSession 为未登录状态
    vi.stubGlobal('requireUserSession', () => {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    })
    patchBody({ action: 'rename', title: 'X' })

    const { default: handler } = await import('../chats/[id].patch')
    const event = { context: {}, path: '/api/chats/test-chat-id' } as any
    await expect(handler(event)).rejects.toMatchObject({ statusCode: 401 })
  })
})
