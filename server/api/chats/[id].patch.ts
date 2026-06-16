import { defineEventHandler, getValidatedRouterParams, readValidatedBody } from 'h3'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

const PatchBodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('rename'), title: z.string().min(1).max(100) }),
  z.object({ action: z.literal('pin'), pinned: z.boolean() }),
  z.object({ action: z.literal('delete') })
])

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string()
  }).parse)

  const body = await readValidatedBody(event, PatchBodySchema.parse)

  // 验证所有权
  const chat = await db.query.chats.findFirst({
    where: and(eq(schema.chats.id, id), eq(schema.chats.userId, user.id))
  })

  if (!chat) {
    throw raiseNotFound('Chat not found')
  }

  switch (body.action) {
    case 'rename': {
      await db.update(schema.chats)
        .set({ title: body.title })
        .where(eq(schema.chats.id, id))
      return { ...chat, title: body.title }
    }
    case 'pin': {
      await db.update(schema.chats)
        .set({ pinned: body.pinned })
        .where(eq(schema.chats.id, id))
      return { ...chat, pinned: body.pinned }
    }
    case 'delete': {
      // messages 设置了 onDelete: cascade，自动级联删除
      await db.delete(schema.chats).where(eq(schema.chats.id, id))
      return { deleted: true }
    }
  }
})
