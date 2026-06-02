import { defineEventHandler } from 'h3'
import { MODEL_OPTIONS, DEFAULT_MODEL, type ModelOption } from '../utils/models'

// ─── 动态模型列表（从各 provider 的 /models 接口实时获取）─────────────────────
// 每个 provider 独立容错：某家 API 失败时，该 provider 的所有配置模型照常显示
// 结果缓存 5 分钟，避免每次请求都调用外部 API

const CACHE_TTL_MS = 5 * 60 * 1000

interface ProviderConfig {
  /** OpenAI 兼容的 GET /models 接口地址 */
  url: string
  headers: () => Record<string, string>
  /** 属于该 provider 的模型前缀（用于从 MODEL_OPTIONS 中分组） */
  prefixes: string[]
}

const PROVIDERS: ProviderConfig[] = [
  {
    url: 'https://api.deepseek.com/v1/models',
    headers: () => ({ Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` }),
    prefixes: ['deepseek-']
  },
  {
    url: 'https://api.xiaomimimo.com/v1/models',
    headers: () => ({ 'api-key': process.env.MIMO_API_KEY ?? '' }),
    prefixes: ['mimo-']
  }
]

let _cachedModels: ModelOption[] | null = null
let _cacheExpiry = 0

async function fetchAvailableModels(): Promise<ModelOption[]> {
  const results = await Promise.allSettled(
    PROVIDERS.map(async ({ url, headers }) => {
      const res = await $fetch<{ data: { id: string }[] }>(url, { headers: headers() })
      return new Set(res.data.map(m => m.id))
    })
  )

  const available: ModelOption[] = []

  PROVIDERS.forEach(({ prefixes }, i) => {
    const providerModels = MODEL_OPTIONS.filter(m => prefixes.some(p => m.value.startsWith(p)))
    const result = results[i]!

    if (result.status === 'fulfilled') {
      const matched = providerModels.filter(m => result.value.has(m.value))
      // API 成功但 ID 一条都不匹配（provider 改版等）→ 回退到静态配置，避免模型列表被清空
      available.push(...(matched.length > 0 ? matched : providerModels))
    } else {
      // API 失败：保留该 provider 的全部配置模型（不因网络问题屏蔽模型）
      available.push(...providerModels)
    }
  })

  // 保留顺序，去重（MODEL_OPTIONS 未归属任何 provider 的模型直接保留）
  const assignedValues = new Set(PROVIDERS.flatMap(p => MODEL_OPTIONS.filter(m => p.prefixes.some(px => m.value.startsWith(px))).map(m => m.value)))
  const unassigned = MODEL_OPTIONS.filter(m => !assignedValues.has(m.value))

  return [...available, ...unassigned]
}

export default defineEventHandler(async () => {
  if (_cachedModels && Date.now() < _cacheExpiry) {
    return { models: _cachedModels, default: DEFAULT_MODEL }
  }

  const models = await fetchAvailableModels()
  _cachedModels = models.length > 0 ? models : MODEL_OPTIONS
  _cacheExpiry = Date.now() + CACHE_TTL_MS

  return { models: _cachedModels, default: DEFAULT_MODEL }
})
