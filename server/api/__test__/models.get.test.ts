import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mock$Fetch, mockDbSelectResult } from '../../utils/__test__/setup'

const MOCK_PROVIDER: {
  name: string
  prefixes: string[]
  icon: string
  modelsUrl: string
  headers: () => Record<string, string>
  exclude: string[]
  include?: string[]
  getInstance: ReturnType<typeof vi.fn>
  supportsImages?: (id: string) => boolean
  supportsThinking?: (id: string) => boolean
  supportsWebSearch?: (id: string) => boolean
} = {
  name: 'TestProvider',
  prefixes: ['test-'],
  icon: 'i-simple-icons-test',
  modelsUrl: 'https://test.api/v1/models',
  headers: () => ({ Authorization: 'Bearer test' }),
  exclude: [],
  getInstance: vi.fn()
}

vi.mock('../../utils/models', () => ({
  PROVIDER_REGISTRY: [MOCK_PROVIDER],
  PREFERRED_DEFAULT_MODEL: 'deepseek-flash',
  DEFAULT_MODEL: 'deepseek-flash',
  pickDefaultModel: (list: { value: string }[]) => {
    if (!list.length) return 'deepseek-flash'
    const flash = list.find(m => m.value === 'deepseek-flash')
    if (flash) return flash.value
    const deepseek = list.find(m => m.value.startsWith('deepseek-'))
    if (deepseek) return deepseek.value
    return list[0]!.value
  },
  modelIdToLabel: vi.fn((_provider, id: string) => {
    const rest = id.replace(/^(test-)/, '')
    return rest.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
  }),
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

async function loadHandler() {
  const mod = await import('../models.get')
  mod.__resetModelsCacheForTests()
  return mod.default
}

beforeEach(() => {
  vi.clearAllMocks()
  delete MOCK_PROVIDER.include
  mockDbSelectResult.mockResolvedValue([])
  mock$Fetch.mockReset()
})

describe('GET /api/models', () => {
  it('should return empty models with errors when all providers fail', async () => {
    vi.resetModules()
    mock$Fetch.mockRejectedValue(new Error('API unavailable'))

    const handler = await loadHandler()
    const result = await handler(mockEvent())

    expect(result.models).toHaveLength(0)
    expect(result.default).toBe('deepseek-flash')
    expect(result.fetchedAt).toEqual(expect.any(Number))
    expect(result.errors?.length).toBeGreaterThan(0)
    expect(result.errors![0]!.provider).toBe('TestProvider')
  })

  it('should include required fields for each model', async () => {
    vi.resetModules()
    mock$Fetch.mockResolvedValue({
      data: [{ id: 'test-v1' }]
    })

    const handler = await loadHandler()
    const result = await handler(mockEvent())

    expect(result.models.length).toBeGreaterThan(0)
    for (const model of result.models) {
      expect(model).toHaveProperty('value')
      expect(model).toHaveProperty('label')
      expect(model).toHaveProperty('icon')
    }
  })

  it('should return cached result on second call', async () => {
    vi.resetModules()
    mock$Fetch.mockResolvedValue({
      data: [{ id: 'test-v1' }]
    })

    const handler = await loadHandler()

    const result1 = await handler(mockEvent())
    const result2 = await handler(mockEvent())

    expect(result1).toEqual(result2)
    expect(mock$Fetch).toHaveBeenCalledTimes(1)
  })

  it('should bypass cache when fresh=1', async () => {
    vi.resetModules()
    mock$Fetch.mockResolvedValue({
      data: [{ id: 'test-v1' }]
    })

    const handler = await loadHandler()

    await handler(mockEvent())
    await handler(mockEvent('/api/models', { fresh: '1' }))

    expect(mock$Fetch).toHaveBeenCalledTimes(2)
  })

  it('should pick default from live list', async () => {
    vi.resetModules()
    mock$Fetch.mockResolvedValue({
      data: [{ id: 'test-v1' }, { id: 'test-v2' }]
    })

    const handler = await loadHandler()
    const result = await handler(mockEvent())

    expect(result.default).toBe('test-v1')
    expect(result.models.map((m: any) => m.value)).toEqual(['test-v1', 'test-v2'])
  })

  it('should serve stale snapshot when providers all fail after a success', async () => {
    vi.resetModules()
    mock$Fetch
      .mockResolvedValueOnce({ data: [{ id: 'test-v1' }] })
      .mockRejectedValue(new Error('down'))

    const handler = await loadHandler()
    const ok = await handler(mockEvent())
    expect(ok.models).toHaveLength(1)

    const stale = await handler(mockEvent('/api/models', { fresh: '1' }))
    expect(stale.stale).toBe(true)
    expect(stale.models).toHaveLength(1)
    expect(stale.models[0]!.value).toBe('test-v1')
    expect(stale.errors?.length).toBeGreaterThan(0)
  })
})

describe('DB-backed model capabilities', () => {
  it('should use DB supportsImages when DB has record (priority 1)', async () => {
    vi.resetModules()
    mock$Fetch.mockResolvedValue({
      data: [{ id: 'test-v1' }, { id: 'test-v2' }]
    })
    mockDbSelectResult.mockResolvedValue([
      { id: 'test-v1', supportsImages: true, supportsWebSearch: false },
      { id: 'test-v2', supportsImages: false, supportsWebSearch: true }
    ])

    const handler = await loadHandler()
    const result = await handler(mockEvent())

    const v1 = result.models.find((m: any) => m.value === 'test-v1')
    const v2 = result.models.find((m: any) => m.value === 'test-v2')
    expect(v1!.supportsImages).toBe(true)
    expect(v2!.supportsImages).toBe(false)
    expect(v1!.supportsWebSearch).toBe(false)
    expect(v2!.supportsWebSearch).toBe(true)
  })

  it('should apply include allowlist when provider has include', async () => {
    vi.resetModules()
    MOCK_PROVIDER.include = ['test-keep']
    mock$Fetch.mockResolvedValue({
      data: [{ id: 'test-keep' }, { id: 'test-drop' }, { id: 'test-asr' }]
    })

    const handler = await loadHandler()
    const result = await handler(mockEvent())

    expect(result.models.map((m: any) => m.value)).toEqual(['test-keep'])
  })

  it('should fallback when DB has no record for model (priority 2)', async () => {
    vi.resetModules()
    mock$Fetch.mockResolvedValue({
      data: [{ id: 'test-v1' }]
    })
    mockDbSelectResult.mockResolvedValue([])

    const handler = await loadHandler()
    const result = await handler(mockEvent())

    expect(result.models[0]!.supportsImages).toBe(false)
  })

  it('should fallback when DB query fails (priority 3)', async () => {
    vi.resetModules()
    mock$Fetch.mockResolvedValue({
      data: [{ id: 'test-v1' }]
    })
    mockDbSelectResult.mockRejectedValue(new Error('Connection refused'))

    const handler = await loadHandler()
    const result = await handler(mockEvent())

    expect(result.models[0]!.supportsImages).toBe(false)
  })
})
