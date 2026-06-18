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
import type { LanguageModel } from 'ai'

// ─── Provider 实例 ───────────────────────────────────────────────────────────

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY
})

// MiMo — 小米 AI 开放平台
// 控制台: https://platform.xiaomimimo.com/console/api-keys
const mimo = createOpenAICompatible({
  name: 'mimo',
  baseURL: 'https://api.xiaomimimo.com/v1',
  apiKey: process.env.MIMO_API_KEY
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
  /** 根据 model ID 创建 LanguageModel 实例 */
  getInstance: (modelId: string) => LanguageModel
  /** 检测 model ID 是否支持图片输入（视觉/多模态） */
  supportsImages?: (modelId: string) => boolean
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
    supportsImages: () => false // DeepSeek 无视觉模型
  },
  {
    name: 'MiMo',
    prefixes: ['mimo-'],
    icon: 'i-simple-icons-xiaomi',
    modelsUrl: 'https://api.xiaomimimo.com/v1/models',
    headers: () => ({ 'api-key': process.env.MIMO_API_KEY ?? '' }),
    exclude: ['tts', 'embedding', 'whisper', 'dall-e'],
    getInstance: id => mimo(id),
    // 仅 mimo-v2.5（除 pro/flash）和 mimo-v2-omni（除 pro/flash）支持视觉
    // 参考：https://mimo.mi.com/docs/zh-CN/quick-start/usage-guide/multimodal-understanding/image-understanding
    supportsImages: (id) => {
      if (id.startsWith('mimo-v2.5') && !id.includes('-pro') && !id.includes('-flash')) return true
      if (id.startsWith('mimo-v2-omni') && !id.includes('-pro') && !id.includes('-flash')) return true
      return false
    }
  }
  // ── 在此继续追加 ──────────────────────────────────────────────────────────
  // {
  //   name: 'OpenAI',
  //   prefixes: ['gpt-', 'o1', 'o3'],
  //   icon: 'i-simple-icons-openai',
  //   modelsUrl: 'https://api.openai.com/v1/models',
  //   headers: () => ({ Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }),
  //   exclude: ['tts', 'whisper', 'dall-e', 'embedding'],
  //   getInstance: (id) => openai(id)
  // }
]

// ─── 兜底模型列表（所有 Provider API 都不可用时使用）─────────────────────────

export const FALLBACK_MODELS: ModelOption[] = [
  { value: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro', icon: 'i-simple-icons-deepseek' },
  { value: 'mimo-v2.5-pro', label: 'MiMo V2.5 Pro', icon: 'i-simple-icons-xiaomi' }
]

export const DEFAULT_MODEL = FALLBACK_MODELS[0]!.value

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

/** 根据 model ID 获取 AI SDK 模型实例 */
export function getModel(value: string): LanguageModel {
  const provider = PROVIDER_REGISTRY.find(p =>
    p.prefixes.some(px => value.startsWith(px))
  )
  if (provider) return provider.getInstance(value)
  // 未知前缀 → 回退到第一个 provider
  return PROVIDER_REGISTRY[0]!.getInstance(value)
}

/** 检测 model ID 是否支持图片输入 */
export function modelSupportsImages(modelId: string): boolean {
  const provider = PROVIDER_REGISTRY.find(p =>
    p.prefixes.some(px => modelId.startsWith(px))
  )
  return provider?.supportsImages?.(modelId) ?? false
}

/** 将 model ID 转换为人类可读的 label */
export function modelIdToLabel(provider: ProviderConfig, modelId: string): string {
  // 去掉 provider 前缀，剩余部分分段并首字母大写
  const prefix = provider.prefixes.find(p => modelId.startsWith(p))
  const rest = prefix ? modelId.slice(prefix.length) : modelId

  // 按 - 分割，每段首字母大写
  return rest
    .split('-')
    .filter(Boolean)
    .map(seg => seg.charAt(0).toUpperCase() + seg.slice(1))
    .join(' ')
}
