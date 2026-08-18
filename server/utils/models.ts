/**
 * AI 模型 Provider 注册表
 *
 * 模型列表不再写死 —— 通过各 Provider 的 /models API 实时获取。
 * 新增 Provider 只需在 PROVIDER_REGISTRY 追加一条即可。
 *
 * 官方 Provider 文档: https://ai-sdk.dev/providers/ai-sdk-providers
 * 兼容 OpenAI 接口的 Provider 文档: https://ai-sdk.dev/providers/openai-compatible-providers
 */

import { createDeepSeek } from '@ai-sdk/deepseek'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { eq } from 'drizzle-orm'
import type { LanguageModel } from 'ai'
import { createMimoFetch, applyMimoWebSearchToRequestBody } from './webSearch'

// ─── Provider 实例 ───────────────────────────────────────────────────────────

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY
})

// MiMo — 小米 AI 开放平台
// 控制台: https://platform.xiaomimimo.com/console/api-keys
const mimo = createOpenAICompatible({
  name: 'mimo',
  baseURL: 'https://api.xiaomimimo.com/v1',
  apiKey: process.env.MIMO_API_KEY,
  fetch: createMimoFetch(),
  // openai-compatible 会把 tools 置为 undefined；用自定义字段再转回 tools
  transformRequestBody: applyMimoWebSearchToRequestBody
})

// ── 新增示例 ──────────────────────────────────────────────────────────────────
// import { createOpenAI } from '@ai-sdk/openai'
// const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ─── Provider 注册表 ──────────────────────────────────────────────────────────

export interface ModelOption {
  /** 唯一标识，前后端通信使用（即 provider 的 model ID） */
  value: string
  /** 前端下拉框显示名称 */
  label: string
  /** Iconify 图标名（前端用） */
  icon: string
  /** 是否支持图片/文件输入（视觉/多模态） */
  supportsImages?: boolean
  /** 是否支持深度思考 */
  supportsThinking?: boolean
  /** 是否支持联网搜索 */
  supportsWebSearch?: boolean
}

export interface ProviderConfig {
  /** 显示名称，用于 label 生成 */
  name: string
  /** 模型 ID 前缀，用于归属判断 */
  prefixes: string[]
  /** Iconify 图标名 */
  icon: string
  /** GET /models 接口地址 */
  modelsUrl: string
  /** 请求头 */
  headers: () => Record<string, string>
  /** 需要排除的 model ID 子串（如 tts、embedding 等非 Chat 模型） */
  exclude: string[]
  /**
   * 可选白名单：有则只保留列表中的 ID（在 prefix / exclude 之后）。
   * 仍请求 Provider /models，不静态跳过 list。
   */
  include?: string[]
  /** 根据 model ID 创建 LanguageModel 实例 */
  getInstance: (modelId: string) => LanguageModel
  /** 检测 model ID 是否支持图片输入（视觉/多模态） */
  supportsImages?: (modelId: string) => boolean
  /** 检测 model ID 是否支持深度思考 */
  supportsThinking?: (modelId: string) => boolean
  /** 检测 model ID 是否支持联网搜索 */
  supportsWebSearch?: (modelId: string) => boolean
  /** 是否支持自定义 function calling（如 chart tool） */
  supportsCustomTools?: (modelId: string) => boolean
}

const MIMO_CHAT_MODELS = ['mimo-v2.5-pro', 'mimo-v2.5'] as const

function isMimoChatModel(id: string) {
  return (MIMO_CHAT_MODELS as readonly string[]).includes(id)
}

