/**
 * Chat 选项 composable
 *
 * - 思考模式 (thinkingMode)：控制是否开启 AI 推理过程展示
 * - 使用 useCookie 持久化，刷新页面不丢失
 *
 * 扩展方式：新增选项时在此追加 useCookie 字段，然后在
 * chat/index.vue 和 chat/[id].vue 的 transport body 中传递即可。
 */

export function useChatOptions() {
  const thinkingMode = useCookie<boolean>('chat-thinking-mode', {
    default: () => true
  })

  return {
    thinkingMode
  }
}
