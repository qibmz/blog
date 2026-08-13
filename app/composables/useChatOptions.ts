/**
 * Chat 选项 composable
 *
 * - 思考模式 (thinkingMode)：控制是否开启 AI 推理过程展示
 * - 联网搜索 (webSearch)：仅 MiMo 支持；用户开启后强制注入 web_search
 * - 二者互斥：开联网时关思考（MiMo 官方建议 tool 调用时关闭 thinking）
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

  // 兼容旧 cookie：曾同时为 true 时以联网为准，关掉思考
  if (webSearch.value && thinkingMode.value) {
    thinkingMode.value = false
  }

  function toggleThinkingMode() {
    const next = !thinkingMode.value
    thinkingMode.value = next
    if (next) webSearch.value = false
  }

  function toggleWebSearch() {
    const next = !webSearch.value
    webSearch.value = next
    if (next) thinkingMode.value = false
  }

  return {
    thinkingMode,
    webSearch,
    toggleThinkingMode,
    toggleWebSearch
  }
}
