<script setup lang="ts">
import type { EditorTool, HotspotDraft } from '#shared/types/hotspot'
import {
  clamp,
  createEmptyDraft,
  createHotspotId,
  polygonBounds,
  pxToPct,
  roundPct,
  toSvgPoints,
  translatePoints
} from '~/utils/hotspot'

const ZOOM_MIN = 0.25
const ZOOM_MAX = 4
const ZOOM_STEP = 0.25

const props = defineProps<{
  drafts: HotspotDraft[]
  selectedId: string | null
  tool: EditorTool
  bgImage: string
}>()

const emit = defineEmits<{
  'update:drafts': [HotspotDraft[]]
  'update:selectedId': [string | null]
  'update:tool': [EditorTool]
  'image-loaded': [payload: { width: number, height: number }]
}>()

const viewportRef = ref<HTMLElement | null>(null)
const stageRef = ref<HTMLElement | null>(null)
const imgRef = ref<HTMLImageElement | null>(null)
const displaySize = reactive({ width: 0, height: 0 })
const viewportSize = reactive({ width: 0, height: 0 })

const zoom = ref(1)
const pan = reactive({ x: 0, y: 0 })
const spacePressed = ref(false)

const drawing = ref(false)
const draftPreview = ref<HotspotDraft | null>(null)
const drawOrigin = ref<{ x: number, y: number } | null>(null)
const polygonPoints = ref<number[]>([])

type DragMode
  = | { type: 'move', id: string, lastX: number, lastY: number, x: number, y: number, points?: number[] }
    | { type: 'resize-rect', id: string, edge: string, x: number, y: number, width: number, height: number }
    | { type: 'resize-circle', id: string, cx: number, cy: number }
    | { type: 'vertex', id: string, index: number, points: number[] }
    | { type: 'pan', lastClientX: number, lastClientY: number, moved: boolean }

const drag = ref<DragMode | null>(null)

const zoomLabel = computed(() => `${Math.round(zoom.value * 100)}%`)

const stageTransform = computed(() =>
  `translate(${pan.x}px, ${pan.y}px) scale(${zoom.value})`
)

const viewportCursor = computed(() => {
  if (drag.value?.type === 'pan') return 'grabbing'
  if (spacePressed.value) return 'grab'
  if (props.tool === 'select') return 'grab'
  return 'crosshair'
})

function updateDraft(id: string, patch: Partial<HotspotDraft>) {
  emit('update:drafts', props.drafts.map(d => d.id === id ? { ...d, ...patch } : d))
}

function replaceDrafts(next: HotspotDraft[]) {
  emit('update:drafts', next)
}

function select(id: string | null) {
  emit('update:selectedId', id)
}

function useSelectTool() {
  if (props.tool !== 'select') {
    emit('update:tool', 'select')
  }
}

function syncViewportSize() {
  const vp = viewportRef.value
  if (!vp) return
  viewportSize.width = vp.clientWidth
  viewportSize.height = vp.clientHeight
}

function syncDisplaySize() {
  const img = imgRef.value
  if (img && img.clientWidth > 0) {
    displaySize.width = img.clientWidth
    displaySize.height = img.clientHeight
    return
  }
  const stage = stageRef.value
  if (stage) {
    displaySize.width = stage.offsetWidth
    displaySize.height = stage.offsetHeight
  }
}

function centerContent() {
  syncViewportSize()
  syncDisplaySize()
  if (displaySize.width <= 0 || viewportSize.width <= 0) return
  pan.x = (viewportSize.width - displaySize.width * zoom.value) / 2
  pan.y = (viewportSize.height - displaySize.height * zoom.value) / 2
}