export const PROVIDER_REGISTRY: ProviderConfig[] = [
  {
    name: 'DeepSeek',
    prefixes: ['deepseek-'],
    icon: 'i-simple-icons-deepseek',
    modelsUrl: 'https://api.deepseek.com/v1/models',
    headers: () => ({ Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` }),
    exclude: [],
    getInstance: id => deepseek(id),
    supportsImages: () => false, // DeepSeek 无视觉模型
    supportsThinking: () => true,
    supportsWebSearch: () => false,
    supportsCustomTools: () => true
  },
  {
    name: 'MiMo',
    prefixes: ['mimo-'],
    icon: 'i-simple-icons-xiaomi',
    modelsUrl: 'https://api.xiaomimimo.com/v1/models',
    headers: () => ({ 'api-key': process.env.MIMO_API_KEY ?? '' }),
    // asr/tts 等非 Chat 模型不应出现在对话下拉框
    exclude: ['tts', 'asr', 'embedding', 'whisper', 'dall-e'],
    // 官方对话模型仅两款；仍请求 /models，再与 include 求交
    // 参考：https://mimo.mi.com/docs/zh-CN/quick-start/summary/model
    include: [...MIMO_CHAT_MODELS],
    getInstance: id => mimo(id),
    // 仅全模态理解模型支持视觉
    supportsImages: (id) => {
      if (id === 'mimo-v2.5' || id === 'mimo-v2-omni') return true
      return false
    },
    supportsThinking: id => isMimoChatModel(id),
    // 参考：https://mimo.mi.com/docs/zh-CN/quick-start/usage-guide/text-generation/tool-calling/web-search
    supportsWebSearch: id => isMimoChatModel(id),
    // openai-compatible 会丢掉自定义 tools，chart 等仅 DeepSeek 可用
    supportsCustomTools: () => false
  }
  // ── 在此继续追加 ──────────────────────────────────────────────────────────
]

// ─── 兜底模型列表（所有 Provider API 都不可用时使用）─────────────────────────

export const FALLBACK_MODELS: ModelOption[] = [
  {
    value: 'deepseek-v4-pro',
    label: 'DeepSeek V4 Pro',
    icon: 'i-simple-icons-deepseek',
    supportsImages: false,
    supportsThinking: true,
    supportsWebSearch: false
  },
  {
    value: 'mimo-v2.5-pro',
    label: 'MiMo V2.5 Pro',
    icon: 'i-simple-icons-xiaomi',
    supportsImages: false,
    supportsThinking: true,
    supportsWebSearch: true
  }
]

export const DEFAULT_MODEL = FALLBACK_MODELS[0]!.value

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

function findProvider(modelId: string) {
  return PROVIDER_REGISTRY.find(p =>
    p.prefixes.some(px => modelId.startsWith(px))
  )
}

/** 根据 model ID 获取 AI SDK 模型实例 */
export function getModel(value: string): LanguageModel {
  const provider = findProvider(value)
  if (provider) return provider.getInstance(value)
  // 未知前缀 → 回退到第一个 provider
  return PROVIDER_REGISTRY[0]!.getInstance(value)
}

/** 检测 model ID 是否支持图片输入（DB 优先，Provider fallback） */
export async function modelSupportsImages(modelId: string): Promise<boolean> {
  try {
    const row = await db.query.models.findFirst({
      where: eq(schema.models.id, modelId)
    })
    if (row) return row.supportsImages ?? false
  } catch {
    // DB 查询失败 → fallback 到 Provider 硬编码
  }

  return findProvider(modelId)?.supportsImages?.(modelId) ?? false
}

/** 检测 model ID 是否支持深度思考（Provider 规则） */
export function modelSupportsThinking(modelId: string): boolean {
  return findProvider(modelId)?.supportsThinking?.(modelId) ?? true
}

/** 检测 model ID 是否支持自定义 function calling（如 chart tool） */
export function modelSupportsCustomTools(modelId: string): boolean {
  return findProvider(modelId)?.supportsCustomTools?.(modelId) ?? false
}

/** 检测 model ID 是否支持联网搜索（DB 优先，Provider fallback） */
export async function modelSupportsWebSearch(modelId: string): Promise<boolean> {
  try {
    const row = await db.query.models.findFirst({
      where: eq(schema.models.id, modelId)
    })
    if (row) return row.supportsWebSearch ?? false
  } catch {
    // DB 查询失败 → fallback
  }

  return findProvider(modelId)?.supportsWebSearch?.(modelId) ?? false
}

/** 将 model ID 转换为人类可读的 label */
export function modelIdToLabel(provider: ProviderConfig, modelId: string): string {
  const prefix = provider.prefixes.find(p => modelId.startsWith(p))
  const rest = prefix ? modelId.slice(prefix.length) : modelId

  return rest
    .split('-')
    .filter(Boolean)
    .map(seg => seg.charAt(0).toUpperCase() + seg.slice(1))
    .join(' ')
}
