import { defineEventHandler, getValidatedRouterParams } from 'h3'
import { and, asc, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string()
  }).parse)

  const chat = await db.query.chats.findFirst({
    where: and(eq(schema.chats.id, id), eq(schema.chats.userId, user.id), isNull(schema.chats.deletedAt)),
    with: {
      messages: {
        orderBy: () => asc(schema.messages.createdAt)
      }
    }
  })

  if (!chat) {
    throw raiseNotFound('Chat not found')
  }

  return chat
})