function setZoom(next: number, origin?: { x: number, y: number }) {
  const z0 = zoom.value
  const z1 = clamp(roundPct(next * 100) / 100, ZOOM_MIN, ZOOM_MAX)
  if (z1 === z0) return

  const vp = viewportRef.value
  if (vp && origin) {
    const contentX = (origin.x - pan.x) / z0
    const contentY = (origin.y - pan.y) / z0
    zoom.value = z1
    pan.x = origin.x - contentX * z1
    pan.y = origin.y - contentY * z1
  } else {
    const cx = viewportSize.width / 2
    const cy = viewportSize.height / 2
    const contentX = (cx - pan.x) / z0
    const contentY = (cy - pan.y) / z0
    zoom.value = z1
    pan.x = cx - contentX * z1
    pan.y = cy - contentY * z1
  }
}

function zoomIn() {
  setZoom(zoom.value + ZOOM_STEP)
}

function zoomOut() {
  setZoom(zoom.value - ZOOM_STEP)
}

function zoomReset() {
  zoom.value = 1
  centerContent()
}

function onImageLoad() {
  syncDisplaySize()
  zoom.value = 1
  nextTick(() => {
    centerContent()
  })
  const img = imgRef.value
  if (!img) return
  emit('image-loaded', {
    width: img.naturalWidth || img.clientWidth,
    height: img.naturalHeight || img.clientHeight
  })
}

useResizeObserver(viewportRef, () => {
  syncViewportSize()
  syncDisplaySize()
})

function pointerPct(event: PointerEvent): { x: number, y: number } {
  const stage = stageRef.value
  if (!stage) return { x: 0, y: 0 }
  const rect = stage.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return { x: 0, y: 0 }
  return {
    x: clamp(pxToPct(event.clientX - rect.left, rect.width)),
    y: clamp(pxToPct(event.clientY - rect.top, rect.height))
  }
}

function circleStyle(d: HotspotDraft): Record<string, string> {
  const { width: w, height: h } = displaySize
  const ratio = w > 0 && h > 0 ? w / h : 1
  const radiusY = d.radius * ratio
  return {
    left: `${d.x - d.radius}%`,
    top: `${d.y - radiusY}%`,
    width: `${d.radius * 2}%`,
    height: `${radiusY * 2}%`,
    borderRadius: '50%'
  }
}

function rectStyle(d: HotspotDraft): Record<string, string> {
  return {
    left: `${d.x}%`,
    top: `${d.y}%`,
    width: `${d.width}%`,
    height: `${d.height}%`
  }
}

function polyBounds(d: HotspotDraft) {
  return polygonBounds(d.points)
}

function polygonBoxStyle(d: HotspotDraft): Record<string, string> {
  const b = polyBounds(d)
  return {
    left: `${b.x}%`,
    top: `${b.y}%`,
    width: `${Math.max(b.width, 0.5)}%`,
    height: `${Math.max(b.height, 0.5)}%`
  }
}

function startPan(event: PointerEvent) {
  drag.value = {
    type: 'pan',
    lastClientX: event.clientX,
    lastClientY: event.clientY,
    moved: false
  }
  viewportRef.value?.setPointerCapture(event.pointerId)
}

function onPointerDown(event: PointerEvent) {
  const target = event.target as HTMLElement
  if (target.closest('[data-hotspot-id]') || target.closest('[data-handle]') || target.closest('[data-vertex]')) {
    return
  }

  if (event.button === 1 || (event.button === 0 && (event.altKey || spacePressed.value))) {
    event.preventDefault()
    startPan(event)
    return
  }

  if (event.button !== 0) return

  if (props.tool === 'select') {
    // 空白处按下：准备平移，若几乎未移动则在 pointerup 时取消选中
    startPan(event)
    return
  }

  const p = pointerPct(event)

  if (props.tool === 'polygon') {
    const pts = polygonPoints.value
    if (pts.length >= 6) {
      const dx = p.x - pts[0]!
      const dy = p.y - pts[1]!
      if (Math.hypot(dx, dy) < 2.5) {
        finishPolygon()
        return
      }
    }
    polygonPoints.value = [...pts, p.x, p.y]
    drawing.value = true
    return
  }

  drawing.value = true
  drawOrigin.value = p
  const draft = createEmptyDraft(props.tool)
  draft.x = p.x
  draft.y = p.y
  draftPreview.value = draft
  viewportRef.value?.setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  if (drag.value?.type === 'pan') {
    const dx = event.clientX - drag.value.lastClientX
    const dy = event.clientY - drag.value.lastClientY
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      drag.value.moved = true
    }
    pan.x += dx
    pan.y += dy
    drag.value.lastClientX = event.clientX
    drag.value.lastClientY = event.clientY
    return
  }

  if (drag.value) {
    applyDrag(event)
    return
  }

  if (!drawing.value || !draftPreview.value || !drawOrigin.value) return
  if (props.tool === 'polygon') return

  const p = pointerPct(event)
  const o = drawOrigin.value

  if (draftPreview.value.shape === 'rect') {
    draftPreview.value = {
      ...draftPreview.value,
      x: Math.min(o.x, p.x),
      y: Math.min(o.y, p.y),
      width: Math.abs(p.x - o.x),
      height: Math.abs(p.y - o.y)
    }
  } else {
    const { width: w, height: h } = displaySize
    const aspect = h / Math.max(w, 1)
    const r = Math.hypot(p.x - o.x, (p.y - o.y) * aspect)
    draftPreview.value = {
      ...draftPreview.value,
      x: o.x,
      y: o.y,
      radius: roundPct(r)
    }
  }
}

