import { describe, it, expect } from 'vitest'
import { chartTool } from '../chart'

describe('chartTool', () => {
  it('should echo chart payload from execute', async () => {
    const input = {
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

    const result = await chartTool.execute!(
      input,
      {
        toolCallId: 'call-1',
        messages: [],
        abortSignal: new AbortController().signal,
        context: {}
      }
    )

    expect(result).toEqual(input)
  })
})
