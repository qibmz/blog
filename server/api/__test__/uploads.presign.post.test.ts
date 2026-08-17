import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockReadValidatedBody, mockRequireUserSession } from '../../utils/__test__/setup'

const mockCreatePresignedUpload = vi.fn()
const mockPublicUrlForKey = vi.fn()
const mockIsChatImageMimeType = vi.fn((v: string) =>
  ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'].includes(v)
)
const mockExtensionForMime = vi.fn(() => '.jpg')

vi.mock('../../utils/r2', () => ({
  createPresignedUpload: mockCreatePresignedUpload,
  publicUrlForKey: mockPublicUrlForKey,
  isChatImageMimeType: mockIsChatImageMimeType,
  extensionForMime: mockExtensionForMime,
  MAX_CHAT_IMAGE_BYTES: 5 * 1024 * 1024
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockCreatePresignedUpload.mockResolvedValue('https://r2.example/presigned-put')
  mockPublicUrlForKey.mockImplementation((key: string) => `https://img.qibmz.com/${key}`)
  mockIsChatImageMimeType.mockImplementation((v: string) =>
    ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'].includes(v)
  )
  mockExtensionForMime.mockReturnValue('.jpg')
})

describe('POST /api/uploads/presign', () => {
  it('should return uploadUrl, publicUrl and key for valid image type', async () => {
    mockReadValidatedBody.mockImplementationOnce(
      async (_event: unknown, validateFn?: (b: unknown) => unknown) => {
        const body = { contentType: 'image/jpeg', contentLength: 1024, filename: 'photo.jpg' }
        return typeof validateFn === 'function' ? validateFn(body) : body
      }
    )

    const { default: handler } = await import('../uploads/presign.post')
    const result = await handler({ context: {}, path: '/api/uploads/presign' } as any)

    expect(result).toMatchObject({
      uploadUrl: 'https://r2.example/presigned-put',
      filename: 'photo.jpg',
      contentLength: 1024
    })
    expect(result.publicUrl).toMatch(/^https:\/\/img\.qibmz\.com\/chat\/test-user-1\//)
    expect(result.key).toMatch(/^chat\/test-user-1\/.+\.jpg$/)
    expect(mockCreatePresignedUpload).toHaveBeenCalledWith({
      key: result.key,
      contentType: 'image/jpeg',
      contentLength: 1024
    })
  })

  it('should reject contentLength over 5MB', async () => {
    mockReadValidatedBody.mockImplementationOnce(
      async (_event: unknown, validateFn?: (b: unknown) => unknown) => {
        const body = { contentType: 'image/jpeg', contentLength: 6 * 1024 * 1024 }
        return typeof validateFn === 'function' ? validateFn(body) : body
      }
    )

    const { default: handler } = await import('../uploads/presign.post')

    await expect(handler({ context: {}, path: '/api/uploads/presign' } as any)).rejects.toThrow()
    expect(mockCreatePresignedUpload).not.toHaveBeenCalled()
  })

  it('should reject unsupported mime types', async () => {
    mockReadValidatedBody.mockImplementationOnce(
      async (_event: unknown, validateFn?: (b: unknown) => unknown) => {
        const body = { contentType: 'application/pdf', contentLength: 100 }
        return typeof validateFn === 'function' ? validateFn(body) : body
      }
    )

    const { default: handler } = await import('../uploads/presign.post')

    await expect(handler({ context: {}, path: '/api/uploads/presign' } as any)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: '不支持的图片类型'
    })
    expect(mockCreatePresignedUpload).not.toHaveBeenCalled()
  })

  it('should require authentication', async () => {
    const { createError } = await import('h3')
    vi.stubGlobal('requireUserSession', () => {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    })

    const { default: handler } = await import('../uploads/presign.post')

    await expect(handler({ context: {}, path: '/api/uploads/presign' } as any)).rejects.toMatchObject({
      statusCode: 401
    })

    vi.stubGlobal('requireUserSession', mockRequireUserSession)
  })
})
