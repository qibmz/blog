import { describe, it, expect } from 'vitest'
import {
  chartTool,
  isChartToolStrictInput,
  mapChartToolInputToPayload
} from '../chart'

describe('chartTool', () => {
  const baseInput = {
    type: 'line' as const,
    title: '月销售额',
    data: [
      { label: '1月', values: [100], color: null },
      { label: '2月', values: [140], color: null }
    ],
    series: [{ key: 'sales', name: '销售额', color: '#3b82f6' }],
    xLabel: '月份',
    yLabel: '金额'
  }

  const executeOpts = {
    toolCallId: 'call-1',
    messages: [],
    abortSignal: new AbortController().signal,
    context: {}
  }

  it('should expose strict: true for DeepSeek beta tool calls', () => {
    expect(chartTool.strict).toBe(true)
  })

  it('should map strict input to render payload in execute', async () => {
    const result = await chartTool.execute!(baseInput, executeOpts)

    expect(result).toEqual({
      type: 'line',
      title: '月销售额',
      data: [
        { label: '1月', sales: 100 },
        { label: '2月', sales: 140 }
      ],
      xKey: 'label',
      series: baseInput.series,
      xLabel: '月份',
      yLabel: '金额'
    })
  })

  it('should echo bar / area / donut types via mapping', async () => {
    for (const type of ['bar', 'area', 'donut'] as const) {
      const result = await chartTool.execute!(
        { ...baseInput, type },
        executeOpts
      ) as Awaited<ReturnType<NonNullable<typeof chartTool.execute>>>
      expect(result).toMatchObject({ type })
    }
  })

  it('should detect and map strict input shape', () => {
    expect(isChartToolStrictInput(baseInput)).toBe(true)
    expect(isChartToolStrictInput({
      data: [{ month: '1月', sales: 1 }],
      xKey: 'month',
      series: [{ key: 'sales', name: 's', color: '#fff' }]
    })).toBe(false)

    expect(mapChartToolInputToPayload({
      ...baseInput,
      type: 'donut',
      data: [
        { label: 'A', values: [10], color: '#f00' },
        { label: 'B', values: [20], color: '#0f0' }
      ],
      title: null,
      xLabel: null,
      yLabel: null
    })).toEqual({
      type: 'donut',
      data: [
        { label: 'A', color: '#f00', sales: 10 },
        { label: 'B', color: '#0f0', sales: 20 }
      ],
      xKey: 'label',
      series: baseInput.series
    })
  })
})