function onPointerUp(event: PointerEvent) {
  if (drag.value?.type === 'pan') {
    const moved = drag.value.moved
    drag.value = null
    try {
      viewportRef.value?.releasePointerCapture(event.pointerId)
    } catch { /* already released */ }
    if (!moved && props.tool === 'select' && !spacePressed.value && !event.altKey) {
      select(null)
    }
    return
  }

  if (drag.value) {
    drag.value = null
    try {
      viewportRef.value?.releasePointerCapture(event.pointerId)
    } catch { /* already released */ }
    return
  }

  if (!drawing.value) return
  if (props.tool === 'polygon') return

  drawing.value = false
  try {
    viewportRef.value?.releasePointerCapture(event.pointerId)
  } catch { /* already released */ }

  const preview = draftPreview.value
  draftPreview.value = null
  drawOrigin.value = null
  if (!preview) return

  if (preview.shape === 'rect') {
    if (preview.width < 1 || preview.height < 1) return
  } else if (preview.radius < 0.8) {
    return
  }

  replaceDrafts([...props.drafts, preview])
  select(preview.id)
  useSelectTool()
}

function onDblClick() {
  if (props.tool === 'polygon' && polygonPoints.value.length >= 6) {
    finishPolygon()
  }
}

function finishPolygon() {
  const pts = polygonPoints.value
  if (pts.length < 6) return
  const draft: HotspotDraft = {
    ...createEmptyDraft('polygon'),
    id: createHotspotId(),
    points: pts
  }
  polygonPoints.value = []
  drawing.value = false
  replaceDrafts([...props.drafts, draft])
  select(draft.id)
  useSelectTool()
}

function startMove(event: PointerEvent, id: string) {
  event.stopPropagation()
  event.preventDefault()
  if (spacePressed.value || event.altKey || event.button === 1) {
    startPan(event)
    return
  }
  const draft = props.drafts.find(d => d.id === id)
  if (!draft) return
  select(id)
  useSelectTool()
  const p = pointerPct(event)
  drag.value = {
    type: 'move',
    id,
    lastX: p.x,
    lastY: p.y,
    x: draft.x,
    y: draft.y,
    points: draft.shape === 'polygon' ? [...draft.points] : undefined
  }
  viewportRef.value?.setPointerCapture(event.pointerId)
}

function startResizeRect(event: PointerEvent, id: string, edge: string) {
  event.stopPropagation()
  event.preventDefault()
  const draft = props.drafts.find(d => d.id === id)
  if (!draft) return
  select(id)
  useSelectTool()
  drag.value = {
    type: 'resize-rect',
    id,
    edge,
    x: draft.x,
    y: draft.y,
    width: draft.width,
    height: draft.height
  }
  viewportRef.value?.setPointerCapture(event.pointerId)
}

