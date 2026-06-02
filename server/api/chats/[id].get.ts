import { defineEventHandler, getValidatedRouterParams } from 'h3'
import { and, asc, eq } from 'drizzle-orm'
import { db, schema } from '../../db'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string()
  }).parse)

  const chat = await db.query.chats.findFirst({
    where: and(eq(schema.chats.id, id), eq(schema.chats.userId, user.id)),
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
