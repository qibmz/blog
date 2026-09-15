import { defineEventHandler, getQuery } from 'h3'
import { inArray } from 'drizzle-orm'
import {
  PROVIDER_REGISTRY,
  pickDefaultModel,
  modelIdToLabel,
  type ModelOption
} from '../utils/models'

// ─── 纯 API 驱动的模型列表 ────────────────────────────────────────────────────
// 从各 Provider 的 GET /models 实时获取可用模型。
// 每个 Provider 独立容错；短缓存 + ?fresh=1 强制刷新。

const CACHE_TTL_MS = 60 * 1000

export type ModelsApiError = { provider: string, message: string }

export type ModelsApiResponse = {
  models: ModelOption[]
  default: string
  errors?: ModelsApiError[]
  fetchedAt: number
  stale?: boolean
}

type CachePayload = ModelsApiResponse

let _cache: CachePayload | null = null
let _cacheExpiry = 0
/** 上次非空成功快照（仅当本次全挂时作 stale 兜底） */
let _lastSuccess: CachePayload | null = null

/** 仅供测试重置进程内缓存 */
export function __resetModelsCacheForTests() {
  _cache = null
  _cacheExpiry = 0
  _lastSuccess = null
}

type CapabilityRow = {
  id: string
  supportsImages: boolean
  supportsWebSearch: boolean
}

type FetchResult = {
  models: ModelOption[]
  errors: ModelsApiError[]
}

async function fetchAvailableModels(): Promise<FetchResult> {
  const results = await Promise.allSettled(
    PROVIDER_REGISTRY.map(async (provider) => {
      const res = await $fetch<{ data: { id: string }[] }>(provider.modelsUrl, {
        headers: provider.headers(),
        timeout: 8000
      })
      return new Set(res.data.map(m => m.id))
    })
  )

  const errors: ModelsApiError[] = []
  const allModelIds: string[] = []
  const providerModelMap = new Map<number, string[]>()

  PROVIDER_REGISTRY.forEach((provider, i) => {
    const result = results[i]!

    if (result.status === 'fulfilled') {
      const matched = [...result.value]
        .filter(id =>
          provider.prefixes.some(px => id.startsWith(px))
          && !provider.exclude.some(ex => id.toLowerCase().includes(ex.toLowerCase()))
          && (!provider.include?.length || provider.include.includes(id))
        )
      allModelIds.push(...matched)
      providerModelMap.set(i, matched)
    } else {
      const reason = result.reason
      const message = reason instanceof Error ? reason.message : String(reason)
      errors.push({ provider: provider.name, message })
      console.warn(`[models] ${provider.name} /models failed:`, message)
    }
  })

  const dbMap = new Map<string, CapabilityRow>()
  let dbOk = false
  if (allModelIds.length > 0) {
    try {
      const records = await db
        .select({
          id: models.id,
          supportsImages: models.supportsImages,
          supportsWebSearch: models.supportsWebSearch
        })
        .from(models)
        .where(inArray(models.id, allModelIds))
      for (const r of records) {
        dbMap.set(r.id, r)
      }
      dbOk = true
    } catch (err) {
      console.warn('[models] DB query failed, using provider fallback:', err)
    }
  }

  const modelOptions: ModelOption[] = []
  const missingIds: { id: string, supportsImages: boolean, supportsWebSearch: boolean }[] = []

  PROVIDER_REGISTRY.forEach((provider, i) => {
    const ids = providerModelMap.get(i)
    if (!ids) return

    for (const id of ids) {
      const row = dbMap.get(id)
      let supportsImages: boolean
      let supportsWebSearch: boolean

      if (row) {
        supportsImages = row.supportsImages
        supportsWebSearch = row.supportsWebSearch
      } else {
        supportsImages = provider.supportsImages?.(id) ?? false
        supportsWebSearch = provider.supportsWebSearch?.(id) ?? false
        if (dbOk) {
          missingIds.push({ id, supportsImages, supportsWebSearch })
        }
      }

      modelOptions.push({
        value: id,
        label: `${provider.name} ${modelIdToLabel(provider, id)}`,
        icon: provider.icon,
        supportsImages,
        supportsThinking: provider.supportsThinking?.(id) ?? true,
        supportsWebSearch
      })
    }
  })

  // 懒插入能力行（不阻塞响应；失败仅打日志）
  if (missingIds.length > 0) {
    void lazyInsertCapabilities(missingIds)
  }

  return { models: modelOptions, errors }
}

async function lazyInsertCapabilities(
  rows: { id: string, supportsImages: boolean, supportsWebSearch: boolean }[]
) {
  try {
    const now = new Date()
    await db
      .insert(models)
      .values(rows.map(r => ({
        id: r.id,
        supportsImages: r.supportsImages,
        supportsWebSearch: r.supportsWebSearch,
        createdAt: now,
        updatedAt: now
      })))
      .onConflictDoNothing({ target: models.id })
  } catch (err) {
    console.warn('[models] lazy insert capabilities failed:', err)
  }
}

function buildResponse(
  modelList: ModelOption[],
  errors: ModelsApiError[],
  opts?: { stale?: boolean, fetchedAt?: number }
): ModelsApiResponse {
  const fetchedAt = opts?.fetchedAt ?? Date.now()
  return {
    models: modelList,
    default: pickDefaultModel(modelList),
    ...(errors.length ? { errors } : {}),
    fetchedAt,
    ...(opts?.stale ? { stale: true } : {})
  }
}

export default defineEventHandler(async (event): Promise<ModelsApiResponse> => {
  const query = getQuery(event)
  const fresh = query.fresh === '1' || query.fresh === 'true'

  if (!fresh && _cache && Date.now() < _cacheExpiry) {
    return _cache
  }

  const { models: modelList, errors } = await fetchAvailableModels()

  if (modelList.length > 0) {
    const payload = buildResponse(modelList, errors)
    _cache = payload
    _cacheExpiry = Date.now() + CACHE_TTL_MS
    _lastSuccess = payload
    return payload
  }

  // 本次全挂：用上次成功快照（若有），并标记 stale；不把空失败结果当「成功列表」长缓存
  if (_lastSuccess?.models.length) {
    const stalePayload: ModelsApiResponse = {
      ..._lastSuccess,
      errors: errors.length
        ? errors
        : [{ provider: 'all', message: 'All providers failed; serving last successful snapshot' }],
      fetchedAt: Date.now(),
      stale: true
    }
    // 短缓存，避免狂打失败接口
    _cache = stalePayload
    _cacheExpiry = Date.now() + CACHE_TTL_MS
    return stalePayload
  }

  const empty = buildResponse([], errors)
  _cache = empty
  _cacheExpiry = Date.now() + CACHE_TTL_MS
  return empty
})
