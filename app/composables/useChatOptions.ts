/**
 * Chat 选项 composable
 *
 * - 思考模式 (thinkingMode)：控制是否开启 AI 推理过程展示
 * - 联网搜索 (webSearch)：仅 MiMo 支持，开启后由模型意图识别是否搜索
 * - 使用 useCookie 持久化，刷新页面不丢失
 */

export function useChatOptions() {
  const thinkingMode = useCookie<boolean>('chat-thinking-mode', {
    default: () => true
  })

  const webSearch = useCookie<boolean>('chat-web-search', {
    default: () => false
  })

  return {
    thinkingMode,
    webSearch
  }
}
