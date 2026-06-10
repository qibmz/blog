/**
 * AI 模型选择 composable
 *
 * - 从 /api/models 获取可用模型列表
 * - 使用 useCookie 持久化用户选择，刷新页面不丢失
 */

export function useModels() {
  const { data: modelsData } = useFetch('/api/models')

  const model = useCookie<string>('ai-model')

  // 当模型数据到达且用户未选择过模型时，设置默认值
  // 使用 watch 而非 useCookie 的 default，避免异步数据竞态
  watch(modelsData, (data) => {
    if (data?.default && !model.value) {
      model.value = data.default
    }
  }, { immediate: true })

  const models = computed(() => modelsData.value?.models ?? [])

  return {
    models,
    model
  }
}
