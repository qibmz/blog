import { defineEventHandler } from 'h3'
import { inArray } from 'drizzle-orm'
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

  // 第一阶段：收集所有匹配的模型 ID
  const allModelIds: string[] = []
  const providerModelMap = new Map<number, string[]>()

  PROVIDER_REGISTRY.forEach((provider, i) => {
    const result = results[i]!

    if (result.status === 'fulfilled') {
      const matched = [...result.value]
        .filter(id =>
          provider.prefixes.some(px => id.startsWith(px))
          && !provider.exclude.some(ex => id.toLowerCase().includes(ex.toLowerCase()))
        )
      allModelIds.push(...matched)
      providerModelMap.set(i, matched)
    }
    // API 失败：该 provider 不出现在列表中（不做 fallback，保持列表干净）
  })

  // 第二阶段：批量 DB 查询
  const dbMap = new Map<string, boolean>()
  let dbOk = false
  if (allModelIds.length > 0) {
    try {
      const records = await db
        .select({ id: models.id, supportsImages: models.supportsImages })
        .from(models)
        .where(inArray(models.id, allModelIds))
      for (const r of records) {
        dbMap.set(r.id, r.supportsImages)
      }
      dbOk = true
    } catch (err) {
      console.warn('[models] DB query failed, using provider fallback:', err)
    }
  }

  // 第三阶段：构建 ModelOption[]
  const modelOptions: ModelOption[] = []

  PROVIDER_REGISTRY.forEach((provider, i) => {
    const ids = providerModelMap.get(i)
    if (!ids) return

    for (const id of ids) {
      let supportsImages: boolean
      if (dbMap.has(id)) {
        supportsImages = dbMap.get(id)! // 优先级 1: DB 权威来源
      } else if (dbOk) {
        // 优先级 2: DB 查询成功但无此模型记录（全量 Seed 下的异常）
        console.warn(`[models] DB miss for ${id}, model should be seeded`)
        supportsImages = provider.supportsImages?.(id) ?? false
      } else {
        // 优先级 3: DB 查询失败
        supportsImages = provider.supportsImages?.(id) ?? false
      }

      modelOptions.push({
        value: id,
        label: `${provider.name} ${modelIdToLabel(provider, id)}`,
        icon: provider.icon,
        supportsImages
      })
    }
  })

  return modelOptions
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
