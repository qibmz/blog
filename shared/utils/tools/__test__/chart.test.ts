import { describe, it, expect } from 'vitest'
import { chartTool } from '../chart'

describe('chartTool', () => {
  const baseInput = {
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

  const executeOpts = {
    toolCallId: 'call-1',
    messages: [],
    abortSignal: new AbortController().signal,
    context: {}
  }

  it('should echo chart payload from execute and default type to line', async () => {
    const result = await chartTool.execute!(
      { ...baseInput, type: 'line' },
      executeOpts
    )

    expect(result).toEqual({ ...baseInput, type: 'line' })
  })

  it('should echo bar / area / donut types', async () => {
    for (const type of ['bar', 'area', 'donut'] as const) {
      const result = await chartTool.execute!(
        { ...baseInput, type },
        executeOpts
      )
      expect(result).toEqual({ ...baseInput, type })
    }
  })
})
