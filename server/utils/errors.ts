import { createError } from 'h3'

/** 资源不存在 */
export function raiseNotFound(message = 'Not found') {
  return createError({ statusCode: 404, statusMessage: message })
}

/** 请求频率限制 */
export function raiseRateLimit(message: string) {
  return createError({ statusCode: 429, statusMessage: message })
}

/** 资源冲突（如主键重复） */
export function raiseConflict(message = 'Conflict') {
  return createError({ statusCode: 409, statusMessage: message })
}

/** PostgreSQL unique_violation */
export function isUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  return (err as { code?: unknown }).code === '23505'
}
