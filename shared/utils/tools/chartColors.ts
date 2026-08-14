/** 环形/饼图扇区默认色板（模型常只给 1 个 series 色时兜底区分） */
export const CHART_SLICE_PALETTE = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#e11d48' // rose
] as const

const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

export function resolveDonutSliceColor(
  row: Record<string, string | number>,
  index: number,
  series: Array<{ color: string }>
): string {
  const rowColor = row.color
  if (typeof rowColor === 'string' && HEX_COLOR_RE.test(rowColor)) {
    return rowColor
  }

  // 模型为每个扇区准备了独立 series 色时优先用
  const uniqueSeriesColors = [...new Set(series.map(s => s.color).filter(Boolean))]
  if (uniqueSeriesColors.length > 1) {
    return uniqueSeriesColors[index % uniqueSeriesColors.length]!
  }

  return CHART_SLICE_PALETTE[index % CHART_SLICE_PALETTE.length]!
}
