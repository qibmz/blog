import { z } from 'zod'

// ─── 消息结构 ────────────────────────────────────

const UIMessagePartSchema = z.intersection(
  z.object({ type: z.string() }),
  z.union([
    z.object({ type: z.literal('text'), text: z.string() }),
    z.object({ type: z.literal('file'), url: z.string(), mediaType: z.string(), filename: z.string().optional() }),
    z.any() // reasoning, tool-call, data 等其他 part 类型
  ])
)

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
