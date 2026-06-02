import { defineEventHandler } from 'h3'
import { eq, desc } from 'drizzle-orm'
import { getTodayCount, DAILY_LIMIT } from '../utils/rateLimiter'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const [chats, todayCount] = await Promise.all([
    db.query.chats.findMany({
      where: eq(schema.chats.userId, user.id),
      orderBy: () => desc(schema.chats.createdAt)
    }),
    getTodayCount(user.id)
  ])

  return {
    chats,
    remainingToday: Math.max(0, DAILY_LIMIT - todayCount)
  }
})
