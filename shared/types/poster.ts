import { z } from 'zod'

export const PosterLayerTypeSchema = z.enum(['text', 'image'])

const PctStringSchema = z.string().regex(/^-?\d+(\.\d+)?%$/, '须为百分比字符串，如 12.5%')

/** 图层公共几何（百分比，相对设计稿） */
const PosterLayerBaseSchema = z.object({
  id: z.string(),
  x: PctStringSchema,
  y: PctStringSchema,
  width: PctStringSchema,
  height: PctStringSchema,
  opacity: z.number().min(0).max(1).optional(),
  /** 旋转角度（度），可选 */
  rotation: z.number().optional()
})

export const PosterTextLayerSchema = PosterLayerBaseSchema.extend({
  type: z.literal('text'),
  /** 静态文案；未绑定字段或接口缺值时用作兜底 / 编辑预览 */
  content: z.string(),
  /**
   * 可选：接口数据字段路径，支持点号嵌套，如 `nickname` / `product.title`
   * C 端渲染时优先取 data[field]，取不到则回退 content
   */
  field: z.string().optional(),
  /** 字号：相对设计稿高度的百分比 */
  fontSize: PctStringSchema,
  fontFamily: z.string().optional(),
  fontWeight: z.union([z.string(), z.number()]).optional(),
  color: z.string().optional(),
  textAlign: z.enum(['left', 'center', 'right']).optional(),
  lineHeight: z.number().positive().optional()
})

export const PosterImageLayerSchema = PosterLayerBaseSchema.extend({
  type: z.literal('image'),
  src: z.string(),
  objectFit: z.enum(['contain', 'cover', 'fill']).optional()
})

export const PosterLayerSchema = z.discriminatedUnion('type', [
  PosterTextLayerSchema,
  PosterImageLayerSchema
])

export const PosterConfigSchema = z.object({
  bgImage: z.string(),
  bgColor: z.string().optional(),
  width: z.number().positive(),
  height: z.number().positive(),
  /** 数组顺序即绘制顺序（先底层后上层） */
  layers: z.array(PosterLayerSchema)
})

export type PosterLayerType = z.infer<typeof PosterLayerTypeSchema>
export type PosterTextLayer = z.infer<typeof PosterTextLayerSchema>
export type PosterImageLayer = z.infer<typeof PosterImageLayerSchema>
export type PosterLayer = z.infer<typeof PosterLayerSchema>
export type PosterConfig = z.infer<typeof PosterConfigSchema>

export type PosterTextAlign = NonNullable<PosterTextLayer['textAlign']>
export type PosterObjectFit = NonNullable<PosterImageLayer['objectFit']>

/** 编辑器内部用数值百分比（0–100） */
export interface PosterLayerDraft {
  id: string
  type: PosterLayerType
  x: number
  y: number
  width: number
  height: number
  opacity: number
  rotation: number
  // text
  content: string
  /** 接口字段路径，空字符串表示纯静态文案 */
  field: string
  fontSize: number
  fontFamily: string
  fontWeight: string
  color: string
  textAlign: PosterTextAlign
  lineHeight: number
  // image
  src: string
  objectFit: PosterObjectFit
}

export type PosterEditorTool = 'select' | 'text' | 'image'
