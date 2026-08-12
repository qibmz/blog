/** 百分比 / 画布坐标共用工具（热区与海报编辑器） */

/** 保留一位小数的百分比数值 */
export function roundPct(n: number): number {
  return Math.round(n * 10) / 10
}

export function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, n))
}

export function toPctString(n: number): string {
  return `${roundPct(n)}%`
}

export function parsePct(value: string | undefined, fallback = 0): number {
  if (!value) return fallback
  const n = Number.parseFloat(value.replace('%', ''))
  return Number.isFinite(n) ? n : fallback
}

/** 画布像素 → 百分比 */
export function pxToPct(px: number, total: number): number {
  if (total <= 0) return 0
  return roundPct((px / total) * 100)
}

/** 百分比 → 画布像素 */
export function pctToPx(pct: number, total: number): number {
  return (pct / 100) * total
}
