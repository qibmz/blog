/** 根据首条用户消息生成临时会话标题（截取文本 / 图片对话 / 新对话） */
export function getProvisionalChatTitle(
  parts: Array<{ type: string, text?: string }> | null | undefined
): string {
  const list = parts ?? []
  const userText = list
    .filter(p => p.type === 'text')
    .map(p => p.text ?? '')
    .join(' ')
    .trim()
  const hasFiles = list.some(p => p.type === 'file')
  return userText.slice(0, 15) || (hasFiles ? '图片对话' : '新对话')
}
