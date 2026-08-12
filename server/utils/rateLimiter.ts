import { raiseRateLimit } from './errors'
import { and, eq, gte, sql } from 'drizzle-orm'

export const DAILY_LIMIT = 5

/** Preview（develop）不限每日次数；Production 与本地默认仍限流 */
export function isDailyLimitEnabled(): boolean {
  return process.env.VERCEL_ENV !== 'preview'
}

/** 返回今日已提问次数 */
export async function getTodayCount(userId: string): Promise<number> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [result] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(schema.messages)
    .innerJoin(schema.chats, eq(schema.messages.chatId, schema.chats.id))
    .where(and(
      eq(schema.chats.userId, userId),
      eq(schema.messages.role, 'user'),
      gte(schema.messages.createdAt, today)
    ))

  return result?.total ?? 0
}

/**
 * 超出限制则抛 429。
 * Preview 环境直接放行。
 * 注意：check-then-insert 非事务性，高并发下可能超出限制。
 */
export async function checkDailyLimit(userId: string): Promise<void> {
  if (!isDailyLimitEnabled()) return

  const count = await getTodayCount(userId)
  if (count >= DAILY_LIMIT) {
    throw raiseRateLimit(`每日提问次数已达上限（${DAILY_LIMIT} 次）`)
  }
}

/** 今日剩余次数；null 表示不限（Preview） */
export async function getRemainingToday(userId: string): Promise<number | null> {
  if (!isDailyLimitEnabled()) return null
  const count = await getTodayCount(userId)
  return Math.max(0, DAILY_LIMIT - count)
}
