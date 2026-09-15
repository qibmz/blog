import { describe, it, expect, vi } from 'vitest'

// Mock AI SDK providers before importing models.ts
const mockModelInstance = { provider: 'mock', modelId: 'mock-model' }
const mockDeepSeekFn = vi.fn(() => mockModelInstance)
const mockMimoFn = vi.fn(() => mockModelInstance)

vi.mock('@ai-sdk/deepseek', () => ({
  createDeepSeek: () => mockDeepSeekFn
}))

vi.mock('@ai-sdk/openai-compatible', () => ({
  createOpenAICompatible: () => mockMimoFn
}))

describe('PROVIDER_REGISTRY', () => {
  it('should have at least one provider configured', async () => {
    const { PROVIDER_REGISTRY } = await import('../models')
    expect(PROVIDER_REGISTRY.length).toBeGreaterThan(0)
  })

  it('should have required fields for each provider', async () => {
    const { PROVIDER_REGISTRY } = await import('../models')
    for (const p of PROVIDER_REGISTRY) {
      expect(p).toHaveProperty('name')
      expect(p).toHaveProperty('prefixes')
      expect(p).toHaveProperty('icon')
      expect(p).toHaveProperty('modelsUrl')
      expect(p).toHaveProperty('getInstance')
      expect(p.prefixes.length).toBeGreaterThan(0)
    }
  })
})

describe('pickDefaultModel', () => {
  it('should prefer deepseek-flash when present', async () => {
    const { pickDefaultModel } = await import('../models')
    expect(pickDefaultModel([
      { value: 'deepseek-v4-pro', label: 'Pro', icon: 'i' },
      { value: 'deepseek-flash', label: 'Flash', icon: 'i' }
    ])).toBe('deepseek-flash')
  })

  it('should fall back to first deepseek-* then first item', async () => {
    const { pickDefaultModel, PREFERRED_DEFAULT_MODEL } = await import('../models')
    expect(pickDefaultModel([
      { value: 'mimo-v2.5-pro', label: 'MiMo', icon: 'i' },
      { value: 'deepseek-v4-pro', label: 'Pro', icon: 'i' }
    ])).toBe('deepseek-v4-pro')
    expect(pickDefaultModel([
      { value: 'mimo-v2.5-pro', label: 'MiMo', icon: 'i' }
    ])).toBe('mimo-v2.5-pro')
    expect(pickDefaultModel([])).toBe(PREFERRED_DEFAULT_MODEL)
  })
})

describe('DEFAULT_MODEL', () => {
  it('should prefer deepseek-flash', async () => {
    const { DEFAULT_MODEL, PREFERRED_DEFAULT_MODEL } = await import('../models')
    expect(DEFAULT_MODEL).toBe('deepseek-flash')
    expect(DEFAULT_MODEL).toBe(PREFERRED_DEFAULT_MODEL)
  })
})

describe('modelIdToLabel', () => {
  it('should convert model ID to human-readable label', async () => {
    const { modelIdToLabel, PROVIDER_REGISTRY } = await import('../models')
    const mimoProvider = PROVIDER_REGISTRY.find(p => p.name === 'MiMo')!
    expect(modelIdToLabel(mimoProvider, 'mimo-v2.5-pro')).toBe('V2.5 Pro')
    expect(modelIdToLabel(mimoProvider, 'mimo-v2-flash')).toBe('V2 Flash')
  })

  it('should handle model IDs without matching prefix', async () => {
    const { modelIdToLabel, PROVIDER_REGISTRY } = await import('../models')
    const deepseekProvider = PROVIDER_REGISTRY[0]!
    expect(modelIdToLabel(deepseekProvider, 'unknown-model')).toBe('Unknown Model')
  })
})

describe('getModel', () => {
  it('should return a model instance for a valid model value', async () => {
    const { getModel, DEFAULT_MODEL } = await import('../models')
    const instance = getModel(DEFAULT_MODEL)
    expect(instance).toBeDefined()
    expect(typeof instance).toBe('object')
  })

  it('should fall back to first provider for unknown value', async () => {
    const { getModel } = await import('../models')
    const instance = getModel('non-existent-model')
    expect(instance).toBeDefined()
  })

  it('should return an instance for common DeepSeek and MiMo IDs', async () => {
    const { getModel } = await import('../models')
    for (const id of ['deepseek-flash', 'deepseek-v4-pro', 'mimo-v2.5-pro']) {
      expect(getModel(id)).toBeDefined()
    }
  })
})

