<script setup lang="ts">
import type { PosterLayerDraft, PosterObjectFit, PosterTextAlign } from '#shared/types/poster'
import { clamp, moveLayer } from '~/utils/poster'

const props = defineProps<{
  drafts: PosterLayerDraft[]
  selectedId: string | null
}>()

const emit = defineEmits<{
  'update:drafts': [PosterLayerDraft[]]
  'update:selectedId': [string | null]
  'delete': [id: string]
}>()

const selected = computed(() =>
  props.drafts.find(d => d.id === props.selectedId) ?? null
)

const typeLabel: Record<PosterLayerDraft['type'], string> = {
  text: '文字',
  image: '图片'
}

const alignItems: { label: string, value: PosterTextAlign }[] = [
  { label: '左', value: 'left' },
  { label: '中', value: 'center' },
  { label: '右', value: 'right' }
]

const fitItems: { label: string, value: PosterObjectFit }[] = [
  { label: 'Contain', value: 'contain' },
  { label: 'Cover', value: 'cover' },
  { label: 'Fill', value: 'fill' }
]

function patchSelected(patch: Partial<PosterLayerDraft>) {
  if (!selected.value) return
  emit(
    'update:drafts',
    props.drafts.map(d => d.id === selected.value!.id ? { ...d, ...patch } : d)
  )
}

function patchClamped(
  key: 'x' | 'y' | 'width' | 'height' | 'opacity' | 'fontSize',
  raw: unknown,
  min: number,
  max: number
) {
  const n = Number(raw)
  const value = Number.isFinite(n) ? clamp(n, min, max) : min
  patchSelected({ [key]: value })
}

function select(id: string) {
  emit('update:selectedId', id)
}

function remove(id: string) {
  emit('delete', id)
}

function reorder(direction: 'up' | 'down') {
  if (!selected.value) return
  emit('update:drafts', moveLayer(props.drafts, selected.value.id, direction))
}

function layerLabel(d: PosterLayerDraft) {
  if (d.type === 'image') return d.src ? '图片' : '空图片'
  return d.content || d.field || d.id
}
</script>