function startResizeCircle(event: PointerEvent, id: string) {
  event.stopPropagation()
  event.preventDefault()
  const draft = props.drafts.find(d => d.id === id)
  if (!draft) return
  select(id)
  useSelectTool()
  drag.value = {
    type: 'resize-circle',
    id,
    cx: draft.x,
    cy: draft.y
  }
  viewportRef.value?.setPointerCapture(event.pointerId)
}

function startVertex(event: PointerEvent, id: string, index: number) {
  event.stopPropagation()
  event.preventDefault()
  const draft = props.drafts.find(d => d.id === id)
  if (!draft) return
  select(id)
  useSelectTool()
  drag.value = {
    type: 'vertex',
    id,
    index,
    points: [...draft.points]
  }
  viewportRef.value?.setPointerCapture(event.pointerId)
}

function applyDrag(event: PointerEvent) {
  const mode = drag.value
  if (!mode || mode.type === 'pan') return
  const p = pointerPct(event)

  if (mode.type === 'vertex') {
    mode.points[mode.index] = clamp(p.x)
    mode.points[mode.index + 1] = clamp(p.y)
    updateDraft(mode.id, { points: [...mode.points] })
    return
  }

  if (mode.type === 'move') {
    const dx = p.x - mode.lastX
    const dy = p.y - mode.lastY
    mode.lastX = p.x
    mode.lastY = p.y

    const draft = props.drafts.find(d => d.id === mode.id)
    if (!draft) return

    if (draft.shape === 'rect') {
      mode.x = clamp(roundPct(mode.x + dx), 0, 100 - draft.width)
      mode.y = clamp(roundPct(mode.y + dy), 0, 100 - draft.height)
      updateDraft(mode.id, { x: mode.x, y: mode.y })
    } else if (draft.shape === 'circle') {
      mode.x = clamp(roundPct(mode.x + dx))
      mode.y = clamp(roundPct(mode.y + dy))
      updateDraft(mode.id, { x: mode.x, y: mode.y })
    } else if (mode.points) {
      mode.points = translatePoints(mode.points, dx, dy)
      updateDraft(mode.id, { points: [...mode.points] })
    }
    return
  }

  if (mode.type === 'resize-circle') {
    const { width: w, height: h } = displaySize
    const aspect = h / Math.max(w, 1)
    const r = Math.hypot(p.x - mode.cx, (p.y - mode.cy) * aspect)
    updateDraft(mode.id, { radius: clamp(roundPct(r), 0.5, 50) })
    return
  }

  if (mode.type === 'resize-rect') {
    let { x, y, width, height } = mode
    const { edge } = mode
    const right = mode.x + mode.width
    const bottom = mode.y + mode.height

    if (edge.includes('e')) {
      width = clamp(roundPct(p.x - mode.x), 0.5, 100 - mode.x)
    }
    if (edge.includes('s')) {
      height = clamp(roundPct(p.y - mode.y), 0.5, 100 - mode.y)
    }
    if (edge.includes('w')) {
      x = clamp(roundPct(p.x), 0, right - 0.5)
      width = roundPct(right - x)
    }
    if (edge.includes('n')) {
      y = clamp(roundPct(p.y), 0, bottom - 0.5)
      height = roundPct(bottom - y)
    }

    mode.x = x
    mode.y = y
    mode.width = width
    mode.height = height
    updateDraft(mode.id, { x, y, width, height })
  }
}

function onWheel(event: WheelEvent) {
  if (!props.bgImage) return
  event.preventDefault()
  const vp = viewportRef.value
  if (!vp) return
  const rect = vp.getBoundingClientRect()
  const origin = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }
  const direction = event.deltaY > 0 ? -1 : 1
  const factor = event.ctrlKey ? 0.1 : ZOOM_STEP
  setZoom(zoom.value + direction * factor, origin)
}

