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

type InteractFn = typeof import('interactjs').default

const props = defineProps<{
  drafts: HotspotDraft[]
  selectedId: string | null
  tool: EditorTool
  bgImage: string
}>()

const emit = defineEmits<{
  'update:drafts': [HotspotDraft[]]
  'update:selectedId': [string | null]
  'image-loaded': [payload: { width: number, height: number }]
}>()

const stageRef = ref<HTMLElement | null>(null)
const imgRef = ref<HTMLImageElement | null>(null)
const displaySize = reactive({ width: 0, height: 0 })

const drawing = ref(false)
const draftPreview = ref<HotspotDraft | null>(null)
const drawOrigin = ref<{ x: number, y: number } | null>(null)
const polygonPoints = ref<number[]>([])
const draggingVertex = ref<{ id: string, index: number } | null>(null)

let interactFn: InteractFn | null = null
let interactables: ReturnType<InteractFn>[] = []

function updateDraft(id: string, patch: Partial<HotspotDraft>) {
  emit('update:drafts', props.drafts.map(d => d.id === id ? { ...d, ...patch } : d))
}

function replaceDrafts(next: HotspotDraft[]) {
  emit('update:drafts', next)
}

function select(id: string | null) {
  emit('update:selectedId', id)
}

function onImageLoad() {
  const img = imgRef.value
  if (!img) return
  displaySize.width = img.clientWidth
  displaySize.height = img.clientHeight
  emit('image-loaded', {
    width: img.naturalWidth || img.clientWidth,
    height: img.naturalHeight || img.clientHeight
  })
}

useResizeObserver(stageRef, () => {
  const img = imgRef.value
  if (!img) return
  displaySize.width = img.clientWidth
  displaySize.height = img.clientHeight
})

function pointerPct(event: PointerEvent): { x: number, y: number } {
  const stage = stageRef.value
  if (!stage || displaySize.width <= 0) return { x: 0, y: 0 }
  const rect = stage.getBoundingClientRect()
  return {
    x: clamp(pxToPct(event.clientX - rect.left, rect.width)),
    y: clamp(pxToPct(event.clientY - rect.top, rect.height))
  }
}

