import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mock$Fetch } from '../../utils/__test__/setup'

const MOCK_PROVIDER = {
  name: 'TestProvider',
  prefixes: ['test-'],
  icon: 'i-simple-icons-test',
  modelsUrl: 'https://test.api/v1/models',
  headers: () => ({ Authorization: 'Bearer test' }),
  exclude: [],
  getInstance: vi.fn()
}

// Mock models module to avoid real provider initialization
vi.mock('../../utils/models', () => ({
  PROVIDER_REGISTRY: [MOCK_PROVIDER],
  FALLBACK_MODELS: [
    { value: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro', icon: 'i-simple-icons-deepseek' },
    { value: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash', icon: 'i-simple-icons-deepseek' },
    { value: 'mimo-v2.5-pro', label: 'MiMo V2.5 Pro', icon: 'i-simple-icons-xiaomi' }
  ],
  DEFAULT_MODEL: 'deepseek-v4-pro',
  modelIdToLabel: vi.fn((_provider, id: string) => {
    // Simple mock: strip prefix and capitalize
    const rest = id.replace(/^(test-)/, '')
    return rest.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
  }),
  getModel: vi.fn()
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/models', () => {
  it('should return models list with default', async () => {
    vi.resetModules()
    mock$Fetch.mockRejectedValue(new Error('API unavailable'))

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
    vi.resetModules()
    mock$Fetch.mockRejectedValue(new Error('API unavailable'))

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
    vi.resetModules()
    mock$Fetch.mockRejectedValue(new Error('API unavailable'))

    const { default: handler } = await import('../models.get')

    const event = { context: {}, path: '/api/models' } as any
    const result1 = await handler(event)
    const result2 = await handler(event)

    expect(result1).toEqual(result2)
    // API failure → fallback; $fetch is called once per provider (1 provider)
    expect(mock$Fetch).toHaveBeenCalledTimes(1)
  })
})
