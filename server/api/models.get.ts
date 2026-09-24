import { defineEventHandler, getQuery } from 'h3'
import { asc, eq } from 'drizzle-orm'
import {
  pickDefaultModel,
  type ModelOption
} from '../utils/models'

// ─── DB 目录驱动的模型列表 ───────────────────────────────────────────────────
// 列表与能力全部以 models 表为准（seed-models.ts）；短缓存 + ?fresh=1。

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
let _lastSuccess: CachePayload | null = null

/** 仅供测试重置进程内缓存 */
export function __resetModelsCacheForTests() {
  _cache = null
  _cacheExpiry = 0
  _lastSuccess = null
}

async function fetchModelsFromDb(): Promise<{ models: ModelOption[], error?: ModelsApiError }> {
  try {
    const rows = await db
      .select({
        id: models.id,
        label: models.label,
        icon: models.icon,
        supportsImages: models.supportsImages,
        supportsThinking: models.supportsThinking,
        supportsWebSearch: models.supportsWebSearch,
        sortOrder: models.sortOrder
      })
      .from(models)
      .where(eq(models.enabled, true))
      .orderBy(asc(models.sortOrder), asc(models.id))

    const list: ModelOption[] = rows.map(row => ({
      value: row.id,
      label: row.label || row.id,
      icon: row.icon || 'i-lucide-bot',
      supportsImages: row.supportsImages,
      supportsThinking: row.supportsThinking,
      supportsWebSearch: row.supportsWebSearch
    }))

    return { models: list }
  } catch (err) {
    // 原始 err.message 可能含 SQL / 主机 / DB 用户名，仅记日志，不回传客户端
    console.warn('[models] DB catalog query failed:', err)
    return {
      models: [],
      error: { provider: 'database', message: 'Failed to load model catalog' }
    }
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

  const { models: modelList, error } = await fetchModelsFromDb()
  const errors = error ? [error] : []

  if (modelList.length > 0) {
    const payload = buildResponse(modelList, errors)
    _cache = payload
    _cacheExpiry = Date.now() + CACHE_TTL_MS
    _lastSuccess = payload
    return payload
  }

  if (_lastSuccess?.models.length) {
    const stalePayload: ModelsApiResponse = {
      ..._lastSuccess,
      errors: errors.length
        ? errors
        : [{ provider: 'database', message: 'DB catalog empty/failed; serving last successful snapshot' }],
      fetchedAt: Date.now(),
      stale: true
    }
    _cache = stalePayload
    _cacheExpiry = Date.now() + CACHE_TTL_MS
    return stalePayload
  }

  const empty = buildResponse([], errors)
  _cache = empty
  _cacheExpiry = Date.now() + CACHE_TTL_MS
  return empty
})
