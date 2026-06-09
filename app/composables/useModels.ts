/**
 * AI 模型选择 composable
 *
 * - 从 /api/models 获取可用模型列表
 * - 使用 useCookie 持久化用户选择，刷新页面不丢失
 */

export function useModels() {
  const { data: modelsData } = useFetch('/api/models')

  const model = useCookie<string>('ai-model', {
    default: () => modelsData.value?.default ?? ''
  })

  const models = computed(() => modelsData.value?.models ?? [])

  return {
    models,
    model
  }
}
