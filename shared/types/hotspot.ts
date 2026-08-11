import { z } from 'zod'

/**
 * navigate：允许 http(s) 或无 scheme 的相对路径；拒绝 javascript: / data: 等。
 * download：仅允许 http(s)。
 * popup：任意文案。
 */
export function isSafeHotspotActionValue(
  type: 'navigate' | 'download' | 'popup',
  value: string
): boolean {
  const trimmed = value.trim()
  if (!trimmed) return true
  if (type === 'popup') return true
  if (type === 'download') return /^https?:\/\//i.test(trimmed)
  // 协议相对 URL（//evil.com）会被浏览器解析成外链，不能当相对路径
  if (trimmed.startsWith('//')) return false
  if (/^https?:\/\//i.test(trimmed)) return true
  return !/^[a-z][a-z0-9+.-]*:/i.test(trimmed)
}

export const HotspotActionSchema = z.object({
  type: z.enum(['navigate', 'download', 'popup']),
  value: z.string()
}).superRefine((action, ctx) => {
  if (!isSafeHotspotActionValue(action.type, action.value)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: action.type === 'download'
        ? 'download 仅支持 http(s) 链接'
        : 'navigate 仅支持 http(s) 或相对路径',
      path: ['value']
    })
  }
})

export const HotspotShapeSchema = z.enum(['rect', 'circle', 'polygon'])

/** 导出/存储用热区（百分比字符串） */
export const HotspotSchema = z.object({
  id: z.string(),
  shape: HotspotShapeSchema,
  x: z.string().optional(),
  y: z.string().optional(),
  width: z.string().optional(),
  height: z.string().optional(),
  radius: z.string().optional(),
  points: z.string().optional(),
  title: z.string().optional(),
  action: HotspotActionSchema
})

export const HotspotConfigSchema = z.object({
  bgImage: z.string(),
  width: z.number().positive(),
  height: z.number().positive(),
  hotspots: z.array(HotspotSchema)
})

export type HotspotAction = z.infer<typeof HotspotActionSchema>
export type HotspotShape = z.infer<typeof HotspotShapeSchema>
export type Hotspot = z.infer<typeof HotspotSchema>
export type HotspotConfig = z.infer<typeof HotspotConfigSchema>

/** 编辑器内部用数值百分比（0–100） */
export interface HotspotDraft {
  id: string
  shape: HotspotShape
  /** rect / circle 左上角或圆心 x% */
  x: number
  y: number
  /** rect */
  width: number
  height: number
  /** circle：相对设计稿宽度的半径 % */
  radius: number
  /** polygon: [x1, y1, x2, y2, ...] */
  points: number[]
  title: string
  action: HotspotAction
}

export type EditorTool = 'select' | 'rect' | 'circle' | 'polygon'