function circleStyle(d: HotspotDraft): Record<string, string> {
  const { width: w, height: h } = displaySize
  if (w <= 0 || h <= 0) return { display: 'none' }
  const radiusY = d.radius * (w / h)
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

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0) return
  const target = event.target as HTMLElement
  if (target.closest('[data-hotspot-id]') || target.closest('[data-vertex]')) return

  if (props.tool === 'select') {
    select(null)
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
  stageRef.value?.setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  if (draggingVertex.value) {
    const { id, index } = draggingVertex.value
    const p = pointerPct(event)
    const draft = props.drafts.find(d => d.id === id)
    if (!draft) return
    const points = [...draft.points]
    points[index] = clamp(p.x)
    points[index + 1] = clamp(p.y)
    updateDraft(id, { points })
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
    const aspect = displaySize.height / Math.max(displaySize.width, 1)
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
  if (draggingVertex.value) {
    draggingVertex.value = null
    try {
      stageRef.value?.releasePointerCapture(event.pointerId)
    } catch { /* already released */ }
    return
  }

  if (!drawing.value) return

  if (props.tool === 'polygon') return

  drawing.value = false
  try {
    stageRef.value?.releasePointerCapture(event.pointerId)
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
}

function onVertexPointerDown(event: PointerEvent, id: string, index: number) {
  event.stopPropagation()
  event.preventDefault()
  select(id)
  draggingVertex.value = { id, index }
  stageRef.value?.setPointerCapture(event.pointerId)
}

function onHotspotPointerDown(event: PointerEvent, id: string) {
  event.stopPropagation()
  select(id)
}

function teardownInteract() {
  for (const i of interactables) i.unset()
  interactables = []
}

function setupInteract() {
  teardownInteract()
  if (!import.meta.client || !stageRef.value || !interactFn) return
  const interact = interactFn

  for (const draft of props.drafts) {
    const el = stageRef.value.querySelector(`[data-hotspot-id="${draft.id}"]`) as HTMLElement | null
    if (!el) continue
    if (draft.id !== props.selectedId || props.tool !== 'select') continue

    if (draft.shape === 'rect') {
      interactables.push(
        interact(el)
          .draggable({
            listeners: {
              move(e) {
                const d = props.drafts.find(x => x.id === draft.id)
                if (!d || displaySize.width <= 0) return
                updateDraft(draft.id, {
                  x: clamp(roundPct(d.x + pxToPct(e.dx, displaySize.width)), 0, 100 - d.width),
                  y: clamp(roundPct(d.y + pxToPct(e.dy, displaySize.height)), 0, 100 - d.height)
                })
              }
            }
          })
          .resizable({
            edges: { left: true, right: true, top: true, bottom: true },
            listeners: {
              move(e) {
                const d = props.drafts.find(x => x.id === draft.id)
                if (!d || displaySize.width <= 0) return
                let { x, y, width, height } = d
                x = clamp(roundPct(x + pxToPct(e.deltaRect.left, displaySize.width)))
                y = clamp(roundPct(y + pxToPct(e.deltaRect.top, displaySize.height)))
                width = clamp(roundPct(width + pxToPct(e.deltaRect.width, displaySize.width)), 0.5, 100 - x)
                height = clamp(roundPct(height + pxToPct(e.deltaRect.height, displaySize.height)), 0.5, 100 - y)
                updateDraft(draft.id, { x, y, width, height })
              }
            }
          })
      )
    } else if (draft.shape === 'circle') {
      interactables.push(
        interact(el)
          .draggable({
            listeners: {
              move(e) {
                const d = props.drafts.find(x => x.id === draft.id)
                if (!d || displaySize.width <= 0) return
                updateDraft(draft.id, {
                  x: clamp(roundPct(d.x + pxToPct(e.dx, displaySize.width))),
                  y: clamp(roundPct(d.y + pxToPct(e.dy, displaySize.height)))
                })
              }
            }
          })
          .resizable({
            edges: { right: true, bottom: true },
            listeners: {
              move(e) {
                const d = props.drafts.find(x => x.id === draft.id)
                if (!d || displaySize.width <= 0) return
                const dr = pxToPct(Math.max(e.deltaRect.width, e.deltaRect.height) / 2, displaySize.width)
                updateDraft(draft.id, {
                  radius: clamp(roundPct(d.radius + dr), 0.5, 50)
                })
              }
            }
          })
      )
    } else {
      interactables.push(
        interact(el).draggable({
          listeners: {
            move(e) {
              const d = props.drafts.find(x => x.id === draft.id)
              if (!d || displaySize.width <= 0) return
              updateDraft(draft.id, {
                points: translatePoints(
                  d.points,
                  pxToPct(e.dx, displaySize.width),
                  pxToPct(e.dy, displaySize.height)
                )
              })
            }
          }
        })
      )
    }
  }
}

// 仅在选中/工具/热区 id 集合变化时重绑，避免拖拽过程中 unset 打断交互
watch(
  () => [
    props.selectedId,
    props.tool,
    props.drafts.map(d => `${d.id}:${d.shape}`).join(','),
    displaySize.width,
    displaySize.height
  ] as const,
  async () => {
    await nextTick()
    setupInteract()
  }
)

watch(() => props.tool, () => {
  polygonPoints.value = []
  draftPreview.value = null
  drawing.value = false
  drawOrigin.value = null
})

onMounted(async () => {
  interactFn = (await import('interactjs')).default
  await nextTick()
  setupInteract()
})

onBeforeUnmount(() => {
  teardownInteract()
})
</script>

<template>
  <div
    ref="stageRef"
    class="relative w-full select-none touch-none overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @dblclick="onDblClick"
  >
    <img
      v-if="bgImage"
      ref="imgRef"
      :src="bgImage"
      alt="hotspot background"
      class="block w-full h-auto pointer-events-none"
      draggable="false"
      @load="onImageLoad"
    >
    <div
      v-else
      class="flex items-center justify-center aspect-video text-sm text-slate-400"
    >
      请先选择图片
    </div>

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
        @pointerdown="onHotspotPointerDown($event, d.id)"
      >
        <span
          v-if="d.title"
          class="absolute -top-5 left-0 text-[10px] font-medium px-1 rounded bg-sky-500 text-white whitespace-nowrap"
        >
          {{ d.title }}
        </span>
      </div>

      <div
        v-else-if="d.shape === 'circle'"
        :data-hotspot-id="d.id"
        class="absolute border-2 cursor-move"
        :class="d.id === selectedId
          ? 'border-sky-500 bg-sky-500/20 z-20'
          : 'border-amber-400/80 bg-amber-400/15 z-10'"
        :style="circleStyle(d)"
        @pointerdown="onHotspotPointerDown($event, d.id)"
      />

      <div
        v-else
        :data-hotspot-id="d.id"
        class="absolute cursor-move z-10"
        :style="polygonBoxStyle(d)"
        @pointerdown="onHotspotPointerDown($event, d.id)"
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
        <template v-if="d.id === selectedId && tool === 'select'">
          <div
            v-for="(_, i) in Math.floor(d.points.length / 2)"
            :key="i"
            data-vertex
            class="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border-2 border-sky-500 z-30 cursor-pointer"
            :style="{
              left: `${((d.points[i * 2]! - polyBounds(d).x) / Math.max(polyBounds(d).width, 0.5)) * 100}%`,
              top: `${((d.points[i * 2 + 1]! - polyBounds(d).y) / Math.max(polyBounds(d).height, 0.5)) * 100}%`
            }"
            @pointerdown="onVertexPointerDown($event, d.id, i * 2)"
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
      class="absolute bottom-2 left-1/2 -translate-x-1/2 z-40 text-[11px] px-2 py-1 rounded-md bg-slate-900/70 text-white"
    >
      点击继续打点 · 双击或点回起点闭合（已 {{ Math.floor(polygonPoints.length / 2) }} 点）
    </p>
  </div>
</template>
