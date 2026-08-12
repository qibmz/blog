<script setup lang="ts">
import type { Hotspot, HotspotConfig } from '#shared/types/hotspot'
import { isSafeHotspotActionValue } from '#shared/types/hotspot'
import { parsePoints, toSvgPoints } from '~/utils/hotspot'
import { parsePct } from '~/utils/geometry'

defineProps<{
  config: HotspotConfig
}>()

const toast = useToast()
const popupOpen = ref(false)
const popupContent = ref('')

const containerRef = useTemplateRef('containerRef')
const displaySize = reactive({ width: 0, height: 0 })

useResizeObserver(containerRef, (entries) => {
  const entry = entries[0]
  if (!entry) return
  displaySize.width = entry.contentRect.width
  displaySize.height = entry.contentRect.height
})

function rectStyle(h: Hotspot): Record<string, string> {
  return {
    left: h.x ?? '0%',
    top: h.y ?? '0%',
    width: h.width ?? '0%',
    height: h.height ?? '0%'
  }
}

function circleStyle(h: Hotspot): Record<string, string> {
  const r = parsePct(h.radius)
  const x = parsePct(h.x)
  const y = parsePct(h.y)
  const { width: w, height: ht } = displaySize
  if (w <= 0 || ht <= 0) {
    return {
      left: `${x - r}%`,
      top: `${y - r}%`,
      width: `${r * 2}%`,
      height: `${r * 2}%`,
      borderRadius: '50%'
    }
  }
  const radiusY = r * (w / ht)
  return {
    left: `${x - r}%`,
    top: `${y - radiusY}%`,
    width: `${r * 2}%`,
    height: `${radiusY * 2}%`,
    borderRadius: '50%'
  }
}

function onHotspotClick(h: Hotspot) {
  const { type, value } = h.action
  if (!value) {
    toast.add({ title: '未配置动作值', color: 'warning' })
    return
  }

  if (!isSafeHotspotActionValue(type, value)) {
    toast.add({ title: '不安全的链接，已拦截', color: 'error' })
    return
  }

  if (type === 'navigate') {
    if (/^https?:\/\//i.test(value)) {
      window.open(value, '_blank', 'noopener,noreferrer')
    } else {
      navigateTo(value)
    }
    return
  }

  if (type === 'download') {
    const a = document.createElement('a')
    a.href = value
    a.download = ''
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.click()
    return
  }

  popupContent.value = value
  popupOpen.value = true
}
</script>

<template>
  <div
    ref="containerRef"
    class="relative w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900"
  >
    <img
      v-if="config.bgImage"
      :src="config.bgImage"
      alt="hotspot preview"
      class="block w-full h-auto pointer-events-none select-none"
      draggable="false"
    >
    <div
      v-else
      class="flex items-center justify-center aspect-video text-sm text-slate-400"
    >
      暂无图片
    </div>

    <!-- rect / circle 热区 -->
    <button
      v-for="h in config.hotspots.filter(x => x.shape !== 'polygon')"
      :key="h.id"
      type="button"
      class="absolute z-10 border border-transparent hover:border-sky-400/60 hover:bg-sky-400/10 focus-visible:border-sky-500 focus-visible:bg-sky-500/15 transition-colors cursor-pointer"
      :style="h.shape === 'circle' ? circleStyle(h) : rectStyle(h)"
      :title="h.title || h.id"
      :aria-label="h.title || h.id"
      @click="onHotspotClick(h)"
    />

    <!-- polygon 热区：整图 SVG 覆盖，百分比坐标 -->
    <svg
      v-if="config.hotspots.some(h => h.shape === 'polygon')"
      class="absolute inset-0 w-full h-full z-10"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <polygon
        v-for="h in config.hotspots.filter(x => x.shape === 'polygon')"
        :key="h.id"
        :points="toSvgPoints(parsePoints(h.points))"
        class="fill-transparent stroke-transparent cursor-pointer hover:fill-sky-400/15 hover:stroke-sky-400/50 focus:fill-sky-500/15 focus:stroke-sky-500 outline-none"
        vector-effect="non-scaling-stroke"
        stroke-width="0.3"
        role="button"
        tabindex="0"
        :aria-label="h.title || h.id"
        @click="onHotspotClick(h)"
        @keydown.enter.prevent="onHotspotClick(h)"
        @keydown.space.prevent="onHotspotClick(h)"
      >
        <title>{{ h.title || h.id }}</title>
      </polygon>
    </svg>

    <UModal
      v-model:open="popupOpen"
      title="热区弹窗"
    >
      <template #body>
        <p class="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-words">
          {{ popupContent }}
        </p>
      </template>
    </UModal>
  </div>
</template>
