<script setup lang="ts">
import type { HotspotAction, HotspotDraft } from '#shared/types/hotspot'

const props = defineProps<{
  drafts: HotspotDraft[]
  selectedId: string | null
}>()

const emit = defineEmits<{
  'update:drafts': [HotspotDraft[]]
  'update:selectedId': [string | null]
  'delete': [id: string]
}>()

const selected = computed(() =>
  props.drafts.find(d => d.id === props.selectedId) ?? null
)

const shapeLabel: Record<HotspotDraft['shape'], string> = {
  rect: '矩形',
  circle: '圆形',
  polygon: '多边形'
}

const actionItems = [
  { label: '跳转', value: 'navigate' },
  { label: '下载', value: 'download' },
  { label: '弹窗', value: 'popup' }
]

function patchSelected(patch: Partial<HotspotDraft>) {
  if (!selected.value) return
  emit(
    'update:drafts',
    props.drafts.map(d => d.id === selected.value!.id ? { ...d, ...patch } : d)
  )
}

function patchAction(patch: Partial<HotspotAction>) {
  if (!selected.value) return
  patchSelected({ action: { ...selected.value.action, ...patch } })
}

function select(id: string) {
  emit('update:selectedId', id)
}

function remove(id: string) {
  emit('delete', id)
}
</script>

<template>
  <div class="flex flex-col h-full min-h-0">
    <div class="px-3 py-2 border-b border-slate-200 dark:border-slate-800">
      <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500">
        热区列表
      </h3>
    </div>

    <div class="flex-1 min-h-0 overflow-y-auto">
      <button
        v-for="d in drafts"
        :key="d.id"
        type="button"
        class="w-full flex items-center gap-2 px-3 py-2.5 text-left border-b border-slate-100 dark:border-slate-800/80 transition-colors"
        :class="d.id === selectedId
          ? 'bg-sky-50 dark:bg-sky-500/10'
          : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'"
        @click="select(d.id)"
      >
        <span
          class="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded"
          :class="d.id === selectedId
            ? 'bg-sky-500 text-white'
            : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'"
        >
          {{ shapeLabel[d.shape] }}
        </span>
        <span class="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-slate-200">
          {{ d.title || d.id }}
        </span>
        <UButton
          icon="i-lucide-trash-2"
          size="xs"
          color="neutral"
          variant="ghost"
          @click.stop="remove(d.id)"
        />
      </button>

      <p
        v-if="drafts.length === 0"
        class="px-3 py-6 text-center text-xs text-slate-400"
      >
        暂无热区，使用工具栏绘制
      </p>
    </div>

    <div
      v-if="selected"
      class="border-t border-slate-200 dark:border-slate-800 p-3 space-y-3"
    >
      <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500">
        属性
      </h3>

      <UFormField
        label="标题"
        size="sm"
      >
        <UInput
          :model-value="selected.title"
          placeholder="如：购买按钮"
          @update:model-value="patchSelected({ title: String($event ?? '') })"
        />
      </UFormField>

      <UFormField
        label="动作类型"
        size="sm"
      >
        <USelect
          :model-value="selected.action.type"
          :items="actionItems"
          @update:model-value="patchAction({ type: $event as HotspotAction['type'] })"
        />
      </UFormField>

      <UFormField
        :label="selected.action.type === 'navigate'
          ? '跳转地址'
          : selected.action.type === 'download'
            ? '下载链接'
            : '弹窗内容'"
        size="sm"
      >
        <UTextarea
          :model-value="selected.action.value"
          :rows="2"
          :placeholder="selected.action.type === 'popup'
            ? '弹窗文案或链接'
            : '/product/detail?id=123'"
          @update:model-value="patchAction({ value: String($event ?? '') })"
        />
      </UFormField>

      <p class="text-[11px] text-slate-400 font-mono break-all">
        id: {{ selected.id }}
      </p>
    </div>
  </div>
</template>
