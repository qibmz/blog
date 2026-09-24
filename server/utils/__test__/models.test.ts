import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDbFindFirstModel } from './setup'

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

beforeEach(() => {
  mockDbFindFirstModel.mockReset()
  mockDbFindFirstModel.mockResolvedValue(null)
})

describe('PROVIDER_REGISTRY', () => {
  it('should have at least one provider configured', async () => {
    const { PROVIDER_REGISTRY } = await import('../models')
    expect(PROVIDER_REGISTRY.length).toBeGreaterThan(0)
  })

  it('should have SDK routing fields for each provider', async () => {
    const { PROVIDER_REGISTRY } = await import('../models')
    for (const p of PROVIDER_REGISTRY) {
      expect(p).toHaveProperty('name')
      expect(p).toHaveProperty('prefixes')
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

describe('PREFERRED_DEFAULT_MODEL', () => {
  it('should prefer deepseek-flash', async () => {
    const { PREFERRED_DEFAULT_MODEL } = await import('../models')
    expect(PREFERRED_DEFAULT_MODEL).toBe('deepseek-flash')
  })
})

describe('getModel', () => {
  it('should return a model instance for a valid model value', async () => {
    const { getModel, PREFERRED_DEFAULT_MODEL } = await import('../models')
    const instance = getModel(PREFERRED_DEFAULT_MODEL)
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

describe('modelSupportsImages (DB-only)', () => {
  it('should return DB value when row exists', async () => {
    mockDbFindFirstModel.mockResolvedValueOnce({ supportsImages: true })
    const { modelSupportsImages } = await import('../models')
    expect(await modelSupportsImages('deepseek-flash')).toBe(true)
  })

  it('should return false when DB says false', async () => {
    mockDbFindFirstModel.mockResolvedValueOnce({ supportsImages: false })
    const { modelSupportsImages } = await import('../models')
    expect(await modelSupportsImages('deepseek-v4-pro')).toBe(false)
  })

  it('should return false when DB has no row', async () => {
    mockDbFindFirstModel.mockResolvedValueOnce(null)
    const { modelSupportsImages } = await import('../models')
    expect(await modelSupportsImages('mimo-v2.5')).toBe(false)
  })

  it('should return false when DB query fails', async () => {
    mockDbFindFirstModel.mockRejectedValueOnce(new Error('DB connection error'))
    const { modelSupportsImages } = await import('../models')
    expect(await modelSupportsImages('mimo-v2.5')).toBe(false)
  })
})

describe('modelSupportsThinking (DB-only)', () => {
  it('should return true when DB says true', async () => {
    mockDbFindFirstModel.mockResolvedValueOnce({ supportsThinking: true })
    const { modelSupportsThinking } = await import('../models')
    expect(await modelSupportsThinking('mimo-v2.5-pro')).toBe(true)
  })

  it('should return false when DB says false', async () => {
    mockDbFindFirstModel.mockResolvedValueOnce({ supportsThinking: false })
    const { modelSupportsThinking } = await import('../models')
    expect(await modelSupportsThinking('mimo-v2.5-asr')).toBe(false)
  })

  it('should return false when DB has no row', async () => {
    mockDbFindFirstModel.mockResolvedValueOnce(null)
    const { modelSupportsThinking } = await import('../models')
    expect(await modelSupportsThinking('deepseek-v4-pro')).toBe(false)
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

describe('modelSupportsWebSearch (DB-only)', () => {
  it('should return DB true', async () => {
    mockDbFindFirstModel.mockResolvedValueOnce({ supportsWebSearch: true })
    const { modelSupportsWebSearch } = await import('../models')
    expect(await modelSupportsWebSearch('mimo-v2.5-pro')).toBe(true)
  })

  it('should return DB false', async () => {
    mockDbFindFirstModel.mockResolvedValueOnce({ supportsWebSearch: false })
    const { modelSupportsWebSearch } = await import('../models')
    expect(await modelSupportsWebSearch('deepseek-v4-pro')).toBe(false)
  })

  it('should return false when DB has no row', async () => {
    mockDbFindFirstModel.mockResolvedValueOnce(null)
    const { modelSupportsWebSearch } = await import('../models')
    expect(await modelSupportsWebSearch('mimo-v2.5')).toBe(false)
  })
})

describe('assertModelEnabled', () => {
  it('should pass when model exists and enabled', async () => {
    mockDbFindFirstModel.mockResolvedValueOnce({ id: 'deepseek-flash', enabled: true })
    const { assertModelEnabled } = await import('../models')
    await expect(assertModelEnabled('deepseek-flash')).resolves.toBeUndefined()
  })

  it('should throw 400 when model disabled', async () => {
    mockDbFindFirstModel.mockResolvedValueOnce({ id: 'deepseek-flash', enabled: false })
    const { assertModelEnabled } = await import('../models')
    await expect(assertModelEnabled('deepseek-flash')).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: '模型不可用或已禁用'
    })
  })

  it('should throw 400 when model missing', async () => {
    mockDbFindFirstModel.mockResolvedValueOnce(null)
    const { assertModelEnabled } = await import('../models')
    await expect(assertModelEnabled('nope')).rejects.toMatchObject({
      statusCode: 400
    })
  })
})
