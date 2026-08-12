<script setup lang="ts">
import type { PosterEditorTool, PosterLayerDraft } from '#shared/types/poster'
import {
  posterConfigToDrafts,
  draftsToPosterConfig,
  tryParsePosterConfig
} from '~/utils/poster'
import { downloadJson } from '~/utils/download'

definePageMeta({
  pageTransition: { name: 'fade' },
  layoutTransition: { name: 'slide' }
})

const title = '海报设计器'
const description = '插入文字与图片图层，导出百分比 JSON，C 端用 Canvas 渲染'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description
})

const toast = useToast()

const tab = ref<'editor' | 'preview'>('editor')
const tool = ref<PosterEditorTool>('text')
const drafts = ref<PosterLayerDraft[]>([])
const selectedId = ref<string | null>(null)
const bgImage = ref('')
const bgColor = ref('#ffffff')
const designSize = reactive({ width: 1080, height: 1920 })
const imageUrlInput = ref('')
const importText = ref('')
const previewWidth = ref<'full' | 'mobile'>('mobile')
const objectUrl = ref<string | null>(null)
const fileInputRef = useTemplateRef('fileInputRef')
/** 导入 JSON 后跳过一次 image-loaded，避免自然尺寸覆盖设计稿尺寸 */
const preserveDesignSizeOnce = ref(false)
const mockDataText = ref(JSON.stringify({
  nickname: 'Master',
  product: { title: '春季限定礼包' }
}, null, 2))

const mockData = computed<Record<string, unknown> | null>(() => {
  try {
    const parsed = JSON.parse(mockDataText.value) as unknown
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : null
  } catch {
    return null
  }
})

const tools: { id: PosterEditorTool, label: string, icon: string }[] = [
  { id: 'select', label: '选择', icon: 'i-lucide-mouse-pointer-2' },
  { id: 'text', label: '文字', icon: 'i-lucide-type' },
  { id: 'image', label: '图片', icon: 'i-lucide-image' }
]

const config = computed(() =>
  draftsToPosterConfig(drafts.value, {
    bgImage: bgImage.value,
    bgColor: bgColor.value,
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

function setBgImage(url: string) {
  revokeObjectUrl()
  preserveDesignSizeOnce.value = false
  bgImage.value = url
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  revokeObjectUrl()
  preserveDesignSizeOnce.value = false
  const url = URL.createObjectURL(file)
  objectUrl.value = url
  bgImage.value = url
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

function deleteLayer(id: string) {
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
  downloadJson('poster-config.json', config.value)
  toast.add({ title: '已下载 JSON', color: 'success' })
}

function importJson() {
  const result = tryParsePosterConfig(importText.value)
  if (!result.ok) {
    toast.add({ title: '导入失败', description: result.error, color: 'error' })
    return
  }
  revokeObjectUrl()
  preserveDesignSizeOnce.value = true
  bgImage.value = result.data.bgImage
  bgColor.value = result.data.bgColor || '#ffffff'
  designSize.width = result.data.width
  designSize.height = result.data.height
  drafts.value = posterConfigToDrafts(result.data)
  selectedId.value = drafts.value[0]?.id ?? null
  toast.add({ title: '导入成功', color: 'success' })
  tab.value = 'editor'
}

onBeforeUnmount(() => {
  revokeObjectUrl()
})

function openFilePicker() {
  fileInputRef.value?.click()
}

function setTool(next: PosterEditorTool) {
  tool.value = next
}

function removeSelectedLayer() {
  if (!selectedId.value) return
  deleteLayer(selectedId.value)
}

function setPreviewWidth(next: 'full' | 'mobile') {
  previewWidth.value = next
}
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
          { label: 'Canvas 预览', value: 'preview', icon: 'i-lucide-eye' }
        ]"
        class="mb-4"
      />

      <div
        v-if="tab === 'editor'"
        class="space-y-4"
      >
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
            @click="openFilePicker"
          >
            上传背景
          </UButton>
          <UInput
            v-model="imageUrlInput"
            class="flex-1"
            size="sm"
            placeholder="或粘贴背景图 URL"
          />
          <UButton
            size="sm"
            color="primary"
            variant="soft"
            @click="applyImageUrl"
          >
            使用 URL
          </UButton>
          <input
            v-model="bgColor"
            type="color"
            class="h-8 w-10 rounded border border-slate-200 dark:border-slate-700 bg-transparent"
            title="背景色"
          >
          <span class="text-xs text-slate-400 font-mono shrink-0">
            {{ designSize.width }}×{{ designSize.height }}
          </span>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4">
          <div class="space-y-3 min-w-0">
            <div class="flex flex-wrap items-center gap-1.5">
              <UButton
                v-for="t in tools"
                :key="t.id"
                size="sm"
                :icon="t.icon"
                :color="tool === t.id ? 'primary' : 'neutral'"
                :variant="tool === t.id ? 'solid' : 'soft'"
                @click="setTool(t.id)"
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
                @click="removeSelectedLayer"
              >
                删除选中
              </UButton>
            </div>

            <DemoPosterEditor
              v-model:drafts="drafts"
              v-model:selected-id="selectedId"
              v-model:tool="tool"
              :bg-image="bgImage"
              :bg-color="bgColor"
              @image-loaded="onImageLoaded"
            />
          </div>

          <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden xl:max-h-[calc(56vh+4.5rem)] xl:min-h-0">
            <DemoPosterInspector
              v-model:drafts="drafts"
              v-model:selected-id="selectedId"
              @delete="deleteLayer"
            />
          </div>
        </div>

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
              placeholder="粘贴海报配置 JSON…"
            />
          </div>
        </div>
      </div>

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
            @click="setPreviewWidth('full')"
          >
            桌面
          </UButton>
          <UButton
            size="sm"
            :color="previewWidth === 'mobile' ? 'primary' : 'neutral'"
            :variant="previewWidth === 'mobile' ? 'solid' : 'soft'"
            icon="i-lucide-smartphone"
            @click="setPreviewWidth('mobile')"
          >
            手机
          </UButton>
          <span class="text-xs text-slate-400">
            预览与 C 端一致：纯 Canvas；文字 field 从下方 mock 数据取值
          </span>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
          <div
            class="mx-auto w-full transition-all"
            :class="previewWidth === 'mobile' ? 'max-w-[390px]' : 'max-w-5xl'"
          >
            <DemoPosterViewer
              :config="config"
              :data="mockData"
            />
          </div>

          <div class="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden h-fit">
            <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <h3 class="text-sm font-bold text-slate-800 dark:text-slate-100">
                Mock 接口数据
              </h3>
              <p class="text-[11px] text-slate-400 mt-0.5">
                模拟 C 端传入的业务 JSON
              </p>
            </div>
            <div class="p-3">
              <UTextarea
                v-model="mockDataText"
                class="w-full"
                :rows="12"
                size="md"
                autoresize
                :maxrows="20"
                :placeholder="'{ &quot;nickname&quot;: &quot;Master&quot; }'"
              />
              <p
                v-if="!mockData"
                class="mt-2 text-xs text-red-500"
              >
                JSON 无效，将回退静态 content
              </p>
            </div>
          </div>
        </div>
      </div>
    </UPageBody>
  </UContainer>
</template>
