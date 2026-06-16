import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockDbFindFirst, mockDbUpdate, mockDbDelete, mockUser, mockReadValidatedBody } from '../../utils/__test__/setup'

beforeEach(() => {
  vi.clearAllMocks()
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
    expect(mockDbDelete).toHaveBeenCalled()
  })

  it('should return 404 when chat not found', async () => {
    mockDbFindFirst.mockResolvedValue(null)
    patchBody({ action: 'rename', title: 'X' })

    const { default: handler } = await import('../chats/[id].patch')
    const event = { context: {}, path: '/api/chats/nonexistent' } as any
    await expect(handler(event)).rejects.toMatchObject({ statusCode: 404 })
  })
})
