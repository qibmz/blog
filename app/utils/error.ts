/**
 * 从各类错误对象中提取用户可读的错误消息
 *
 * 覆盖场景：
 * - ofetch FetchError（data.statusMessage / data.message）
 * - JSON 字符串 message（如 Chat SDK 内部 fetch）
 * - 普通 Error / 字符串
 */

const FALLBACK_MESSAGE = '系统异常，请稍后重试'

export function normalizeError(err: unknown): string {
  if (!err || typeof err !== 'object') return FALLBACK_MESSAGE

  const e = err as Record<string, unknown>

  // ofetch 将服务端 JSON body 反序列化到 data 字段
  if (e.data && typeof e.data === 'object') {
    const d = e.data as Record<string, unknown>
    if (typeof d.statusMessage === 'string') return d.statusMessage
    if (typeof d.message === 'string') return d.message
  }

  // message 可能是 JSON 字符串（Chat SDK / 部分 fetch 实现）
  if (typeof e.message === 'string') {
    try {
      const parsed = JSON.parse(e.message)
      if (parsed && typeof parsed === 'object') {
        if (typeof parsed.statusMessage === 'string') return parsed.statusMessage
        if (typeof parsed.message === 'string') return parsed.message
      }
    } catch { /* message 不是 JSON，直接使用 */ }
    return e.message
  }

  return err instanceof Error ? err.message : FALLBACK_MESSAGE
}
