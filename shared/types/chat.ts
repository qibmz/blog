import { z } from 'zod'

// ─── 消息结构 ────────────────────────────────────

const UIMessagePartSchema = z.intersection(
  z.object({ type: z.string() }),
  z.union([
    z.object({ type: z.literal('text'), text: z.string() }),
    z.object({ type: z.literal('file'), url: z.string(), mediaType: z.string(), filename: z.string().optional() }),
    // reasoning、tool-call、data 等其他 part 类型
    // passthrough 保留未知字段，refine 排除 text/file 避免误匹配
    z.object({ type: z.string() }).passthrough().refine(
      (p): p is { type: string } & Record<string, unknown> =>
        p.type !== 'text' && p.type !== 'file',
      { message: 'Unknown part type should not match text/file literal' }
    )
  ])
)

export const UIMessageSchema = z.looseObject({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  parts: z.array(UIMessagePartSchema)
})

// ─── POST /api/chats/:id 请求体 ──────────────────
// 多轮上下文由服务端从 DB 组装；客户端只传本轮触发信息。

export const PostChatBodySchema = z.object({
  model: z.string().optional(),
  /** submit-message 时必填；regenerate 时可省略（服务端用 DB 最后一条 user） */
  message: UIMessageSchema.optional(),
  trigger: z.enum(['submit-message', 'regenerate-message']).default('submit-message'),
  options: z.object({
    thinkingMode: z.boolean().optional(),
    webSearch: z.boolean().optional()
  }).optional()
}).superRefine((val, ctx) => {
  if (val.trigger === 'submit-message' && !val.message) {
    ctx.addIssue({
      code: 'custom',
      message: 'message is required for submit-message',
      path: ['message']
    })
  }
  if (val.message && val.message.role !== 'user') {
    ctx.addIssue({
      code: 'custom',
      message: 'message.role must be user',
      path: ['message', 'role']
    })
  }
})

export type PostChatBody = z.infer<typeof PostChatBodySchema>

// ─── PATCH /api/chats/:id 请求体 ──────────────────

export const PatchChatBodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('rename'), title: z.string().min(1).max(100) }),
  z.object({ action: z.literal('pin'), pinned: z.boolean() }),
  z.object({ action: z.literal('delete') })
])

export type PatchChatBody = z.infer<typeof PatchChatBodySchema>
