import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockDbFindFirst, mockUser } from '../../utils/__test__/setup'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/chats/:id', () => {
  it('should return a chat with messages', async () => {
    const mockChat = {
      id: 'chat-1',
      userId: mockUser.id,
      title: 'Test Chat',
      model: 'deepseek-v4-pro',
      messages: [
        { id: 'msg-1', chatId: 'chat-1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
        { id: 'msg-2', chatId: 'chat-1', role: 'assistant', parts: [{ type: 'text', text: 'Hi there!' }] }
      ]
    }
    mockDbFindFirst.mockResolvedValue(mockChat)

    const { default: handler } = await import('../chats/[id].get')

    const event = { context: {}, path: '/api/chats/chat-1' } as any
    const result = await handler(event)

    expect(result).toEqual(mockChat)
  })

  it('should throw 404 when chat not found', async () => {
    mockDbFindFirst.mockResolvedValue(null)

    const { default: handler } = await import('../chats/[id].get')

    const event = { context: {}, path: '/api/chats/non-existent' } as any
    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 404
    })
  })
})
