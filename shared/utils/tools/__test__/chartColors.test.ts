import { describe, expect, it } from 'vitest'
import { CHART_SLICE_PALETTE, resolveDonutSliceColor } from '../chartColors'

describe('resolveDonutSliceColor', () => {
  it('should prefer per-row color when valid hex', () => {
    expect(resolveDonutSliceColor({ name: 'A', value: 1, color: '#ef4444' }, 0, [
      { color: '#3b82f6' }
    ])).toBe('#ef4444')
  })

  it('should use distinct series colors when multiple provided', () => {
    const series = [{ color: '#111111' }, { color: '#222222' }, { color: '#333333' }]
    expect(resolveDonutSliceColor({ name: 'A', value: 1 }, 0, series)).toBe('#111111')
    expect(resolveDonutSliceColor({ name: 'B', value: 2 }, 1, series)).toBe('#222222')
    expect(resolveDonutSliceColor({ name: 'C', value: 3 }, 2, series)).toBe('#333333')
  })

  it('should fall back to palette when only one series color', () => {
    const series = [{ color: '#3b82f6' }]
    expect(resolveDonutSliceColor({ name: 'A', value: 1 }, 0, series)).toBe(CHART_SLICE_PALETTE[0])
    expect(resolveDonutSliceColor({ name: 'B', value: 2 }, 1, series)).toBe(CHART_SLICE_PALETTE[1])
    expect(resolveDonutSliceColor({ name: 'C', value: 3 }, 2, series)).toBe(CHART_SLICE_PALETTE[2])
  })
})
