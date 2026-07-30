import type { UIMessage } from 'ai'

export interface PendingChat {
  id: string
  message: UIMessage
  model: string
  options: { thinkingMode: boolean }
}

/** 新建对话时的乐观跳转载荷，跨 /chat → /chat/:id 传递首条消息 */
export function usePendingChat() {
  return useState<PendingChat | null>('pending-chat', () => null)
}
