import { z } from 'zod'

// ─── 消息结构 ────────────────────────────────────

const UIMessagePartSchema = z.looseObject({
  type: z.string(),
  text: z.string().optional()
})

export const UIMessageSchema = z.looseObject({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  parts: z.array(UIMessagePartSchema)
})

// ─── PATCH /api/chats/:id 请求体 ──────────────────

export const PatchChatBodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('rename'), title: z.string().min(1).max(100) }),
  z.object({ action: z.literal('pin'), pinned: z.boolean() }),
  z.object({ action: z.literal('delete') })
])

export type PatchChatBody = z.infer<typeof PatchChatBodySchema>
