/**
 * AI 模型选择 composable
 *
 * - 从 /api/models 获取可用模型列表
 * - 使用 useCookie 持久化用户选择，刷新页面不丢失
 */

export function useModels() {
  const { data: modelsData } = useFetch('/api/models')

  const model = useCookie<string>('ai-model')

  const models = computed(() => modelsData.value?.models ?? [])

  // 校验 cookie 中的模型是否仍存在于当前可用列表中
  // 防止刷新后 cookie 值与空列表竞态导致 SelectMenu 显示异常
  const isValidModel = computed(() =>
    models.value.some(m => m.value === model.value)
  )

  // 当模型数据到达时：
  // 1. 用户未选择过模型 → 设置默认值
  // 2. cookie 中的模型已失效 → 回退到默认值
  watch(modelsData, (data) => {
    if (!data?.default) return
    if (!model.value || !isValidModel.value) {
      model.value = data.default
    }
  }, { immediate: true })

  return {
    models,
    model
  }
}
