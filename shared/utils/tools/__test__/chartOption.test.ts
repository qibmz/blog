import { describe, expect, it } from 'vitest'
import { buildChartOption, isChartPayload, normalizeChartType } from '../chartOption'
import { CHART_SLICE_PALETTE } from '../chartColors'

const base = {
  title: '月销售额',
  data: [
    { month: '1月', sales: 100 },
    { month: '2月', sales: 140 }
  ],
  xKey: 'month',
  series: [{ key: 'sales', name: '销售额', color: '#3b82f6' }],
  xLabel: '月份',
  yLabel: '金额'
}

describe('chartOption', () => {
  it('should validate chart payload', () => {
    expect(isChartPayload(base)).toBe(true)
    expect(isChartPayload({ data: [] })).toBe(false)
  })

  it('should normalize unknown type to line', () => {
    expect(normalizeChartType(undefined)).toBe('line')
    expect(normalizeChartType('bar')).toBe('bar')
  })

  it('should build line option', () => {
    const option = buildChartOption({ ...base, type: 'line' })
    expect(option.xAxis).toEqual(expect.objectContaining({
      type: 'category',
      data: ['1月', '2月']
    }))
    expect(option.series).toEqual([
      expect.objectContaining({
        type: 'line',
        name: '销售额',
        data: [100, 140]
      })
    ])
  })

  it('should build area / bar options', () => {
    const areaSeries = buildChartOption({ ...base, type: 'area' }).series as Array<Record<string, unknown>>
    const barSeries = buildChartOption({ ...base, type: 'bar' }).series as Array<Record<string, unknown>>
    expect(areaSeries[0]).toEqual(
      expect.objectContaining({ type: 'line', areaStyle: { opacity: 0.25 } })
    )
    expect(barSeries[0]).toEqual(
      expect.objectContaining({ type: 'bar' })
    )
  })

  it('should build donut option with distinct slice colors', () => {
    const option = buildChartOption({
      type: 'donut',
      data: [
        { name: 'A', value: 10 },
        { name: 'B', value: 20 },
        { name: 'C', value: 30 }
      ],
      xKey: 'name',
      series: [{ key: 'value', name: '占比', color: '#3b82f6' }]
    })

    const series = (option.series as Array<{
      type: string
      data: Array<{ itemStyle: { color: string } }>
    }>)[0]!
    expect(series.type).toBe('pie')
    expect(series.data).toHaveLength(3)
    expect(series.data[0]!.itemStyle.color).toBe(CHART_SLICE_PALETTE[0])
    expect(series.data[1]!.itemStyle.color).toBe(CHART_SLICE_PALETTE[1])
    expect(series.data[2]!.itemStyle.color).toBe(CHART_SLICE_PALETTE[2])
  })
})
