import { defineEventHandler } from 'h3'
import { eq, desc, and, isNull } from 'drizzle-orm'
import { getRemainingToday, DAILY_LIMIT, isDailyLimitEnabled } from '../utils/rateLimiter'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) {
    return {
      chats: [],
      remainingToday: isDailyLimitEnabled() ? DAILY_LIMIT : null,
      dailyLimit: isDailyLimitEnabled() ? DAILY_LIMIT : null
    }
  }

  const [chats, remainingToday] = await Promise.all([
    db.query.chats.findMany({
      where: and(eq(schema.chats.userId, session.user.id), isNull(schema.chats.deletedAt)),
      orderBy: () => [desc(schema.chats.pinned), desc(schema.chats.createdAt)]
    }),
    getRemainingToday(session.user.id)
  ])

  return {
    chats,
    remainingToday,
    dailyLimit: isDailyLimitEnabled() ? DAILY_LIMIT : null
  }
})
