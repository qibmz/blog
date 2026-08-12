<script setup lang="ts">
export interface ChatSource {
  url: string
  title?: string
  summary?: string
  siteName?: string
  publishTime?: string
  logoUrl?: string
}

const props = defineProps<{
  sources: ChatSource[]
}>()

const PREVIEW_COUNT = 5
const FAVICON_STACK = 4

const open = ref(false)
const showAll = ref(false)

function hostname(url: string) {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

function label(s: ChatSource) {
  return s.title || s.siteName || hostname(s.url)
}

function site(s: ChatSource) {
  return s.siteName || hostname(s.url)
}

const stack = computed(() => {
  const seen = new Set<string>()
  const items: ChatSource[] = []
  for (const s of props.sources) {
    const key = s.logoUrl || hostname(s.url)
    if (seen.has(key)) continue
    seen.add(key)
    items.push(s)
    if (items.length >= FAVICON_STACK) break
  }
  return items
})

const visible = computed(() =>
  showAll.value ? props.sources : props.sources.slice(0, PREVIEW_COUNT)
)

const hiddenCount = computed(() =>
  Math.max(0, props.sources.length - PREVIEW_COUNT)
)

watch(() => props.sources.length, () => {
  open.value = false
  showAll.value = false
})
</script>

<template>
  <div
    v-if="sources.length > 0"
    class="mt-3 border-t border-default pt-3"
  >
    <button
      type="button"
      class="group flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left text-xs text-muted hover:text-highlighted transition-colors cursor-pointer"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span class="flex items-center -space-x-1.5 shrink-0">
        <span
          v-for="(s, i) in stack"
          :key="s.url || i"
          class="relative inline-flex size-5 items-center justify-center rounded-full border border-default bg-default overflow-hidden ring-1 ring-default"
          :style="{ zIndex: stack.length - i }"
        >
          <img
            v-if="s.logoUrl"
            :src="s.logoUrl"
            class="size-full object-cover"
            :alt="site(s)"
            loading="lazy"
          >
          <span
            v-else
            class="text-[9px] font-medium text-highlighted uppercase"
          >
            {{ (site(s)[0] || '?') }}
          </span>
        </span>
      </span>

      <span class="flex-1 min-w-0 truncate font-medium">
        搜索来源 · {{ sources.length }}
      </span>

      <UIcon
        name="i-lucide-chevron-down"
        class="size-3.5 shrink-0 transition-transform duration-200"
        :class="open ? 'rotate-180' : ''"
      />
    </button>

    <div
      v-if="open"
      class="mt-2 flex flex-col gap-1"
    >
      <a
        v-for="(s, i) in visible"
        :key="s.url || i"
        :href="s.url"
        target="_blank"
        rel="noopener noreferrer"
        class="group flex items-start gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-elevated transition-colors no-underline"
      >
        <span class="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center overflow-hidden rounded">
          <img
            v-if="s.logoUrl"
            :src="s.logoUrl"
            class="size-4 rounded"
            :alt="site(s)"
            loading="lazy"
          >
          <UIcon
            v-else
            name="i-lucide-globe"
            class="size-3.5 text-muted"
          />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block font-medium text-highlighted truncate">
            {{ label(s) }}
          </span>
          <span class="block text-muted truncate">
            {{ site(s) }}
          </span>
        </span>
        <UIcon
          name="i-lucide-arrow-up-right"
          class="size-3.5 shrink-0 text-muted mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </a>

      <button
        v-if="!showAll && hiddenCount > 0"
        type="button"
        class="self-start px-2 py-1 text-xs text-muted hover:text-highlighted transition-colors cursor-pointer"
        @click="showAll = true"
      >
        查看全部（还有 {{ hiddenCount }} 条）
      </button>
    </div>
  </div>
</template>
