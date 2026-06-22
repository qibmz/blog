/**
 * Vitest 全局 mock 设置
 *
 * 模拟 Nitro auto-import 的所有变量和函数。
 * Nitro 在编译时自动导入 h3、drizzle-orm、nuxt-auth-utils、server/db 等模块，
 * 源码中直接引用这些标识符，因此 vitest 需要 globals stub。
 */
import { vi } from 'vitest'

// ─── Shared types auto-imports (from shared/types/) ─────────────────────────
import { UIMessageSchema, PatchChatBodySchema } from '#shared/types/chat'

// ─── Mock schema ────────────────────────────────────────────────────────────
export const mockSchema = {
  chats: {
    id: 'id',
    userId: 'user_id',
    title: 'title',
    model: 'model',
    pinned: 'pinned',
    createdAt: 'created_at'
  },
  messages: {
    id: 'id',
    chatId: 'chat_id',
    role: 'role',
    parts: 'parts',
    createdAt: 'created_at'
  },
  models: {
    id: 'id',
    supportsImages: 'supports_images',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
}

// ─── Mock db ────────────────────────────────────────────────────────────────
// 每个测试通过 vi.fn() 控制返回值

export function resetStore() {
  // no-op, mock 由 vi.fn() 控制
}

// 可配置的 mock 函数
export const mockDbSelectResult = vi.fn()
export const mockDbFindFirst = vi.fn()
export const mockDbFindMany = vi.fn()
export const mockDbInsertReturning = vi.fn()
export const mockDbUpdate = vi.fn(() => ({
  set: vi.fn(() => ({
    where: vi.fn(() => Promise.resolve())
  }))
}))
export const mockDbDelete = vi.fn()

export const mockDb = {
  select: vi.fn(() => {
    const fromObj = {
      innerJoin: vi.fn(() => ({
        where: vi.fn(() => mockDbSelectResult())
      })),
      where: vi.fn(() => mockDbSelectResult())
    }
    return {
      from: vi.fn(() => fromObj)
    }
  }),
  query: {
    chats: {
      findFirst: (...args: unknown[]) => mockDbFindFirst(...args),
      findMany: (...args: unknown[]) => mockDbFindMany(...args)
    }
  },
  insert: vi.fn(() => ({
    values: vi.fn(() => ({
      returning: () => mockDbInsertReturning()
    }))
  })),
  update: mockDbUpdate,
  delete: vi.fn(() => ({
    where: mockDbDelete
  }))
}

// ─── Mock user ──────────────────────────────────────────────────────────────
export const mockUser = {
  id: 'test-user-1',
  name: 'Test User',
  login: 'testuser',
  avatar: 'https://example.com/avatar.png'
}

export function mockRequireUserSession(_event: unknown) {
  return Promise.resolve({ user: mockUser })
}

export function mockGetUserSession(_event: unknown) {
  return Promise.resolve({ user: mockUser })
}

// ─── Drizzle operators (simplified, return the arguments for assertion) ─────
export const mockEq = vi.fn((a: unknown, b: unknown) => ({ _type: 'eq', a, b }))
export const mockAnd = vi.fn((...args: unknown[]) => ({ _type: 'and', args }))
export const mockDesc = vi.fn((col: unknown) => ({ _type: 'desc', col }))
export const mockGte = vi.fn((a: unknown, b: unknown) => ({ _type: 'gte', a, b }))
export const mockSql = vi.fn((_strings: TemplateStringsArray, ..._values: unknown[]) => ({ _type: 'sql' }))
export const mockInArray = vi.fn((col: unknown, values: unknown[]) => ({ _type: 'inArray', col, values }))

// ─── h3 auto-imports ────────────────────────────────────────────────────────
export const mockDefineEventHandler = vi.fn((handler: (event: unknown) => unknown) => handler)

export const mockGetValidatedRouterParams = vi.fn(
  async (_event: unknown, validateFn?: (p: unknown) => unknown) => {
    const params = { id: 'test-chat-id' }
    return typeof validateFn === 'function' ? validateFn(params) : params
  }
)

export const mockReadValidatedBody = vi.fn(
  async (_event: unknown, validateFn?: (b: unknown) => unknown) => {
    const body = {
      model: 'deepseek-v4-pro',
      messages: [{ id: 'msg-1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }],
      message: { id: 'msg-1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }
    }
    return typeof validateFn === 'function' ? validateFn(body) : body
  }
)
vi.stubGlobal('UIMessageSchema', UIMessageSchema)
vi.stubGlobal('PatchChatBodySchema', PatchChatBodySchema)

// ─── Server utils auto-imports (from server/utils/) ─────────────────────────
// Errors
export const mockRaiseNotFound = vi.fn((message = 'Not found') => {
  const err = new Error(message) as Error & { statusCode: number, statusMessage: string }
  err.statusCode = 404
  err.statusMessage = message
  return err
})

export const mockRaiseRateLimit = vi.fn((message: string) => {
  const err = new Error(message) as Error & { statusCode: number, statusMessage: string }
  err.statusCode = 429
  err.statusMessage = message
  return err
})

// ─── h3 sendRedirect ─────────────────────────────────────────────────────────
export const mockSendRedirect = vi.fn((_event: unknown, location: string) => {
  return new Response(null, { status: 302, headers: { Location: location } })
})

// ─── Nitro auto-import: $fetch (ofetch) ──────────────────────────────────────
export const mock$Fetch = vi.fn()

// ─── Apply ALL globals ──────────────────────────────────────────────────────
vi.stubGlobal('db', mockDb)
vi.stubGlobal('schema', mockSchema)
vi.stubGlobal('$fetch', mock$Fetch)

// h3 auto-imports
vi.stubGlobal('defineEventHandler', mockDefineEventHandler)
vi.stubGlobal('getValidatedRouterParams', mockGetValidatedRouterParams)
vi.stubGlobal('readValidatedBody', mockReadValidatedBody)

// drizzle-orm auto-imports
vi.stubGlobal('eq', mockEq)
vi.stubGlobal('and', mockAnd)
vi.stubGlobal('desc', mockDesc)
vi.stubGlobal('gte', mockGte)
vi.stubGlobal('sql', mockSql)
vi.stubGlobal('inArray', mockInArray)

// nuxt-auth-utils auto-import
vi.stubGlobal('requireUserSession', mockRequireUserSession)
vi.stubGlobal('getUserSession', mockGetUserSession)

// server/utils/ auto-imports
vi.stubGlobal('raiseNotFound', mockRaiseNotFound)
vi.stubGlobal('raiseRateLimit', mockRaiseRateLimit)

// ─── Module-level mocks ─────────────────────────────────────────────────────
// h3 — for explicit imports (like createError in errors.ts)
vi.mock('h3', async () => {
  const actual = await vi.importActual('h3')
  return {
    ...actual as object,
    defineEventHandler: mockDefineEventHandler,
    getValidatedRouterParams: mockGetValidatedRouterParams,
    readValidatedBody: mockReadValidatedBody,
    sendRedirect: mockSendRedirect
  }
})

// drizzle-orm — for explicit imports
vi.mock('drizzle-orm', async () => {
  const actual = await vi.importActual('drizzle-orm')
  return {
    ...actual as object,
    eq: mockEq,
    and: mockAnd,
    desc: mockDesc,
    gte: mockGte,
    sql: mockSql,
    inArray: mockInArray
  }
})

// nuxt-auth-utils — for explicit imports
vi.mock('#auth-utils', () => ({
  requireUserSession: mockRequireUserSession,
  getUserSession: mockGetUserSession
}))
