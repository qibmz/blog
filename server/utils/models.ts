/**
 * AI 模型注册表
 *
 * 如何新增模型/Provider:
 * 1. 在 "providers" 区域添加对应 provider 实例
 * 2. 在 "MODELS" 数组末尾追加一条记录
 * 3. 在 .env.local 和 Vercel 后台添加对应 API Key
 *
 * 官方 Provider 文档: https://ai-sdk.dev/providers/ai-sdk-providers
 * 兼容 OpenAI 接口的 Provider 文档: https://ai-sdk.dev/providers/openai-compatible-providers
 */

import { createDeepSeek } from '@ai-sdk/deepseek'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import type { LanguageModel } from 'ai'

// ─── Providers ───────────────────────────────────────────────────────────────
// 每个 provider 只初始化一次，可在多个模型间复用

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY
})

// MiMo — 小米 AI 开放平台
// 控制台: https://platform.xiaomimimo.com/console/api-keys
// 文档:   https://platform.xiaomimimo.com/docs/en-US/quick-start/first-api-call
const mimo = createOpenAICompatible({
  name: 'mimo',
  baseURL: 'https://api.xiaomimimo.com/v1',
  apiKey: process.env.MIMO_API_KEY
})

// ── 新增示例 ──────────────────────────────────────────────────────────────────
// import { createOpenAI } from '@ai-sdk/openai'
// const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
//
// import { createAnthropic } from '@ai-sdk/anthropic'
// const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── Model List ──────────────────────────────────────────────────────────────

export interface ModelOption {
  /** 唯一标识，前后端通信使用（需与 provider 实际模型 ID 一致） */
  value: string
  /** 下拉框显示名称 */
  label: string
  /** Iconify 图标名（前端用） */
  icon: string
}

interface ModelEntry extends ModelOption {
  /** AI SDK 模型实例，仅服务端使用 */
  getInstance: () => LanguageModel
}

const MODELS: ModelEntry[] = [
  // ── DeepSeek ──────────────────────────────────────────────────────────────
  {
    value: 'deepseek-v4-pro',
    label: 'DeepSeek V4 Pro',
    icon: 'i-simple-icons-deepseek',
    getInstance: () => deepseek('deepseek-v4-pro')
  },
  {
    value: 'deepseek-v4-flash',
    label: 'DeepSeek V4 Flash',
    icon: 'i-simple-icons-deepseek',
    getInstance: () => deepseek('deepseek-v4-flash')
  },
  // ── MiMo（小米）─────────────────────────────────────────────────────────────
  {
    value: 'mimo-v2.5-pro',
    label: 'MiMo V2.5 Pro',
    icon: 'i-simple-icons-xiaomi',
    getInstance: () => mimo('mimo-v2.5-pro')
  },
  {
    value: 'mimo-v2.5',
    label: 'MiMo V2.5',
    icon: 'i-simple-icons-xiaomi',
    getInstance: () => mimo('mimo-v2.5')
  },
  {
    value: 'mimo-v2-flash',
    label: 'MiMo V2 Flash',
    icon: 'i-simple-icons-xiaomi',
    getInstance: () => mimo('mimo-v2-flash')
  }
  // ── 在此继续追加 ──────────────────────────────────────────────────────────
  // { value: 'gpt-4o', label: 'GPT-4o', icon: 'i-simple-icons-openai', getInstance: () => openai('gpt-4o') },
]

export const DEFAULT_MODEL = MODELS[0]!.value

/** 供前端下拉框使用的静态选项列表（动态列表见 /api/models） */
export const MODEL_OPTIONS: ModelOption[] = MODELS.map(({ value, label, icon }) => ({
  value,
  label,
  icon
}))

/** 根据 value 获取 AI SDK 模型实例，找不到时回退到第一个 */
export function getModel(value: string): LanguageModel {
  const entry = MODELS.find(m => m.value === value) ?? MODELS[0]!
  return entry.getInstance()
}
