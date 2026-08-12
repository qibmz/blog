/**
 * Chat 选项 composable
 *
 * - 思考模式 (thinkingMode)：控制是否开启 AI 推理过程展示
 * - 联网搜索 (webSearch)：仅 MiMo 支持；用户开启后强制注入 web_search
 * - 使用 useCookie 持久化，刷新页面不丢失
 */

/** Cookie 默认存字符串，必须编解码，否则 `"true" === true` 会失败导致联网搜索永不生效 */
function useBooleanCookie(name: string, defaultValue: boolean) {
  return useCookie<boolean>(name, {
    default: () => defaultValue,
    decode: value => value === 'true',
    encode: value => (value ? 'true' : 'false')
  })
}

export function useChatOptions() {
  const thinkingMode = useBooleanCookie('chat-thinking-mode', true)
  const webSearch = useBooleanCookie('chat-web-search', false)

  return {
    thinkingMode,
    webSearch
  }
}
