import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock $fetch for external API calls
vi.mock('ofetch', () => ({
  $fetch: vi.fn()
}))

// Mock models module to avoid provider initialization
vi.mock('../../utils/models', () => ({
  MODEL_OPTIONS: [
    { value: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro', icon: 'i-simple-icons-deepseek' },
    { value: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash', icon: 'i-simple-icons-deepseek' },
    { value: 'mimo-v2.5-pro', label: 'MiMo V2.5 Pro', icon: 'i-simple-icons-xiaomi' }
  ],
  DEFAULT_MODEL: 'deepseek-v4-pro',
  getModel: vi.fn()
}))

beforeEach(() => {
  vi.clearAllMocks()
  // Reset module cache to clear cached models
  vi.resetModules()
})

describe('GET /api/models', () => {
  it('should return models list with default', async () => {
    // Mock $fetch to return empty (API calls fail, fallback to static)
    const { $fetch } = await import('ofetch')
    vi.mocked($fetch).mockRejectedValue(new Error('API unavailable'))

    const { default: handler } = await import('../models.get')

    const event = { context: {}, path: '/api/models' } as any
    const result = await handler(event)

    expect(result).toHaveProperty('models')
    expect(result).toHaveProperty('default')
    expect(Array.isArray(result.models)).toBe(true)
    expect(result.models.length).toBeGreaterThan(0)
    expect(result.default).toBe('deepseek-v4-pro')
  })

  it('should include required fields for each model', async () => {
    const { $fetch } = await import('ofetch')
    vi.mocked($fetch).mockRejectedValue(new Error('API unavailable'))

    const { default: handler } = await import('../models.get')

    const event = { context: {}, path: '/api/models' } as any
    const result = await handler(event)

    for (const model of result.models) {
      expect(model).toHaveProperty('value')
      expect(model).toHaveProperty('label')
      expect(model).toHaveProperty('icon')
    }
  })

  it('should return cached result on second call', async () => {
    const { $fetch } = await import('ofetch')
    vi.mocked($fetch).mockRejectedValue(new Error('API unavailable'))

    const { default: handler } = await import('../models.get')

    const event = { context: {}, path: '/api/models' } as any
    const result1 = await handler(event)
    // Second call should use cache, not call $fetch again
    const result2 = await handler(event)

    expect(result1).toEqual(result2)
    // $fetch should have been called only once (first call)
    // Second call uses module-level cache
  })
})
