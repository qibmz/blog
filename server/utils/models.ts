/**
 * AI 模型 Provider 路由 + DB 能力查询
 *
 * - 对话可用模型列表与能力：全部以 DB `models` 表为准（见 seed-models.ts）
 * - 本文件只负责：按 ID 前缀选 SDK 实例、默认模型推算、能力只读查询
 */

import { createDeepSeek } from '@ai-sdk/deepseek'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { createError } from 'h3'
import { eq } from 'drizzle-orm'
import type { LanguageModel } from 'ai'
import { createMimoFetch, applyMimoWebSearchToRequestBody } from './webSearch'

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY,
  // strict tool calls 需 beta 端点（@ai-sdk/deepseek：baseURL 以 /beta 结尾）
  baseURL: 'https://api.deepseek.com/beta'
})

const mimo = createOpenAICompatible({
  name: 'mimo',
  baseURL: 'https://api.xiaomimimo.com/v1',
  apiKey: process.env.MIMO_API_KEY,
  fetch: createMimoFetch(),
  transformRequestBody: applyMimoWebSearchToRequestBody
})

export interface ModelOption {
  value: string
  label: string
  icon: string
  supportsImages?: boolean
  supportsThinking?: boolean
  supportsWebSearch?: boolean
}

/** SDK 路由：不再参与列表与能力判定 */
export interface ProviderConfig {
  name: string
  prefixes: string[]
  getInstance: (modelId: string) => LanguageModel
  /** chart 等自定义 tools：按厂商能力，不进 DB */
  supportsCustomTools?: (modelId: string) => boolean
}

export const PROVIDER_REGISTRY: ProviderConfig[] = [
  {
    name: 'DeepSeek',
    prefixes: ['deepseek-'],
    getInstance: id => deepseek(id),
    supportsCustomTools: () => true
  },
  {
    name: 'MiMo',
    prefixes: ['mimo-'],
    getInstance: id => mimo(id),
    // openai-compatible 会丢掉自定义 tools
    supportsCustomTools: () => false
  }
]

export const PREFERRED_DEFAULT_MODEL = 'deepseek-flash'

/**
 * 从 DB 列表推算默认模型：
 * deepseek-flash → 任意 deepseek-* → 列表第一项 → PREFERRED_DEFAULT_MODEL
 */
export function pickDefaultModel(modelList: ModelOption[]): string {
  if (!modelList.length) return PREFERRED_DEFAULT_MODEL
  const flash = modelList.find(m => m.value === 'deepseek-flash')
  if (flash) return flash.value
  const deepseekModel = modelList.find(m => m.value.startsWith('deepseek-'))
  if (deepseekModel) return deepseekModel.value
  return modelList[0]!.value
}

function findProvider(modelId: string) {
  return PROVIDER_REGISTRY.find(p =>
    p.prefixes.some(px => modelId.startsWith(px))
  )
}

export function getModel(value: string): LanguageModel {
  const provider = findProvider(value)
  if (provider) return provider.getInstance(value)
  return PROVIDER_REGISTRY[0]!.getInstance(value)
}

async function readCapability(
  modelId: string,
  field: 'supportsImages' | 'supportsThinking' | 'supportsWebSearch'
): Promise<boolean> {
  try {
    const row = await db.query.models.findFirst({
      where: eq(schema.models.id, modelId)
    })
    if (row) return Boolean(row[field])
  } catch {
    // DB 失败 → 保守 false
  }
  return false
}

/** 是否支持图片：只读 DB */
export async function modelSupportsImages(modelId: string): Promise<boolean> {
  return readCapability(modelId, 'supportsImages')
}

/** 是否支持深度思考：只读 DB */
export async function modelSupportsThinking(modelId: string): Promise<boolean> {
  return readCapability(modelId, 'supportsThinking')
}

/** 是否支持联网搜索：只读 DB */
export async function modelSupportsWebSearch(modelId: string): Promise<boolean> {
  return readCapability(modelId, 'supportsWebSearch')
}

/** 是否支持自定义 function calling（如 chart）：按 Provider */
export function modelSupportsCustomTools(modelId: string): boolean {
  return findProvider(modelId)?.supportsCustomTools?.(modelId) ?? false
}

/** 校验模型存在且 enabled；禁用/未知 ID 抛 400 */
export async function assertModelEnabled(modelId: string): Promise<void> {
  let row: { id: string, enabled: boolean } | undefined
  try {
    row = await db.query.models.findFirst({
      where: eq(schema.models.id, modelId),
      columns: { id: true, enabled: true }
    })
  } catch {
    throw createError({ statusCode: 500, statusMessage: '模型目录不可用' })
  }
  if (!row || !row.enabled) {
    throw createError({ statusCode: 400, statusMessage: '模型不可用或已禁用' })
  }
}
