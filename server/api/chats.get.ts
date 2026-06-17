import { defineEventHandler } from 'h3'
import { eq, desc } from 'drizzle-orm'
import { getTodayCount, DAILY_LIMIT } from '../utils/rateLimiter'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    return { chats: [], remainingToday: DAILY_LIMIT }
  }

  const [chats, todayCount] = await Promise.all([
    db.query.chats.findMany({
      where: eq(schema.chats.userId, session.user.id),
      orderBy: () => [desc(schema.chats.pinned), desc(schema.chats.createdAt)]
    }),
    getTodayCount(session.user.id)
  ])

  return {
    chats,
    remainingToday: Math.max(0, DAILY_LIMIT - todayCount)
  }
})
