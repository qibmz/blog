import type { Hotspot, HotspotConfig, HotspotDraft } from '#shared/types/hotspot'
import { HotspotConfigSchema } from '#shared/types/hotspot'
import { clamp, parsePct, roundPct, toPctString } from './geometry'

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

export function draftsToHotspotConfig(
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

export function hotspotConfigToDrafts(config: HotspotConfig): HotspotDraft[] {
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
