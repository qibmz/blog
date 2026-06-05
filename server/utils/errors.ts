import { createError } from 'h3'

/** 资源不存在 */
export function raiseNotFound(message = 'Not found') {
  return createError({ statusCode: 404, statusMessage: message })
}

/** 请求频率限制 */
export function raiseRateLimit(message: string) {
  return createError({ statusCode: 429, statusMessage: message })
}
