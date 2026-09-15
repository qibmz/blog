/**
 * AI 模型选择 composable
 *
 * - 从 /api/models 获取可用模型列表（60s 短缓存）
 * - refreshModels() 带 ?fresh=1 强制绕过缓存
 * - useCookie 持久化选择；失效 ID 自动回落到 API default
 */

export type ModelsApiError = { provider: string, message: string }

type ModelsApiData = {
  models: Array<{
    value: string
    label: string
    icon: string
    supportsImages?: boolean
    supportsThinking?: boolean
    supportsWebSearch?: boolean
  }>
  default: string
  errors?: ModelsApiError[]
  fetchedAt?: number
  stale?: boolean
}

export function useModels() {
  const toast = import.meta.client ? useToast() : null
  const forceFresh = ref(false)

  const { data: modelsData, pending, refresh, execute } = useAPI<ModelsApiData>(
    () => forceFresh.value ? '/api/models?fresh=1' : '/api/models',
    { watch: false }
  )

  const model = useCookie<string>('ai-model')
  const refreshing = ref(false)

  const models = computed(() => modelsData.value?.models ?? [])
  const errors = computed(() => modelsData.value?.errors ?? [])
  const stale = computed(() => Boolean(modelsData.value?.stale))

  function applyDefaultFromData(data: ModelsApiData | null | undefined) {
    if (!data?.default) return
    // 列表为空或 default 不在 items 中时不要写 cookie，避免 USelectMenu 选中幽灵值
    const list = data.models ?? []
    if (!list.some(m => m.value === data.default)) return
    if (!model.value || !list.some(m => m.value === model.value)) {
      model.value = data.default
    }
  }

  function notifyProviderErrors(data: ModelsApiData | null | undefined) {
    if (!import.meta.client || !toast || !data?.errors?.length) return
    const detail = data.errors.map(e => `${e.provider}: ${e.message}`).join('；')
    toast.add({
      title: data.stale ? '模型列表可能过期' : '部分模型源不可用',
      description: detail,
      color: 'warning',
      icon: 'i-lucide-triangle-alert',
      duration: 6000
    })
  }

  watch(modelsData, (data) => {
    applyDefaultFromData(data)
  }, { immediate: true })

  async function refreshModels() {
    refreshing.value = true
    forceFresh.value = true
    try {
      await refresh()
      applyDefaultFromData(modelsData.value)
      notifyProviderErrors(modelsData.value)
      return modelsData.value
    } finally {
      forceFresh.value = false
      refreshing.value = false
    }
  }

  return {
    models,
    model,
    errors,
    stale,
    pending,
    refreshing,
    refreshModels,
    refresh,
    execute
  }
}
