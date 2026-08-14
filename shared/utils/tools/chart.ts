import { tool } from 'ai'
import { z } from 'zod'
import type { UIToolInvocation } from 'ai'

export const chartTypes = ['line', 'area', 'bar', 'donut'] as const
export type ChartType = (typeof chartTypes)[number]

const chartSeriesSchema = z.object({
  key: z.string().describe('该系列在 data 中的字段名'),
  name: z.string().describe('图例显示名'),
  color: z.string().describe('颜色，十六进制，如 #3b82f6')
})

export const chartTool = tool({
  description: `用图表可视化数据。支持 line（折线）、area（面积）、bar（柱状）、donut（环形）。
选择建议：趋势/时间序列用 line 或 area；分类对比用 bar；占比构成用 donut。
当用户要求画图、看趋势、对比数据、看占比时调用此工具，不要只用 markdown 表格代替。`,
  inputSchema: z.object({
    type: z.enum(chartTypes).default('line').describe('图表类型：line / area / bar / donut'),
    title: z.string().optional().describe('图表标题'),
    data: z.array(z.record(z.string(), z.union([z.string(), z.number()]))).min(1)
      .describe('数据点数组。line/area/bar：每项含 xKey 与所有 series.key；donut：每项是一个扇区，含 xKey（名称）与 series[0].key（数值）'),
    xKey: z.string().describe('横轴/扇区名称字段，例如 month、date、name'),
    series: z.array(chartSeriesSchema).min(1)
      .describe('系列配置。line/area/bar 可多系列；donut 通常 1 个数值系列，可用多个 series 颜色轮询扇区'),
    xLabel: z.string().optional().describe('横轴标签（donut 可忽略）'),
    yLabel: z.string().optional().describe('纵轴标签（donut 可忽略）')
  }),
  execute: async ({ type = 'line', title, data, xKey, series, xLabel, yLabel }) => ({
    type,
    title,
    data,
    xKey,
    series,
    xLabel,
    yLabel
  })
})

export type ChartUIToolInvocation = UIToolInvocation<typeof chartTool>
