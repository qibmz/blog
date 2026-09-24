import { tool } from 'ai'
import { z } from 'zod'
import type { UIToolInvocation } from 'ai'

export const chartTypes = ['line', 'area', 'bar', 'donut'] as const
export type ChartType = (typeof chartTypes)[number]

/** DeepSeek strict：object 全 required + additionalProperties:false；可选字段用 nullable */
const chartSeriesSchema = z.object({
  key: z.string().describe('系列字段名，与 data[].values 按下标对应'),
  name: z.string().describe('图例显示名'),
  color: z.string().describe('颜色，十六进制，如 #3b82f6')
})

const chartDataPointSchema = z.object({
  label: z.string().describe('横轴类别或 donut 扇区名称'),
  values: z.array(z.number()).describe('与 series 顺序一一对应的数值'),
  color: z.string().nullable().describe('donut 扇区颜色（十六进制）；非 donut 传 null')
})

export const chartToolInputSchema = z.object({
  type: z.enum(chartTypes).describe('图表类型：line / area / bar / donut'),
  title: z.string().nullable().describe('图表标题；无则 null'),
  data: z.array(chartDataPointSchema).describe('数据点数组（勿为空）'),
  series: z.array(chartSeriesSchema).describe('系列配置（勿为空）；与 data.values 下标对齐'),
  xLabel: z.string().nullable().describe('横轴标签；donut 或无则 null'),
  yLabel: z.string().nullable().describe('纵轴标签；donut 或无则 null')
})

export type ChartToolStrictInput = z.infer<typeof chartToolInputSchema>

/** 渲染用 payload（兼容历史消息里旧的自由 record 形态） */
export type ChartRenderPayload = {
  type: ChartType
  title?: string
  data: Array<Record<string, string | number>>
  xKey: string
  series: Array<{ key: string, name: string, color: string }>
  xLabel?: string
  yLabel?: string
}

export function isChartToolStrictInput(value: unknown): value is ChartToolStrictInput {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  if (!Array.isArray(v.data) || !Array.isArray(v.series) || v.data.length === 0 || v.series.length === 0) {
    return false
  }
  const first = v.data[0]
  return !!first
    && typeof first === 'object'
    && first !== null
    && 'label' in first
    && 'values' in first
}

/** strict 输入 → 前端 / 历史兼容的 chart payload */
export function mapChartToolInputToPayload(input: ChartToolStrictInput): ChartRenderPayload {
  const data = input.data.map((row) => {
    const point: Record<string, string | number> = { label: row.label }
    if (row.color) point.color = row.color
    input.series.forEach((s, i) => {
      point[s.key] = row.values[i] ?? 0
    })
    return point
  })

  return {
    type: input.type,
    ...(input.title ? { title: input.title } : {}),
    data,
    xKey: 'label',
    series: input.series,
    ...(input.xLabel ? { xLabel: input.xLabel } : {}),
    ...(input.yLabel ? { yLabel: input.yLabel } : {})
  }
}

export const chartTool = tool({
  description: `用图表可视化数据。支持 line（折线）、area（面积）、bar（柱状）、donut（环形）。
选择建议：趋势/时间序列用 line 或 area；分类对比用 bar；占比构成用 donut。
data[].values 必须与 series 按下标一一对应；donut 时为每个扇区设置不同的 data[].color。
当用户要求画图、看趋势、对比数据、看占比时调用此工具，不要只用 markdown 表格代替。`,
  strict: true,
  inputSchema: chartToolInputSchema,
  execute: async (input) => {
    if (input.data.length === 0 || input.series.length === 0) {
      throw new Error('chart data and series must be non-empty')
    }
    return mapChartToolInputToPayload(input)
  }
})

export type ChartUIToolInvocation = UIToolInvocation<typeof chartTool>