describe('modelSupportsImages', () => {
  it('should return true for a MiMo model that supports images (provider fallback)', async () => {
    const { modelSupportsImages } = await import('../models')
    // DB 未命中 → fallback 到 Provider 规则
    // 仅 mimo-v2.5 / mimo-v2-omni 支持图片
    const result = await modelSupportsImages('mimo-v2.5')
    expect(result).toBe(true)
  })

  it('should return false for a MiMo pro model (provider fallback)', async () => {
    const { modelSupportsImages } = await import('../models')
    // mimo-v2.5-pro 不支持图片
    const result = await modelSupportsImages('mimo-v2.5-pro')
    expect(result).toBe(false)
  })

  it('should return false for MiMo ASR (provider fallback)', async () => {
    const { modelSupportsImages } = await import('../models')
    // mimo-v2.5-asr 仅语音识别，不能传图
    const result = await modelSupportsImages('mimo-v2.5-asr')
    expect(result).toBe(false)
  })

  it('should exclude ASR from MiMo chat model filters', async () => {
    const { PROVIDER_REGISTRY } = await import('../models')
    const mimo = PROVIDER_REGISTRY.find(p => p.name === 'MiMo')!
    expect(mimo.exclude.some(ex => ex.toLowerCase() === 'asr')).toBe(true)
  })

  it('should only include mimo-v2.5-pro and mimo-v2.5 in MiMo allowlist', async () => {
    const { PROVIDER_REGISTRY } = await import('../models')
    const mimo = PROVIDER_REGISTRY.find(p => p.name === 'MiMo')!
    expect(mimo.include).toEqual(['mimo-v2.5-pro', 'mimo-v2.5'])
  })

  it('should return false for DeepSeek Pro (provider fallback)', async () => {
    const { modelSupportsImages } = await import('../models')
    const result = await modelSupportsImages('deepseek-v4-pro')
    expect(result).toBe(false)
  })

  it('should return true for deepseek-flash (provider fallback)', async () => {
    const { mockDbFindFirstModel } = await import('./setup')
    mockDbFindFirstModel.mockResolvedValueOnce(null)
    const { modelSupportsImages } = await import('../models')
    expect(await modelSupportsImages('deepseek-flash')).toBe(true)
  })

  it('should return DB value when DB row exists (DB-first)', async () => {
    const { mockDbFindFirstModel } = await import('./setup')
    mockDbFindFirstModel.mockResolvedValueOnce({ supportsImages: true })

    const { modelSupportsImages } = await import('../models')
    // deepseek-v4-pro 在 Provider 规则中返回 false，但 DB 说有 → DB 优先
    const result = await modelSupportsImages('deepseek-v4-pro')
    expect(result).toBe(true)
  })

  it('should fallback to provider when DB query fails', async () => {
    const { mockDbFindFirstModel } = await import('./setup')
    mockDbFindFirstModel.mockRejectedValueOnce(new Error('DB connection error'))

    const { modelSupportsImages } = await import('../models')
    // DB 失败 → fallback 到 Provider，mimo-v2.5 应返回 true
    const result = await modelSupportsImages('mimo-v2.5')
    expect(result).toBe(true)
  })

  it('should fallback to provider for unknown model when DB returns null', async () => {
    const { mockDbFindFirstModel } = await import('./setup')
    mockDbFindFirstModel.mockResolvedValueOnce(null)

    const { modelSupportsImages } = await import('../models')
    // DB 无此 model → fallback 到 Provider
    const result = await modelSupportsImages('deepseek-v4-pro')
    expect(result).toBe(false)
  })
})

describe('modelSupportsThinking', () => {
  it('should return true for MiMo chat models', async () => {
    const { modelSupportsThinking } = await import('../models')
    expect(modelSupportsThinking('mimo-v2.5-pro')).toBe(true)
    expect(modelSupportsThinking('mimo-v2.5')).toBe(true)
  })

  it('should return false for MiMo ASR', async () => {
    const { modelSupportsThinking } = await import('../models')
    expect(modelSupportsThinking('mimo-v2.5-asr')).toBe(false)
  })

  it('should return true for DeepSeek', async () => {
    const { modelSupportsThinking } = await import('../models')
    expect(modelSupportsThinking('deepseek-v4-pro')).toBe(true)
  })
})

describe('modelSupportsCustomTools', () => {
  it('should return true for DeepSeek', async () => {
    const { modelSupportsCustomTools } = await import('../models')
    expect(modelSupportsCustomTools('deepseek-v4-pro')).toBe(true)
  })

  it('should return false for MiMo', async () => {
    const { modelSupportsCustomTools } = await import('../models')
    expect(modelSupportsCustomTools('mimo-v2.5-pro')).toBe(false)
    expect(modelSupportsCustomTools('mimo-v2.5')).toBe(false)
  })
})

describe('modelSupportsWebSearch', () => {
  it('should return true for MiMo chat models (provider fallback)', async () => {
    const { mockDbFindFirstModel } = await import('./setup')
    mockDbFindFirstModel.mockResolvedValueOnce(null)
    const { modelSupportsWebSearch } = await import('../models')
    expect(await modelSupportsWebSearch('mimo-v2.5-pro')).toBe(true)
  })

  it('should return false for DeepSeek (provider fallback)', async () => {
    const { mockDbFindFirstModel } = await import('./setup')
    mockDbFindFirstModel.mockResolvedValueOnce(null)
    const { modelSupportsWebSearch } = await import('../models')
    expect(await modelSupportsWebSearch('deepseek-v4-pro')).toBe(false)
  })

  it('should return false for ASR', async () => {
    const { mockDbFindFirstModel } = await import('./setup')
    mockDbFindFirstModel.mockResolvedValueOnce(null)
    const { modelSupportsWebSearch } = await import('../models')
    expect(await modelSupportsWebSearch('mimo-v2.5-asr')).toBe(false)
  })

  it('should prefer DB false over provider true for MiMo chat models', async () => {
    const { mockDbFindFirstModel } = await import('./setup')
    mockDbFindFirstModel.mockResolvedValueOnce({
      id: 'mimo-v2.5-pro',
      supportsWebSearch: false
    })
    const { modelSupportsWebSearch } = await import('../models')
    expect(await modelSupportsWebSearch('mimo-v2.5-pro')).toBe(false)
  })

  it('should prefer DB true over provider false for DeepSeek', async () => {
    const { mockDbFindFirstModel } = await import('./setup')
    mockDbFindFirstModel.mockResolvedValueOnce({
      id: 'deepseek-v4-pro',
      supportsWebSearch: true
    })
    const { modelSupportsWebSearch } = await import('../models')
    expect(await modelSupportsWebSearch('deepseek-v4-pro')).toBe(true)
  })
})
