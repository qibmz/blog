import { defineEventHandler } from 'h3'
import {
  PROVIDER_REGISTRY,
  FALLBACK_MODELS,
  DEFAULT_MODEL,
  modelIdToLabel,
  type ModelOption
} from '../utils/models'

// ─── 纯 API 驱动的模型列表 ────────────────────────────────────────────────────
// 从各 Provider 的 GET /models 实时获取可用模型，不再维护静态列表。
// 每个 Provider 独立容错：某家 API 失败时不影响其他 Provider。
// 结果缓存 5 分钟，避免每次请求都调用外部 API。

const CACHE_TTL_MS = 5 * 60 * 1000

let _cachedModels: ModelOption[] | null = null
let _cacheExpiry = 0

async function fetchAvailableModels(): Promise<ModelOption[]> {
  const results = await Promise.allSettled(
    PROVIDER_REGISTRY.map(async (provider) => {
      const res = await $fetch<{ data: { id: string }[] }>(provider.modelsUrl, {
        headers: provider.headers(),
        timeout: 8000
      })
      return new Set(res.data.map(m => m.id))
    })
  )

  const models: ModelOption[] = []

  PROVIDER_REGISTRY.forEach((provider, i) => {
    const result = results[i]!

    if (result.status === 'fulfilled') {
      // 筛选出属于该 provider 且未被排除的模型
      const matched = [...result.value]
        .filter(id =>
          provider.prefixes.some(px => id.startsWith(px))
          && !provider.exclude.some(ex => id.toLowerCase().includes(ex.toLowerCase()))
        )
        .map(id => ({
          value: id,
          label: `${provider.name} ${modelIdToLabel(provider, id)}`,
          icon: provider.icon
        }))

      models.push(...matched)
    }
    // API 失败：该 provider 不出现在列表中（不做 fallback，保持列表干净）
  })

  return models
}

export default defineEventHandler(async () => {
  if (_cachedModels && Date.now() < _cacheExpiry) {
    return { models: _cachedModels, default: DEFAULT_MODEL }
  }

  const models = await fetchAvailableModels()

  // API 成功或有兜底都要缓存，避免反复重试宕机的 Provider
  _cachedModels = models.length > 0 ? models : FALLBACK_MODELS
  _cacheExpiry = Date.now() + CACHE_TTL_MS

  return { models: _cachedModels, default: DEFAULT_MODEL }
})
