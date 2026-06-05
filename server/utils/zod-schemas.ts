import { z } from 'zod'

const UIMessagePartSchema = z.looseObject({
  type: z.string(),
  text: z.string().optional()
})

export const UIMessageSchema = z.looseObject({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  parts: z.array(UIMessagePartSchema)
})
