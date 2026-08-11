<script setup lang="ts">
import type { EditorTool, HotspotDraft } from '#shared/types/hotspot'
import {
  configToDrafts,
  draftsToConfig,
  downloadJson,
  tryParseHotspotConfig
} from '~/utils/hotspot'

definePageMeta({
  pageTransition: { name: 'fade' },
  layoutTransition: { name: 'slide' }
})

const title = '图片热区编辑器'
const description = '拖拽绘制热区，导出百分比 JSON，供 C 端活动页快速接入'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description
})

const toast = useToast()

const tab = ref<'editor' | 'preview'>('editor')
const tool = ref<EditorTool>('rect')
const drafts = ref<HotspotDraft[]>([])
const selectedId = ref<string | null>(null)
const bgImage = ref('')
const designSize = reactive({ width: 1920, height: 1080 })
const imageUrlInput = ref('')
const importText = ref('')
const previewWidth = ref<'full' | 'mobile'>('full')
const objectUrl = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
/** 导入 JSON 后跳过一次 image-loaded，避免自然尺寸覆盖设计稿尺寸 */
const preserveDesignSizeOnce = ref(false)

const tools: { id: EditorTool, label: string, icon: string }[] = [
  { id: 'select', label: '选择', icon: 'i-lucide-mouse-pointer-2' },
  { id: 'rect', label: '矩形', icon: 'i-lucide-square' },
  { id: 'circle', label: '圆形', icon: 'i-lucide-circle' },
  { id: 'polygon', label: '多边形', icon: 'i-lucide-pentagon' }
]

const config = computed(() =>
  draftsToConfig(drafts.value, {
    bgImage: bgImage.value,
    width: designSize.width,
    height: designSize.height
  })
)

const jsonText = computed(() => JSON.stringify(config.value, null, 2))

function revokeObjectUrl() {
  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value)
    objectUrl.value = null
  }
}

function confirmDiscardHotspots() {
  if (drafts.value.length === 0) return true
  return window.confirm(`当前有 ${drafts.value.length} 个热区，更换背景会清空，是否继续？`)
}

function setBgImage(url: string) {
  if (!confirmDiscardHotspots()) return
  revokeObjectUrl()
  bgImage.value = url
  drafts.value = []
  selectedId.value = null
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!confirmDiscardHotspots()) {
    input.value = ''
    return
  }
  revokeObjectUrl()
  const url = URL.createObjectURL(file)
  objectUrl.value = url
  bgImage.value = url
  drafts.value = []
  selectedId.value = null
  input.value = ''
}

function applyImageUrl() {
  const url = imageUrlInput.value.trim()
  if (!url) {
    toast.add({ title: '请输入图片 URL', color: 'warning' })
    return
  }
  setBgImage(url)
}

function onImageLoaded(payload: { width: number, height: number }) {
  if (preserveDesignSizeOnce.value) {
    preserveDesignSizeOnce.value = false
    return
  }
  designSize.width = payload.width
  designSize.height = payload.height
}

function deleteHotspot(id: string) {
  drafts.value = drafts.value.filter(d => d.id !== id)
  if (selectedId.value === id) selectedId.value = null
}

async function copyJson() {
  try {
    await navigator.clipboard.writeText(jsonText.value)
    toast.add({ title: '已复制 JSON', color: 'success' })
  } catch {
    toast.add({ title: '复制失败', color: 'error' })
  }
}

function downloadConfig() {
  downloadJson('hotspot-config.json', config.value)
  toast.add({ title: '已下载 JSON', color: 'success' })
}

function importJson() {
  const result = tryParseHotspotConfig(importText.value)
  if (!result.ok) {
    toast.add({ title: '导入失败', description: result.error, color: 'error' })
    return
  }
  revokeObjectUrl()
  preserveDesignSizeOnce.value = true
  bgImage.value = result.data.bgImage
  designSize.width = result.data.width
  designSize.height = result.data.height
  drafts.value = configToDrafts(result.data)
  selectedId.value = drafts.value[0]?.id ?? null
  toast.add({ title: '导入成功', color: 'success' })
  tab.value = 'editor'
}

onBeforeUnmount(() => {
  revokeObjectUrl()
})
</script>

