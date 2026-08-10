import type { PosterConfig, PosterImageLayer, PosterLayer, PosterTextLayer } from '#shared/types/poster'
import { parsePct, pctToPx, resolveTextContent } from './poster'

const imageCache = new Map<string, Promise<HTMLImageElement>>()

export type PosterRenderData = Record<string, unknown>

function throwIfAborted(signal?: AbortSignal) {
  if (!signal?.aborted) return
  const err = new Error('Aborted')
  err.name = 'AbortError'
  throw err
}

function loadImage(src: string): Promise<HTMLImageElement> {
  if (!src) {
    return Promise.reject(new Error('empty image src'))
  }
  const cached = imageCache.get(src)
  if (cached) return cached

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => {
      imageCache.delete(src)
      reject(new Error(`Failed to load image: ${src}`))
    }
    img.src = src
  })
  imageCache.set(src, promise)
  return promise
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  if (!text) return []
  const lines: string[] = []
  const paragraphs = text.split('\n')

  for (const paragraph of paragraphs) {
    if (!paragraph) {
      lines.push('')
      continue
    }

    let line = ''
    for (const ch of paragraph) {
      const next = line + ch
      if (ctx.measureText(next).width > maxWidth && line) {
        lines.push(line)
        line = ch
      } else {
        line = next
      }
    }
    if (line) lines.push(line)
  }

  return lines
}

function drawFittedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  fit: NonNullable<PosterImageLayer['objectFit']>
) {
  if (fit === 'fill') {
    ctx.drawImage(img, x, y, w, h)
    return
  }

  const scale
    = fit === 'cover'
      ? Math.max(w / img.naturalWidth, h / img.naturalHeight)
      : Math.min(w / img.naturalWidth, h / img.naturalHeight)

  const dw = img.naturalWidth * scale
  const dh = img.naturalHeight * scale
  const dx = x + (w - dw) / 2
  const dy = y + (h - dh) / 2

  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  ctx.drawImage(img, dx, dy, dw, dh)
  ctx.restore()
}

function drawTextLayer(
  ctx: CanvasRenderingContext2D,
  layer: PosterTextLayer,
  canvasW: number,
  canvasH: number,
  data?: PosterRenderData | null
) {
  const x = pctToPx(parsePct(layer.x), canvasW)
  const y = pctToPx(parsePct(layer.y), canvasH)
  const w = pctToPx(parsePct(layer.width), canvasW)
  const h = pctToPx(parsePct(layer.height), canvasH)
  const fontSize = pctToPx(parsePct(layer.fontSize, 4), canvasH)
  const align = layer.textAlign ?? 'left'
  const lineHeight = layer.lineHeight ?? 1.3
  const opacity = layer.opacity ?? 1
  const rotation = layer.rotation ?? 0
  const text = resolveTextContent(layer, data)

  ctx.save()
  ctx.globalAlpha = opacity

  const cx = x + w / 2
  const cy = y + h / 2
  if (rotation) {
    ctx.translate(cx, cy)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.translate(-cx, -cy)
  }

  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()

  ctx.font = `${layer.fontWeight ?? 400} ${fontSize}px ${layer.fontFamily ?? 'system-ui, sans-serif'}`
  ctx.fillStyle = layer.color ?? '#111827'
  ctx.textBaseline = 'top'
  ctx.textAlign = align

  const lines = wrapText(ctx, text, Math.max(0, w))
  const step = fontSize * lineHeight
  let textX = x
  if (align === 'center') textX = x + w / 2
  if (align === 'right') textX = x + w

  let textY = y
  for (const line of lines) {
    if (textY > y + h) break
    ctx.fillText(line, textX, textY)
    textY += step
  }

  ctx.restore()
}

async function drawImageLayer(
  ctx: CanvasRenderingContext2D,
  layer: PosterImageLayer,
  canvasW: number,
  canvasH: number
) {
  if (!layer.src) return

  const x = pctToPx(parsePct(layer.x), canvasW)
  const y = pctToPx(parsePct(layer.y), canvasH)
  const w = pctToPx(parsePct(layer.width), canvasW)
  const h = pctToPx(parsePct(layer.height), canvasH)
  const opacity = layer.opacity ?? 1
  const rotation = layer.rotation ?? 0
  const fit = layer.objectFit ?? 'contain'

  let img: HTMLImageElement
  try {
    img = await loadImage(layer.src)
  } catch {
    // 占位：失败时画虚线框
    ctx.save()
    ctx.globalAlpha = opacity
    ctx.strokeStyle = '#94a3b8'
    ctx.setLineDash([6, 4])
    ctx.strokeRect(x, y, w, h)
    ctx.restore()
    return
  }

  ctx.save()
  ctx.globalAlpha = opacity
  const cx = x + w / 2
  const cy = y + h / 2
  if (rotation) {
    ctx.translate(cx, cy)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.translate(-cx, -cy)
  }
  drawFittedImage(ctx, img, x, y, w, h, fit)
  ctx.restore()
}

async function drawLayer(
  ctx: CanvasRenderingContext2D,
  layer: PosterLayer,
  canvasW: number,
  canvasH: number,
  data?: PosterRenderData | null
) {
  if (layer.type === 'text') {
    drawTextLayer(ctx, layer, canvasW, canvasH, data)
    return
  }
  await drawImageLayer(ctx, layer, canvasW, canvasH)
}

/**
 * 将 PosterConfig 绘制到 canvas（C 端展示入口）。
 * @param displayWidth 展示宽度（CSS 像素）；高度按设计稿比例推算。不传则用设计稿尺寸。
 * @param data 可选业务数据；文字图层配置了 field 时从此取值。
 * @param signal 可选；中止进行中的渲染，避免并发绘制撕画布。
 */
export async function renderPosterToCanvas(
  canvas: HTMLCanvasElement,
  config: PosterConfig,
  displayWidth?: number,
  data?: PosterRenderData | null,
  signal?: AbortSignal
): Promise<{ width: number, height: number }> {
  throwIfAborted(signal)

  const aspect = config.height / config.width
  const cssW = displayWidth && displayWidth > 0 ? displayWidth : config.width
  const cssH = cssW * aspect
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1

  canvas.width = Math.round(cssW * dpr)
  canvas.height = Math.round(cssH * dpr)
  canvas.style.width = `${cssW}px`
  canvas.style.height = `${cssH}px`

  const ctx = canvas.getContext('2d')
  if (!ctx) return { width: cssW, height: cssH }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, cssW, cssH)

  // 背景色
  ctx.fillStyle = config.bgColor || '#ffffff'
  ctx.fillRect(0, 0, cssW, cssH)

  // 背景图
  if (config.bgImage) {
    throwIfAborted(signal)
    try {
      const bg = await loadImage(config.bgImage)
      throwIfAborted(signal)
      ctx.drawImage(bg, 0, 0, cssW, cssH)
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') throw e
      // 保持底色
    }
  }

  for (const layer of config.layers) {
    throwIfAborted(signal)
    await drawLayer(ctx, layer, cssW, cssH, data)
  }

  throwIfAborted(signal)
  return { width: cssW, height: cssH }
}

/** 预加载配置中的图片，减少首次绘制闪烁 */
export async function preloadPosterImages(config: PosterConfig): Promise<void> {
  const srcs = [
    config.bgImage,
    ...config.layers.filter((l): l is PosterImageLayer => l.type === 'image').map(l => l.src)
  ].filter(Boolean)

  await Promise.allSettled(srcs.map(src => loadImage(src)))
}