function onKeyDown(event: KeyboardEvent) {
  if (event.code === 'Space' && !event.repeat) {
    const el = event.target as HTMLElement | null
    const tag = el?.tagName
    if (
      tag === 'INPUT'
      || tag === 'TEXTAREA'
      || tag === 'BUTTON'
      || tag === 'A'
      || tag === 'SELECT'
      || el?.isContentEditable
    ) {
      return
    }
    event.preventDefault()
    spacePressed.value = true
  }
}

function onKeyUp(event: KeyboardEvent) {
  if (event.code === 'Space') {
    spacePressed.value = false
  }
}

watch(() => props.tool, () => {
  polygonPoints.value = []
  draftPreview.value = null
  drawing.value = false
  drawOrigin.value = null
  if (drag.value?.type !== 'pan') drag.value = null
})

watch(() => props.bgImage, async () => {
  zoom.value = 1
  pan.x = 0
  pan.y = 0
  await nextTick()
  syncDisplaySize()
  centerContent()
})

onMounted(() => {
  syncViewportSize()
  syncDisplaySize()
  centerContent()
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
})
</script>

<template>
  <div class="w-full space-y-2">
    <div class="flex flex-wrap items-center gap-1.5">
      <span class="text-xs text-slate-500 mr-1">视口</span>
      <UButton
        size="xs"
        color="neutral"
        variant="soft"
        icon="i-lucide-zoom-out"
        :disabled="zoom <= ZOOM_MIN"
        @click="zoomOut"
      />
      <UButton
        size="xs"
        color="neutral"
        variant="soft"
        class="min-w-14 justify-center font-mono"
        @click="zoomReset"
      >
        {{ zoomLabel }}
      </UButton>
      <UButton
        size="xs"
        color="neutral"
        variant="soft"
        icon="i-lucide-zoom-in"
        :disabled="zoom >= ZOOM_MAX"
        @click="zoomIn"
      />
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        icon="i-lucide-scan"
        @click="zoomReset"
      >
        适应
      </UButton>
      <span class="text-[11px] text-slate-400 ml-1">
        滚轮缩放 · 空白拖拽平移 · Alt/空格拖拽平移
      </span>
    </div>

    <div
      ref="viewportRef"
      class="relative w-full h-[min(56vh,520px)] rounded-xl bg-slate-100 dark:bg-slate-900 overflow-hidden select-none touch-none"
      :style="{ cursor: viewportCursor }"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @dblclick="onDblClick"
      @wheel="onWheel"
    >
      <div
        v-if="!bgImage"
        class="absolute inset-0 flex items-center justify-center text-sm text-slate-400"
      >
        请先选择图片
      </div>

      <div
        v-else
        ref="stageRef"
        class="absolute top-0 left-0 origin-top-left will-change-transform"
        :style="{ transform: stageTransform }"
      >
        <img
          ref="imgRef"
          :src="bgImage"
          alt="hotspot background"
          class="block max-w-full w-auto h-auto pointer-events-none"
          :style="{
            maxWidth: `${Math.max(viewportSize.width, 1)}px`,
            maxHeight: `${Math.max(viewportSize.height, 1)}px`
          }"
          draggable="false"
          @load="onImageLoad"
        >

        <template
          v-for="d in drafts"
          :key="d.id"
        >
          <div
            v-if="d.shape === 'rect'"
            :data-hotspot-id="d.id"
            class="absolute border-2 cursor-move"
            :class="d.id === selectedId
              ? 'border-sky-500 bg-sky-500/20 z-20'
              : 'border-amber-400/80 bg-amber-400/15 z-10'"
            :style="rectStyle(d)"
            @pointerdown="startMove($event, d.id)"
          >
            <span
              v-if="d.title"
              class="absolute -top-5 left-0 text-[10px] font-medium px-1 rounded bg-sky-500 text-white whitespace-nowrap pointer-events-none"
            >
              {{ d.title }}
            </span>
            <template v-if="d.id === selectedId">
              <div
                v-for="edge in ['nw', 'ne', 'sw', 'se']"
                :key="edge"
                data-handle
                class="absolute size-2.5 rounded-sm bg-white border-2 border-sky-500 z-30"
                :class="{
                  'left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize': edge === 'nw',
                  'right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize': edge === 'ne',
                  'left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize': edge === 'sw',
                  'right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize': edge === 'se'
                }"
                @pointerdown="startResizeRect($event, d.id, edge)"
              />
            </template>
          </div>

          <div
            v-else-if="d.shape === 'circle'"
            :data-hotspot-id="d.id"
            class="absolute border-2 cursor-move"
            :class="d.id === selectedId
              ? 'border-sky-500 bg-sky-500/20 z-20'
              : 'border-amber-400/80 bg-amber-400/15 z-10'"
            :style="circleStyle(d)"
            @pointerdown="startMove($event, d.id)"
          >
            <div
              v-if="d.id === selectedId"
              data-handle
              class="absolute right-0 top-1/2 size-2.5 translate-x-1/2 -translate-y-1/2 rounded-full bg-white border-2 border-sky-500 z-30 cursor-ew-resize"
              @pointerdown="startResizeCircle($event, d.id)"
            />
          </div>

          <div
            v-else
            :data-hotspot-id="d.id"
            class="absolute cursor-move z-10"
            :style="polygonBoxStyle(d)"
            @pointerdown="startMove($event, d.id)"
          >
            <svg
              class="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
              :viewBox="`${polyBounds(d).x} ${polyBounds(d).y} ${Math.max(polyBounds(d).width, 0.5)} ${Math.max(polyBounds(d).height, 0.5)}`"
              preserveAspectRatio="none"
            >
              <polygon
                :points="toSvgPoints(d.points)"
                class="pointer-events-auto"
                :class="d.id === selectedId ? 'fill-sky-500/20 stroke-sky-500' : 'fill-amber-400/15 stroke-amber-400/80'"
                stroke-width="0.4"
                vector-effect="non-scaling-stroke"
              />
            </svg>
            <template v-if="d.id === selectedId">
              <div
                v-for="(_, i) in Math.floor(d.points.length / 2)"
                :key="i"
                data-vertex
                class="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border-2 border-sky-500 z-30 cursor-pointer"
                :style="{
                  left: `${((d.points[i * 2]! - polyBounds(d).x) / Math.max(polyBounds(d).width, 0.5)) * 100}%`,
                  top: `${((d.points[i * 2 + 1]! - polyBounds(d).y) / Math.max(polyBounds(d).height, 0.5)) * 100}%`
                }"
                @pointerdown="startVertex($event, d.id, i * 2)"
              />
            </template>
          </div>
        </template>

        <div
          v-if="draftPreview?.shape === 'rect'"
          class="absolute border-2 border-dashed border-sky-500 bg-sky-500/15 pointer-events-none z-30"
          :style="rectStyle(draftPreview)"
        />
        <div
          v-else-if="draftPreview?.shape === 'circle'"
          class="absolute border-2 border-dashed border-sky-500 bg-sky-500/15 pointer-events-none z-30"
          :style="circleStyle(draftPreview)"
        />

        <svg
          v-if="polygonPoints.length >= 2"
          class="absolute inset-0 w-full h-full pointer-events-none z-30"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <polyline
            :points="toSvgPoints(polygonPoints)"
            fill="none"
            class="stroke-sky-500"
            stroke-width="0.4"
            stroke-dasharray="1 1"
            vector-effect="non-scaling-stroke"
          />
          <circle
            v-for="(_, i) in Math.floor(polygonPoints.length / 2)"
            :key="i"
            :cx="polygonPoints[i * 2]"
            :cy="polygonPoints[i * 2 + 1]"
            r="0.8"
            class="fill-sky-500"
          />
        </svg>

        <p
          v-if="tool === 'polygon' && polygonPoints.length > 0"
          class="absolute bottom-2 left-1/2 -translate-x-1/2 z-40 text-[11px] px-2 py-1 rounded-md bg-slate-900/70 text-white whitespace-nowrap"
        >
          点击继续打点 · 双击或点回起点闭合（已 {{ Math.floor(polygonPoints.length / 2) }} 点）
        </p>
      </div>
    </div>
  </div>
</template>
