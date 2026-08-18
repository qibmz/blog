import type { ChartType } from './chart'
import { resolveDonutSliceColor } from './chartColors'

export type ChartPayload = {
  type?: ChartType
  title?: string
  data: Array<Record<string, string | number>>
  xKey: string
  series: Array<{ key: string, name: string, color: string }>
  xLabel?: string
  yLabel?: string
}

export function isChartPayload(value: unknown): value is ChartPayload {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return Array.isArray(v.data)
    && v.data.length > 0
    && typeof v.xKey === 'string'
    && Array.isArray(v.series)
    && v.series.length > 0
}

export function normalizeChartType(type: ChartPayload['type']): ChartType {
  return type === 'area' || type === 'bar' || type === 'donut' ? type : 'line'
}

function toNumber(value: string | number | undefined): number {
  if (typeof value === 'number') return value
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

/** 将 chart tool payload 转成 ECharts option */
export function buildChartOption(
  payload: ChartPayload,
  theme: 'light' | 'dark' = 'dark'
): Record<string, unknown> {
  const type = normalizeChartType(payload.type)
  const textColor = theme === 'dark' ? '#a1a1aa' : '#71717a'
  const splitLineColor = theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  const categories = payload.data.map(row => String(row[payload.xKey] ?? ''))

  if (type === 'donut') {
    const valueKey = payload.series[0]!.key
    return {
      color: payload.data.map((row, index) =>
        resolveDonutSliceColor(row, index, payload.series)
      ),
      tooltip: { trigger: 'item' },
      legend: {
        bottom: 0,
        textStyle: { color: textColor }
      },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 4,
            borderColor: theme === 'dark' ? '#0b1220' : '#ffffff',
            borderWidth: 2
          },
          label: { color: textColor },
          data: payload.data.map((row, index) => ({
            name: String(row[payload.xKey] ?? `项${index + 1}`),
            value: toNumber(row[valueKey]),
            itemStyle: {
              color: resolveDonutSliceColor(row, index, payload.series)
            }
          }))
        }
      ]
    }
  }

  const seriesType = type === 'bar' ? 'bar' : 'line'
  return {
    color: payload.series.map(s => s.color),
    tooltip: { trigger: 'axis' },
    legend: {
      top: 0,
      textStyle: { color: textColor }
    },
    grid: {
      left: 48,
      right: 24,
      top: 40,
      bottom: payload.xLabel ? 48 : 32
    },
    xAxis: {
      type: 'category',
      data: categories,
      name: payload.xLabel,
      nameTextStyle: { color: textColor },
      axisLabel: { color: textColor },
      axisLine: { lineStyle: { color: splitLineColor } }
    },
    yAxis: {
      type: 'value',
      name: payload.yLabel,
      nameTextStyle: { color: textColor },
      axisLabel: { color: textColor },
      splitLine: { lineStyle: { color: splitLineColor } }
    },
    series: payload.series.map(serie => ({
      name: serie.name,
      type: seriesType,
      smooth: type !== 'bar',
      showSymbol: type === 'line',
      areaStyle: type === 'area' ? { opacity: 0.25 } : undefined,
      itemStyle: { color: serie.color },
      lineStyle: type === 'bar' ? undefined : { color: serie.color },
      data: payload.data.map(row => toNumber(row[serie.key]))
    }))
  }
}
