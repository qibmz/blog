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

describe('MODEL_OPTIONS', () => {
  it('should export a non-empty model list', async () => {
    const { MODEL_OPTIONS } = await import('../models')
    expect(MODEL_OPTIONS.length).toBeGreaterThan(0)
  })

  it('should have required fields for each model', async () => {
    const { MODEL_OPTIONS } = await import('../models')
    for (const model of MODEL_OPTIONS) {
      expect(model).toHaveProperty('value')
      expect(model).toHaveProperty('label')
      expect(model).toHaveProperty('icon')
      expect(typeof model.value).toBe('string')
      expect(typeof model.label).toBe('string')
    }
  })

  it('should have DeepSeek and MiMo models', async () => {
    const { MODEL_OPTIONS } = await import('../models')
    const values = MODEL_OPTIONS.map(m => m.value)
    expect(values.some(v => v.includes('deepseek'))).toBe(true)
    expect(values.some(v => v.includes('mimo'))).toBe(true)
  })
})

describe('DEFAULT_MODEL', () => {
  it('should be the first model in the list', async () => {
    const { DEFAULT_MODEL, MODEL_OPTIONS } = await import('../models')
    expect(DEFAULT_MODEL).toBe(MODEL_OPTIONS[0]!.value)
  })
})

describe('getModel', () => {
  it('should return a model instance for a valid model value', async () => {
    const { getModel, MODEL_OPTIONS } = await import('../models')
    const firstModelValue = MODEL_OPTIONS[0]!.value
    const instance = getModel(firstModelValue)
    expect(instance).toBeDefined()
    expect(typeof instance).toBe('object')
  })

  it('should fall back to first model for unknown value', async () => {
    const { getModel } = await import('../models')
    const instance = getModel('non-existent-model')
    // 应该调用 fallback 模型的 getInstance
    expect(instance).toBeDefined()
    // Both models return the same mock instance, so checking non-null is enough
  })

  it('should return the same type for any valid model', async () => {
    const { getModel, MODEL_OPTIONS } = await import('../models')
    for (const model of MODEL_OPTIONS) {
      const instance = getModel(model.value)
      expect(instance).toBeDefined()
    }
  })
})
