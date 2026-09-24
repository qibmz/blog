import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockDbSelectResult } from '../../utils/__test__/setup'

vi.mock('../../utils/models', () => ({
  PREFERRED_DEFAULT_MODEL: 'deepseek-flash',
  pickDefaultModel: (list: { value: string }[]) => {
    if (!list.length) return 'deepseek-flash'
    const flash = list.find(m => m.value === 'deepseek-flash')
    if (flash) return flash.value
    const deepseek = list.find(m => m.value.startsWith('deepseek-'))
    if (deepseek) return deepseek.value
    return list[0]!.value
  },
  getModel: vi.fn()
}))

function mockEvent(path = '/api/models', query: Record<string, string> = {}) {
  const qs = new URLSearchParams(query).toString()
  const url = qs ? `${path}?${qs}` : path
  return {
    context: {},
    path: url,
    node: {
      req: {
        method: 'GET',
        url,
        headers: { host: 'localhost' }
      }
    }
  } as any
}

function catalogRows(overrides: Array<Record<string, unknown>> = []) {
  const defaults = [
    {
      id: 'deepseek-flash',
      label: 'DeepSeek Flash',
      icon: 'i-simple-icons-deepseek',
      supportsImages: true,
      supportsThinking: true,
      supportsWebSearch: false,
      sortOrder: 10
    },
    {
      id: 'mimo-v2.6-pro',
      label: 'MiMo V2.6 Pro',
      icon: 'i-simple-icons-xiaomi',
      supportsImages: true,
      supportsThinking: true,
      supportsWebSearch: true,
      sortOrder: 30
    }
  ]
  return overrides.length ? overrides : defaults
}

async function loadHandler() {
  const mod = await import('../models.get')
  mod.__resetModelsCacheForTests()
  return mod.default
}

beforeEach(() => {
  vi.clearAllMocks()
  mockDbSelectResult.mockResolvedValue([])
})

describe('GET /api/models (DB catalog)', () => {
  it('should return empty models with errors when DB fails', async () => {
    vi.resetModules()
    mockDbSelectResult.mockRejectedValue(new Error('Connection refused'))

    const handler = await loadHandler()
    const result = await handler(mockEvent())

    expect(result.models).toHaveLength(0)
    expect(result.default).toBe('deepseek-flash')
    expect(result.fetchedAt).toEqual(expect.any(Number))
    expect(result.errors?.length).toBeGreaterThan(0)
    expect(result.errors![0]!.provider).toBe('database')
  })

  it('should include required fields for each model', async () => {
    vi.resetModules()
    mockDbSelectResult.mockResolvedValue(catalogRows())

    const handler = await loadHandler()
    const result = await handler(mockEvent())

    expect(result.models.length).toBeGreaterThan(0)
    for (const model of result.models) {
      expect(model).toHaveProperty('value')
      expect(model).toHaveProperty('label')
      expect(model).toHaveProperty('icon')
      expect(model).toHaveProperty('supportsImages')
      expect(model).toHaveProperty('supportsThinking')
      expect(model).toHaveProperty('supportsWebSearch')
    }
  })

  it('should map DB rows to ModelOption', async () => {
    vi.resetModules()
    mockDbSelectResult.mockResolvedValue(catalogRows())

    const handler = await loadHandler()
    const result = await handler(mockEvent())

    expect(result.models.map((m: any) => m.value)).toEqual([
      'deepseek-flash',
      'mimo-v2.6-pro'
    ])
    expect(result.default).toBe('deepseek-flash')
    const flash = result.models.find((m: any) => m.value === 'deepseek-flash')
    expect(flash!.supportsImages).toBe(true)
    expect(flash!.supportsThinking).toBe(true)
    expect(flash!.supportsWebSearch).toBe(false)
  })

  it('should return cached result on second call', async () => {
    vi.resetModules()
    mockDbSelectResult.mockResolvedValue(catalogRows())

    const handler = await loadHandler()

    const result1 = await handler(mockEvent())
    const result2 = await handler(mockEvent())

    expect(result1).toEqual(result2)
    expect(mockDbSelectResult).toHaveBeenCalledTimes(1)
  })

  it('should bypass cache when fresh=1', async () => {
    vi.resetModules()
    mockDbSelectResult.mockResolvedValue(catalogRows())

    const handler = await loadHandler()

    await handler(mockEvent())
    await handler(mockEvent('/api/models', { fresh: '1' }))

    expect(mockDbSelectResult).toHaveBeenCalledTimes(2)
  })

  it('should serve stale snapshot when DB fails after a success', async () => {
    vi.resetModules()
    mockDbSelectResult
      .mockResolvedValueOnce(catalogRows([{
        id: 'deepseek-flash',
        label: 'DeepSeek Flash',
        icon: 'i-simple-icons-deepseek',
        supportsImages: true,
        supportsThinking: true,
        supportsWebSearch: false,
        sortOrder: 10
      }]))
      .mockRejectedValue(new Error('down'))

    const handler = await loadHandler()
    const ok = await handler(mockEvent())
    expect(ok.models).toHaveLength(1)

    const stale = await handler(mockEvent('/api/models', { fresh: '1' }))
    expect(stale.stale).toBe(true)
    expect(stale.models).toHaveLength(1)
    expect(stale.models[0]!.value).toBe('deepseek-flash')
    expect(stale.errors?.length).toBeGreaterThan(0)
  })

  it('should use empty label/icon fallbacks', async () => {
    vi.resetModules()
    mockDbSelectResult.mockResolvedValue([{
      id: 'deepseek-flash',
      label: '',
      icon: '',
      supportsImages: false,
      supportsThinking: false,
      supportsWebSearch: false,
      sortOrder: 0
    }])

    const handler = await loadHandler()
    const result = await handler(mockEvent())

    expect(result.models[0]!.label).toBe('deepseek-flash')
    expect(result.models[0]!.icon).toBe('i-lucide-bot')
  })
})
