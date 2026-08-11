import type { Hotspot, HotspotConfig, HotspotDraft } from '#shared/types/hotspot'
import { HotspotConfigSchema } from '#shared/types/hotspot'

export function createHotspotId(): string {
  return `area_${Math.random().toString(36).slice(2, 9)}`
}

export function createEmptyDraft(shape: HotspotDraft['shape'] = 'rect'): HotspotDraft {
  return {
    id: createHotspotId(),
    shape,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    radius: 0,
    points: [],
    title: '',
    action: { type: 'navigate', value: '' }
  }
}

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

export function parsePoints(points: string | undefined): number[] {
  if (!points) return []
  return points
    .split(',')
    .map(s => parsePct(s.trim()))
    .filter(n => Number.isFinite(n))
}

export function formatPoints(points: number[]): string {
  return points.map(toPctString).join(',')
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

export function draftToHotspot(draft: HotspotDraft): Hotspot {
  const base: Hotspot = {
    id: draft.id,
    shape: draft.shape,
    title: draft.title || undefined,
    action: { ...draft.action }
  }

  if (draft.shape === 'rect') {
    return {
      ...base,
      x: toPctString(draft.x),
      y: toPctString(draft.y),
      width: toPctString(draft.width),
      height: toPctString(draft.height)
    }
  }

  if (draft.shape === 'circle') {
    return {
      ...base,
      x: toPctString(draft.x),
      y: toPctString(draft.y),
      radius: toPctString(draft.radius)
    }
  }

  return {
    ...base,
    points: formatPoints(draft.points)
  }
}

export function hotspotToDraft(hotspot: Hotspot): HotspotDraft {
  return {
    id: hotspot.id,
    shape: hotspot.shape,
    x: parsePct(hotspot.x),
    y: parsePct(hotspot.y),
    width: parsePct(hotspot.width),
    height: parsePct(hotspot.height),
    radius: parsePct(hotspot.radius),
    points: parsePoints(hotspot.points),
    title: hotspot.title ?? '',
    action: { ...hotspot.action }
  }
}

export function draftsToConfig(
  drafts: HotspotDraft[],
  meta: Pick<HotspotConfig, 'bgImage' | 'width' | 'height'>
): HotspotConfig {
  return {
    bgImage: meta.bgImage,
    width: meta.width,
    height: meta.height,
    hotspots: drafts.map(draftToHotspot)
  }
}

export function parseHotspotConfig(input: unknown): HotspotConfig {
  return HotspotConfigSchema.parse(input)
}

export function tryParseHotspotConfig(text: string): { ok: true, data: HotspotConfig } | { ok: false, error: string } {
  try {
    const json = JSON.parse(text) as unknown
    const data = parseHotspotConfig(json)
    return { ok: true, data }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'JSON 解析失败'
    }
  }
}

export function configToDrafts(config: HotspotConfig): HotspotDraft[] {
  return config.hotspots.map(hotspotToDraft)
}

/** 平移多边形所有顶点 */
export function translatePoints(points: number[], dx: number, dy: number): number[] {
  const next = [...points]
  for (let i = 0; i < next.length; i += 2) {
    next[i] = clamp(roundPct(next[i]! + dx))
    next[i + 1] = clamp(roundPct(next[i + 1]! + dy))
  }
  return next
}

/** 多边形包围盒（百分比） */
export function polygonBounds(points: number[]): { x: number, y: number, width: number, height: number } {
  if (points.length < 2) return { x: 0, y: 0, width: 0, height: 0 }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (let i = 0; i < points.length; i += 2) {
    minX = Math.min(minX, points[i]!)
    maxX = Math.max(maxX, points[i]!)
    minY = Math.min(minY, points[i + 1]!)
    maxY = Math.max(maxY, points[i + 1]!)
  }
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}

/** SVG polygon points 属性（viewBox 0 0 100 100） */
export function toSvgPoints(points: number[]): string {
  const pairs: string[] = []
  for (let i = 0; i < points.length; i += 2) {
    pairs.push(`${points[i]},${points[i + 1]}`)
  }
  return pairs.join(' ')
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  // 延迟 revoke，避免 Firefox 等浏览器取消尚未开始的下载
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