<template>
  <UContainer>
    <UPageBody>
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
        <div>
          <h1 class="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            {{ title }}
          </h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {{ description }}
          </p>
        </div>
        <UButton
          icon="i-lucide-arrow-left"
          size="xs"
          color="neutral"
          variant="ghost"
          to="/playground"
        >
          Playground
        </UButton>
      </div>

      <UTabs
        v-model="tab"
        :content="false"
        :items="[
          { label: '编辑器', value: 'editor', icon: 'i-lucide-pencil-ruler' },
          { label: '预览', value: 'preview', icon: 'i-lucide-eye' }
        ]"
        class="mb-4"
      />

      <!-- 编辑器 -->
      <div
        v-if="tab === 'editor'"
        class="space-y-4"
      >
        <!-- 选图 -->
        <div class="flex flex-col sm:flex-row gap-2 sm:items-center">
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            class="hidden"
            @change="onFileChange"
          >
          <UButton
            icon="i-lucide-upload"
            size="sm"
            color="neutral"
            variant="soft"
            @click="fileInputRef?.click()"
          >
            上传图片
          </UButton>
          <UInput
            v-model="imageUrlInput"
            class="flex-1"
            size="sm"
            placeholder="或粘贴图片 URL"
          />
          <UButton
            size="sm"
            color="primary"
            variant="soft"
            @click="applyImageUrl"
          >
            使用 URL
          </UButton>
          <span class="text-xs text-slate-400 font-mono shrink-0">
            {{ designSize.width }}×{{ designSize.height }}
          </span>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4">
          <div class="space-y-3 min-w-0">
            <!-- 工具栏 -->
            <div class="flex flex-wrap items-center gap-1.5">
              <UButton
                v-for="t in tools"
                :key="t.id"
                size="sm"
                :icon="t.icon"
                :color="tool === t.id ? 'primary' : 'neutral'"
                :variant="tool === t.id ? 'solid' : 'soft'"
                @click="tool = t.id"
              >
                {{ t.label }}
              </UButton>
              <div class="flex-1" />
              <UButton
                size="sm"
                icon="i-lucide-trash-2"
                color="neutral"
                variant="ghost"
                :disabled="!selectedId"
                @click="selectedId && deleteHotspot(selectedId)"
              >
                删除选中
              </UButton>
            </div>

            <DemoHotspotEditor
              v-model:drafts="drafts"
              v-model:selected-id="selectedId"
              v-model:tool="tool"
              :bg-image="bgImage"
              @image-loaded="onImageLoaded"
            />
          </div>

          <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden xl:max-h-[calc(56vh+4.5rem)] xl:min-h-0">
            <DemoHotspotInspector
              v-model:drafts="drafts"
              v-model:selected-id="selectedId"
              @delete="deleteHotspot"
            />
          </div>
        </div>

        <!-- JSON 导出 -->
        <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
          <div class="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <h3 class="text-sm font-bold text-slate-800 dark:text-slate-100">
              导出 JSON
            </h3>
            <div class="flex-1" />
            <UButton
              size="xs"
              icon="i-lucide-copy"
              color="neutral"
              variant="soft"
              @click="copyJson"
            >
              复制
            </UButton>
            <UButton
              size="xs"
              icon="i-lucide-download"
              color="neutral"
              variant="soft"
              @click="downloadConfig"
            >
              下载
            </UButton>
          </div>
          <pre class="p-4 text-xs font-mono overflow-auto max-h-64 text-slate-600 dark:text-slate-300">{{ jsonText }}</pre>
        </div>

        <!-- 导入 -->
        <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
          <div class="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <h3 class="text-sm font-bold text-slate-800 dark:text-slate-100">
              导入 JSON
            </h3>
            <div class="flex-1" />
            <UButton
              size="sm"
              icon="i-lucide-file-input"
              color="primary"
              variant="soft"
              @click="importJson"
            >
              导入并回填编辑器
            </UButton>
          </div>
          <div class="p-4">
            <UTextarea
              v-model="importText"
              class="w-full"
              :rows="6"
              size="md"
              autoresize
              :maxrows="12"
              placeholder="粘贴热区配置 JSON…"
            />
          </div>
        </div>
      </div>

      <!-- 预览 -->
      <div
        v-else
        class="space-y-4"
      >
        <div class="flex items-center gap-2">
          <UButton
            size="sm"
            :color="previewWidth === 'full' ? 'primary' : 'neutral'"
            :variant="previewWidth === 'full' ? 'solid' : 'soft'"
            icon="i-lucide-monitor"
            @click="previewWidth = 'full'"
          >
            桌面
          </UButton>
          <UButton
            size="sm"
            :color="previewWidth === 'mobile' ? 'primary' : 'neutral'"
            :variant="previewWidth === 'mobile' ? 'solid' : 'soft'"
            icon="i-lucide-smartphone"
            @click="previewWidth = 'mobile'"
          >
            手机
          </UButton>
          <span class="text-xs text-slate-400">
            点击热区触发 navigate / download / popup
          </span>
        </div>

        <div
          class="mx-auto transition-all"
          :class="previewWidth === 'mobile' ? 'max-w-[390px]' : 'max-w-5xl'"
        >
          <DemoHotspotViewer :config="config" />
        </div>
      </div>
    </UPageBody>
  </UContainer>
</template>
