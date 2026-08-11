<script setup lang="ts">
import type { PosterEditorTool, PosterLayerDraft } from '#shared/types/poster'
import {
  clamp,
  createEmptyLayerDraft,
  createPosterLayerId,
  pxToPct,
  roundPct
} from '~/utils/poster'

const ZOOM_MIN = 0.25
const ZOOM_MAX = 4
const ZOOM_STEP = 0.25

const props = defineProps<{
  drafts: PosterLayerDraft[]
  selectedId: string | null
  tool: PosterEditorTool
  bgImage: string
  bgColor?: string
}>()

const emit = defineEmits<{
  'update:drafts': [PosterLayerDraft[]]
  'update:selectedId': [string | null]
  'update:tool': [PosterEditorTool]
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

type DragMode
  = | { type: 'move', id: string, lastX: number, lastY: number, x: number, y: number }
    | { type: 'resize', id: string, edge: string, x: number, y: number, width: number, height: number }
    | { type: 'pan', lastClientX: number, lastClientY: number, moved: boolean }

const drag = ref<DragMode | null>(null)

const zoomLabel = computed(() => `${Math.round(zoom.value * 100)}%`)
const stageTransform = computed(() =>
  `translate(${pan.x}px, ${pan.y}px) scale(${zoom.value})`
)

const viewportCursor = computed(() => {
  if (drag.value?.type === 'pan') return 'grabbing'
  if (spacePressed.value) return 'grab'
  if (props.tool === 'select') return 'default'
  return 'crosshair'
})

function updateDraft(id: string, patch: Partial<PosterLayerDraft>) {
  emit('update:drafts', props.drafts.map(d => d.id === id ? { ...d, ...patch } : d))
}

function select(id: string | null) {
  emit('update:selectedId', id)
}

function useSelectTool() {
  if (props.tool !== 'select') emit('update:tool', 'select')
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

  if (origin) {
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
  setZoom(1)
  centerContent()
}

function pointerToPct(clientX: number, clientY: number) {
  const stage = stageRef.value
  if (!stage || displaySize.width <= 0) return { x: 0, y: 0 }
  const rect = stage.getBoundingClientRect()
  return {
    x: clamp(pxToPct(clientX - rect.left, rect.width)),
    y: clamp(pxToPct(clientY - rect.top, rect.height))
  }
}

function fontSizePx(draft: PosterLayerDraft) {
  if (displaySize.height <= 0) return 16
  return (draft.fontSize / 100) * displaySize.height
}

function onImageLoad() {
  const img = imgRef.value
  if (img?.naturalWidth) {
    emit('image-loaded', { width: img.naturalWidth, height: img.naturalHeight })
  }
  nextTick(() => {
    syncDisplaySize()
    centerContent()
  })
}

function placeLayerAt(pct: { x: number, y: number }) {
  if (props.tool !== 'text' && props.tool !== 'image') return

  const draft = createEmptyLayerDraft(props.tool)
  draft.id = createPosterLayerId(props.tool)
  draft.x = clamp(roundPct(pct.x - draft.width / 2))
  draft.y = clamp(roundPct(pct.y - draft.height / 2))
  if (draft.x + draft.width > 100) draft.x = clamp(100 - draft.width)
  if (draft.y + draft.height > 100) draft.y = clamp(100 - draft.height)

  emit('update:drafts', [...props.drafts, draft])
  select(draft.id)
  useSelectTool()
}

function hitTest(pct: { x: number, y: number }): PosterLayerDraft | null {
  for (let i = props.drafts.length - 1; i >= 0; i--) {
    const d = props.drafts[i]!
    if (
      pct.x >= d.x
      && pct.x <= d.x + d.width
      && pct.y >= d.y
      && pct.y <= d.y + d.height
    ) {
      return d
    }
  }
  return null
}

function onPointerDown(event: PointerEvent) {
  if (event.button === 1 || spacePressed.value || (props.tool === 'select' && event.altKey)) {
    event.preventDefault()
    drag.value = {
      type: 'pan',
      lastClientX: event.clientX,
      lastClientY: event.clientY,
      moved: false
    }
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    return
  }

  if (event.button !== 0) return

  const target = event.target as HTMLElement
  if (target.closest('[data-handle]')) return

  const pct = pointerToPct(event.clientX, event.clientY)

  if (props.tool === 'text' || props.tool === 'image') {
    placeLayerAt(pct)
    return
  }

  const hit = hitTest(pct)
  if (!hit) {
    select(null)
    drag.value = {
      type: 'pan',
      lastClientX: event.clientX,
      lastClientY: event.clientY,
      moved: false
    }
    ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
    return
  }

  select(hit.id)
  drag.value = {
    type: 'move',
    id: hit.id,
    lastX: pct.x,
    lastY: pct.y,
    x: hit.x,
    y: hit.y
  }
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function onResizePointerDown(event: PointerEvent, id: string, edge: string) {
  event.stopPropagation()
  event.preventDefault()
  const draft = props.drafts.find(d => d.id === id)
  if (!draft) return
  select(id)
  drag.value = {
    type: 'resize',
    id,
    edge,
    x: draft.x,
    y: draft.y,
    width: draft.width,
    height: draft.height
  }
  viewportRef.value?.setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  const mode = drag.value
  if (!mode) return

  if (mode.type === 'pan') {
    const dx = event.clientX - mode.lastClientX
    const dy = event.clientY - mode.lastClientY
    if (dx || dy) {
      pan.x += dx
      pan.y += dy
      drag.value = {
        ...mode,
        lastClientX: event.clientX,
        lastClientY: event.clientY,
        moved: true
      }
    }
    return
  }

  const pct = pointerToPct(event.clientX, event.clientY)
  const current = props.drafts.find(d => d.id === mode.id)

  if (mode.type === 'move' && current) {
    const dx = pct.x - mode.lastX
    const dy = pct.y - mode.lastY
    updateDraft(mode.id, {
      x: clamp(roundPct(mode.x + dx), 0, 100 - current.width),
      y: clamp(roundPct(mode.y + dy), 0, 100 - current.height)
    })
    return
  }

  if (mode.type === 'resize') {
    let { x, y, width, height } = mode
    if (mode.edge.includes('e')) width = clamp(roundPct(pct.x - x), 2, 100 - x)
    if (mode.edge.includes('s')) height = clamp(roundPct(pct.y - y), 2, 100 - y)
    if (mode.edge.includes('w')) {
      const right = x + width
      x = clamp(roundPct(pct.x), 0, right - 2)
      width = clamp(roundPct(right - x), 2, 100)
    }
    if (mode.edge.includes('n')) {
      const bottom = y + height
      y = clamp(roundPct(pct.y), 0, bottom - 2)
      height = clamp(roundPct(bottom - y), 2, 100)
    }
    updateDraft(mode.id, { x, y, width, height })
  }
}

function onPointerUp() {
  drag.value = null
}

function onWheel(event: WheelEvent) {
  event.preventDefault()
  const vp = viewportRef.value
  if (!vp) return
  const rect = vp.getBoundingClientRect()
  setZoom(zoom.value * (event.deltaY > 0 ? 0.9 : 1.1), {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  })
}

function onKeyDown(event: KeyboardEvent) {
  if (event.code !== 'Space' || event.repeat) return
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

function onKeyUp(event: KeyboardEvent) {
  if (event.code === 'Space') spacePressed.value = false
}

useResizeObserver(viewportRef, () => {
  syncViewportSize()
  syncDisplaySize()
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

watch(() => props.bgImage, async () => {
  zoom.value = 1
  pan.x = 0
  pan.y = 0
  await nextTick()
  syncDisplaySize()
  centerContent()
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
      <span class="text-[11px] text-slate-400 ml-1">
        滚轮缩放 · 空格/Alt 平移 · 文案在右侧属性修改
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
      @wheel="onWheel"
    >
      <div
        v-if="!bgImage"
        class="absolute inset-0 flex items-center justify-center text-sm text-slate-400"
      >
        请先选择背景图
      </div>

      <div
        v-else
        ref="stageRef"
        class="absolute top-0 left-0 origin-top-left will-change-transform"
        :style="{
          transform: stageTransform,
          backgroundColor: bgColor || '#ffffff'
        }"
      >
        <img
          ref="imgRef"
          :src="bgImage"
          alt="poster background"
          class="block max-w-full w-auto h-auto pointer-events-none"
          :style="{
            maxWidth: `${Math.max(viewportSize.width, 1)}px`,
            maxHeight: `${Math.max(viewportSize.height, 1)}px`
          }"
          draggable="false"
          @load="onImageLoad"
        >

        <div
          v-for="d in drafts"
          :key="d.id"
          class="absolute box-border border-2"
          :class="d.id === selectedId
            ? 'border-violet-500 bg-violet-400/5 z-20 cursor-move'
            : 'border-transparent hover:border-violet-300/80 z-10 cursor-move'"
          :style="{
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: `${d.width}%`,
            height: `${d.height}%`,
            opacity: d.opacity,
            transform: d.rotation ? `rotate(${d.rotation}deg)` : undefined
          }"
        >
          <div
            v-if="d.type === 'text'"
            class="w-full h-full overflow-hidden pointer-events-none select-none whitespace-pre-wrap break-words"
            :style="{
              fontSize: `${fontSizePx(d)}px`,
              fontFamily: d.fontFamily,
              fontWeight: d.fontWeight,
              color: d.color,
              textAlign: d.textAlign,
              lineHeight: d.lineHeight
            }"
          >
            {{ d.content }}
          </div>
          <img
            v-else-if="d.src"
            :src="d.src"
            alt=""
            class="w-full h-full pointer-events-none select-none"
            :style="{ objectFit: d.objectFit }"
            draggable="false"
          >
          <div
            v-else
            class="w-full h-full flex items-center justify-center text-[10px] text-slate-400 bg-slate-200/50 pointer-events-none"
          >
            在右侧填入图片 URL
          </div>

          <template v-if="d.id === selectedId">
            <div
              v-for="edge in ['nw', 'ne', 'sw', 'se']"
              :key="edge"
              data-handle
              class="absolute size-2.5 rounded-sm bg-white border-2 border-violet-500 z-30"
              :class="{
                'left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize': edge === 'nw',
                'right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize': edge === 'ne',
                'left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize': edge === 'sw',
                'right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize': edge === 'se'
              }"
              @pointerdown="onResizePointerDown($event, d.id, edge)"
            />
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
