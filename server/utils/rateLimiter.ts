import { raiseRateLimit } from './errors'
import { and, eq, gte, sql } from 'drizzle-orm'

export const DAILY_LIMIT = 5

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
 * 注意：check-then-insert 非事务性，高并发下可能超出限制。
 * 彻底修复需要将 count + insert 包裹在 Drizzle 事务中，并解决 NeonHttpDatabase
 * tx 类型不兼容的问题。
 */
export async function checkDailyLimit(userId: string): Promise<void> {
  const count = await getTodayCount(userId)
  if (count >= DAILY_LIMIT) {
    throw raiseRateLimit(`每日提问次数已达上限（${DAILY_LIMIT} 次）`)
  }
}
