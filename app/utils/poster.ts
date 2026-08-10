import type {
  PosterConfig,
  PosterLayer,
  PosterLayerDraft,
  PosterTextLayer,
  PosterImageLayer
} from '#shared/types/poster'
import { PosterConfigSchema } from '#shared/types/poster'
import { parsePct, toPctString } from './hotspot'

export {
  clamp,
  downloadJson,
  parsePct,
  roundPct,
  toPctString,
  pxToPct,
  pctToPx
} from './hotspot'

export function createPosterLayerId(type: PosterLayerDraft['type']): string {
  return `${type}_${Math.random().toString(36).slice(2, 9)}`
}

export function createEmptyLayerDraft(type: PosterLayerDraft['type']): PosterLayerDraft {
  const base = {
    id: createPosterLayerId(type),
    type,
    x: 10,
    y: 10,
    width: type === 'text' ? 40 : 30,
    height: type === 'text' ? 12 : 30,
    opacity: 1,
    rotation: 0,
    content: type === 'text' ? '在右侧编辑文案' : '',
    field: '',
    fontSize: 4,
    fontFamily: 'system-ui, sans-serif',
    fontWeight: '600',
    color: '#111827',
    textAlign: 'left' as const,
    lineHeight: 1.3,
    src: '',
    objectFit: 'contain' as const
  }
  return base
}

/** 从接口数据对象按点路径取值，如 product.title */
export function getByPath(data: unknown, path: string): unknown {
  if (!path || data == null) return undefined
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc == null || typeof acc !== 'object') return undefined
    return (acc as Record<string, unknown>)[key]
  }, data)
}

/** 解析文字图层最终展示文案：有 field 且 data 有值则用接口字段，否则用 content */
export function resolveTextContent(
  layer: Pick<PosterTextLayer, 'content' | 'field'>,
  data?: Record<string, unknown> | null
): string {
  const key = layer.field?.trim()
  if (key && data) {
    const value = getByPath(data, key)
    if (value != null && String(value) !== '') return String(value)
  }
  return layer.content
}

export function draftToLayer(draft: PosterLayerDraft): PosterLayer {
  const base = {
    id: draft.id,
    x: toPctString(draft.x),
    y: toPctString(draft.y),
    width: toPctString(draft.width),
    height: toPctString(draft.height),
    ...(draft.opacity !== 1 ? { opacity: draft.opacity } : {}),
    ...(draft.rotation !== 0 ? { rotation: draft.rotation } : {})
  }

  if (draft.type === 'text') {
    const field = draft.field.trim()
    const layer: PosterTextLayer = {
      ...base,
      type: 'text',
      content: draft.content,
      ...(field ? { field } : {}),
      fontSize: toPctString(draft.fontSize),
      ...(draft.fontFamily ? { fontFamily: draft.fontFamily } : {}),
      ...(draft.fontWeight ? { fontWeight: draft.fontWeight } : {}),
      ...(draft.color ? { color: draft.color } : {}),
      ...(draft.textAlign !== 'left' ? { textAlign: draft.textAlign } : {}),
      ...(draft.lineHeight !== 1.3 ? { lineHeight: draft.lineHeight } : {})
    }
    return layer
  }

  const layer: PosterImageLayer = {
    ...base,
    type: 'image',
    src: draft.src,
    ...(draft.objectFit !== 'contain' ? { objectFit: draft.objectFit } : {})
  }
  return layer
}

export function layerToDraft(layer: PosterLayer): PosterLayerDraft {
  const empty = createEmptyLayerDraft(layer.type)
  return {
    ...empty,
    id: layer.id,
    type: layer.type,
    x: parsePct(layer.x),
    y: parsePct(layer.y),
    width: parsePct(layer.width),
    height: parsePct(layer.height),
    opacity: layer.opacity ?? 1,
    rotation: layer.rotation ?? 0,
    content: layer.type === 'text' ? layer.content : '',
    field: layer.type === 'text' ? (layer.field ?? '') : '',
    fontSize: layer.type === 'text' ? parsePct(layer.fontSize, 4) : empty.fontSize,
    fontFamily: layer.type === 'text' ? (layer.fontFamily ?? empty.fontFamily) : empty.fontFamily,
    fontWeight: layer.type === 'text'
      ? String(layer.fontWeight ?? empty.fontWeight)
      : empty.fontWeight,
    color: layer.type === 'text' ? (layer.color ?? empty.color) : empty.color,
    textAlign: layer.type === 'text' ? (layer.textAlign ?? 'left') : 'left',
    lineHeight: layer.type === 'text' ? (layer.lineHeight ?? 1.3) : 1.3,
    src: layer.type === 'image' ? layer.src : '',
    objectFit: layer.type === 'image' ? (layer.objectFit ?? 'contain') : 'contain'
  }
}

export function draftsToConfig(
  drafts: PosterLayerDraft[],
  meta: Pick<PosterConfig, 'bgImage' | 'width' | 'height'> & { bgColor?: string }
): PosterConfig {
  return {
    bgImage: meta.bgImage,
    bgColor: meta.bgColor,
    width: meta.width,
    height: meta.height,
    layers: drafts.map(draftToLayer)
  }
}

export function configToDrafts(config: PosterConfig): PosterLayerDraft[] {
  return config.layers.map(layerToDraft)
}

export function parsePosterConfig(input: unknown): PosterConfig {
  return PosterConfigSchema.parse(input)
}

export function tryParsePosterConfig(text: string): { ok: true, data: PosterConfig } | { ok: false, error: string } {
  try {
    const json = JSON.parse(text) as unknown
    const data = parsePosterConfig(json)
    return { ok: true, data }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'JSON 解析失败'
    }
  }
}

/** 将图层在数组中上移一层（更靠上绘制） */
export function moveLayer(drafts: PosterLayerDraft[], id: string, direction: 'up' | 'down'): PosterLayerDraft[] {
  const index = drafts.findIndex(d => d.id === id)
  if (index < 0) return drafts
  const target = direction === 'up' ? index + 1 : index - 1
  if (target < 0 || target >= drafts.length) return drafts
  const next = [...drafts]
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item!)
  return next
}