<template>
  <div class="flex flex-col h-full min-h-0">
    <div class="px-3 py-2 border-b border-slate-200 dark:border-slate-800">
      <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500">
        图层列表
      </h3>
    </div>

    <div class="flex-1 min-h-0 overflow-y-auto">
      <div
        v-for="d in [...drafts].reverse()"
        :key="d.id"
        class="w-full flex items-center gap-2 px-3 py-2.5 border-b border-slate-100 dark:border-slate-800/80 transition-colors"
        :class="d.id === selectedId
          ? 'bg-violet-50 dark:bg-violet-500/10'
          : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'"
      >
        <button
          type="button"
          class="min-w-0 flex-1 flex items-center gap-2 text-left"
          @click="select(d.id)"
        >
          <span
            class="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded"
            :class="d.id === selectedId
              ? 'bg-violet-500 text-white'
              : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'"
          >
            {{ typeLabel[d.type] }}
          </span>
          <span class="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-slate-200">
            {{ layerLabel(d) }}
          </span>
        </button>
        <UButton
          icon="i-lucide-trash-2"
          size="xs"
          color="neutral"
          variant="ghost"
          aria-label="删除图层"
          @click="remove(d.id)"
        />
      </div>

      <p
        v-if="drafts.length === 0"
        class="px-3 py-6 text-center text-xs text-slate-400"
      >
        暂无图层，使用工具栏添加文字或图片
      </p>
    </div>

    <div
      v-if="selected"
      class="border-t border-slate-200 dark:border-slate-800 p-3 space-y-3 overflow-y-auto max-h-[50%]"
    >
      <div class="flex items-center gap-1">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 flex-1">
          属性
        </h3>
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          icon="i-lucide-arrow-up"
          aria-label="上移一层"
          @click="reorder('up')"
        />
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          icon="i-lucide-arrow-down"
          aria-label="下移一层"
          @click="reorder('down')"
        />
      </div>

      <div class="grid grid-cols-2 gap-2">
        <UFormField
          label="X %"
          size="md"
          class="w-full"
        >
          <UInput
            class="w-full"
            type="number"
            size="md"
            :model-value="selected.x"
            @update:model-value="patchClamped('x', $event, 0, 100)"
          />
        </UFormField>
        <UFormField
          label="Y %"
          size="md"
          class="w-full"
        >
          <UInput
            class="w-full"
            type="number"
            size="md"
            :model-value="selected.y"
            @update:model-value="patchClamped('y', $event, 0, 100)"
          />
        </UFormField>
        <UFormField
          label="宽 %"
          size="md"
          class="w-full"
        >
          <UInput
            class="w-full"
            type="number"
            size="md"
            :model-value="selected.width"
            @update:model-value="patchClamped('width', $event, 0.5, 100)"
          />
        </UFormField>
        <UFormField
          label="高 %"
          size="md"
          class="w-full"
        >
          <UInput
            class="w-full"
            type="number"
            size="md"
            :model-value="selected.height"
            @update:model-value="patchClamped('height', $event, 0.5, 100)"
          />
        </UFormField>
      </div>

      <UFormField
        label="透明度"
        size="md"
        class="w-full"
      >
        <UInput
          class="w-full"
          type="number"
          size="md"
          step="0.05"
          min="0"
          max="1"
          :model-value="selected.opacity"
          @update:model-value="patchClamped('opacity', $event, 0, 1)"
        />
      </UFormField>

      <template v-if="selected.type === 'text'">
        <UFormField
          label="接口字段"
          size="md"
          class="w-full"
          description="可选。如 nickname / product.title；C 端用接口数据填充"
        >
          <UInput
            class="w-full"
            size="md"
            :model-value="selected.field"
            placeholder="留空则用静态文案"
            @update:model-value="patchSelected({ field: String($event ?? '') })"
          />
        </UFormField>
        <UFormField
          :label="selected.field ? '兜底文案（预览/缺省）' : '文案'"
          size="md"
          class="w-full"
        >
          <UTextarea
            class="w-full"
            :model-value="selected.content"
            :rows="3"
            size="md"
            autoresize
            :maxrows="6"
            @update:model-value="patchSelected({ content: String($event ?? '') })"
          />
        </UFormField>
        <UFormField
          label="字号（相对画布高度 %）"
          size="md"
          class="w-full"
        >
          <UInput
            class="w-full"
            type="number"
            size="md"
            step="0.1"
            :model-value="selected.fontSize"
            @update:model-value="patchClamped('fontSize', $event, 0.1, 50)"
          />
        </UFormField>
        <UFormField
          label="颜色"
          size="md"
          class="w-full"
        >
          <div class="flex gap-2 w-full">
            <input
              type="color"
              class="h-9 w-10 shrink-0 rounded border border-slate-200 dark:border-slate-700 bg-transparent"
              :value="selected.color"
              @input="patchSelected({ color: ($event.target as HTMLInputElement).value })"
            >
            <UInput
              class="w-full min-w-0"
              size="md"
              :model-value="selected.color"
              @update:model-value="patchSelected({ color: String($event ?? '') })"
            />
          </div>
        </UFormField>
        <UFormField
          label="字体"
          size="md"
          class="w-full"
          description="CSS font-family，如 PingFang SC, system-ui, sans-serif"
        >
          <UInput
            class="w-full"
            size="md"
            :model-value="selected.fontFamily"
            placeholder="system-ui, sans-serif"
            @update:model-value="patchSelected({ fontFamily: String($event ?? '') })"
          />
        </UFormField>
        <UFormField
          label="字重"
          size="md"
          class="w-full"
        >
          <UInput
            class="w-full"
            size="md"
            :model-value="selected.fontWeight"
            @update:model-value="patchSelected({ fontWeight: String($event ?? '') })"
          />
        </UFormField>
        <UFormField
          label="对齐"
          size="md"
          class="w-full"
        >
          <div class="flex gap-1">
            <UButton
              v-for="a in alignItems"
              :key="a.value"
              size="xs"
              :color="selected.textAlign === a.value ? 'primary' : 'neutral'"
              :variant="selected.textAlign === a.value ? 'solid' : 'soft'"
              @click="patchSelected({ textAlign: a.value })"
            >
              {{ a.label }}
            </UButton>
          </div>
        </UFormField>
      </template>

      <template v-else>
        <UFormField
          label="图片 URL"
          size="md"
          class="w-full"
        >
          <UInput
            class="w-full"
            size="md"
            :model-value="selected.src"
            placeholder="https://…"
            @update:model-value="patchSelected({ src: String($event ?? '') })"
          />
        </UFormField>
        <UFormField
          label="适配"
          size="md"
          class="w-full"
        >
          <div class="flex flex-wrap gap-1">
            <UButton
              v-for="f in fitItems"
              :key="f.value"
              size="xs"
              :color="selected.objectFit === f.value ? 'primary' : 'neutral'"
              :variant="selected.objectFit === f.value ? 'solid' : 'soft'"
              @click="patchSelected({ objectFit: f.value })"
            >
              {{ f.label }}
            </UButton>
          </div>
        </UFormField>
      </template>

      <p class="text-[11px] text-slate-400 font-mono break-all">
        id: {{ selected.id }}
      </p>
    </div>
  </div>
</template>
