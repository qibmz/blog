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

describe('FALLBACK_MODELS', () => {
  it('should export a non-empty fallback list', async () => {
    const { FALLBACK_MODELS } = await import('../models')
    expect(FALLBACK_MODELS.length).toBeGreaterThan(0)
  })

  it('should have required fields for each fallback model', async () => {
    const { FALLBACK_MODELS } = await import('../models')
    for (const model of FALLBACK_MODELS) {
      expect(model).toHaveProperty('value')
      expect(model).toHaveProperty('label')
      expect(model).toHaveProperty('icon')
      expect(typeof model.value).toBe('string')
      expect(typeof model.label).toBe('string')
    }
  })

  it('should include DeepSeek and MiMo fallback models', async () => {
    const { FALLBACK_MODELS } = await import('../models')
    const values = FALLBACK_MODELS.map(m => m.value)
    expect(values.some(v => v.includes('deepseek'))).toBe(true)
    expect(values.some(v => v.includes('mimo'))).toBe(true)
  })
})

describe('DEFAULT_MODEL', () => {
  it('should be the first fallback model', async () => {
    const { DEFAULT_MODEL, FALLBACK_MODELS } = await import('../models')
    expect(DEFAULT_MODEL).toBe(FALLBACK_MODELS[0]!.value)
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
    const { getModel, FALLBACK_MODELS } = await import('../models')
    const firstModelValue = FALLBACK_MODELS[0]!.value
    const instance = getModel(firstModelValue)
    expect(instance).toBeDefined()
    expect(typeof instance).toBe('object')
  })

  it('should fall back to first provider for unknown value', async () => {
    const { getModel } = await import('../models')
    const instance = getModel('non-existent-model')
    expect(instance).toBeDefined()
  })

  it('should return the same type for any fallback model', async () => {
    const { getModel, FALLBACK_MODELS } = await import('../models')
    for (const model of FALLBACK_MODELS) {
      const instance = getModel(model.value)
      expect(instance).toBeDefined()
    }
  })
})
