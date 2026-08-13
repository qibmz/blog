import { tool } from 'ai'
import { z } from 'zod'
import type { UIToolInvocation } from 'ai'

export const chartTool = tool({
  description: '用折线图可视化数据。适合时间序列、趋势对比、多指标随时间变化。当用户要求画图、看趋势、对比数据时调用此工具，不要只用 markdown 表格代替。',
  inputSchema: z.object({
    title: z.string().optional().describe('图表标题'),
    data: z.array(z.record(z.string(), z.union([z.string(), z.number()]))).min(1).describe('数据点数组，每项必须包含 xKey 以及所有 series.key'),
    xKey: z.string().describe('横轴字段名，例如 month、date'),
    series: z.array(z.object({
      key: z.string().describe('该系列在 data 中的字段名'),
      name: z.string().describe('图例显示名'),
      color: z.string().describe('折线颜色，十六进制，如 #3b82f6')
    })).min(1).describe('至少一条折线'),
    xLabel: z.string().optional().describe('横轴标签'),
    yLabel: z.string().optional().describe('纵轴标签')
  }),
  execute: async ({ title, data, xKey, series, xLabel, yLabel }) => ({
    title,
    data,
    xKey,
    series,
    xLabel,
    yLabel
  })
})

export type ChartUIToolInvocation = UIToolInvocation<typeof chartTool>
