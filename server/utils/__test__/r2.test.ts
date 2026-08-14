import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockUseRuntimeConfig = vi.fn()

vi.stubGlobal('useRuntimeConfig', mockUseRuntimeConfig)

describe('assertAllowedChatFileUrls', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mockUseRuntimeConfig.mockReturnValue({
      r2AccountId: 'acc',
      r2AccessKeyId: 'key',
      r2SecretAccessKey: 'secret',
      r2BucketName: 'bucket',
      r2PublicBaseUrl: 'https://img.qibmz.com'
    })
  })

  it('allows R2 public URLs and legacy data URLs', async () => {
    const { assertAllowedChatFileUrls } = await import('../r2')
    expect(() => assertAllowedChatFileUrls([
      { type: 'file', url: 'https://img.qibmz.com/chat/u1/a.jpg', mediaType: 'image/jpeg' },
      { type: 'file', url: 'data:image/png;base64,xxx', mediaType: 'image/png' },
      { type: 'text', text: 'hi' }
    ])).not.toThrow()
  })

  it('rejects arbitrary https URLs', async () => {
    const { assertAllowedChatFileUrls } = await import('../r2')
    try {
      assertAllowedChatFileUrls([
        { type: 'file', url: 'https://evil.example/a.jpg', mediaType: 'image/jpeg' }
      ])
      expect.fail('expected throw')
    } catch (err) {
      expect(err).toMatchObject({
        statusCode: 400,
        statusMessage: '非法图片地址'
      })
    }
  })

  it('rejects blob URLs', async () => {
    const { assertAllowedChatFileUrls } = await import('../r2')
    try {
      assertAllowedChatFileUrls([
        { type: 'file', url: 'blob:https://blog.qibmz.com/abc', mediaType: 'image/jpeg' }
      ])
      expect.fail('expected throw')
    } catch (err) {
      expect(err).toMatchObject({
        statusCode: 400,
        statusMessage: '非法图片地址'
      })
    }
  })
})

describe('isChatImageMimeType', () => {
  it('accepts allowlisted image types', async () => {
    const { isChatImageMimeType } = await import('../r2')
    expect(isChatImageMimeType('image/jpeg')).toBe(true)
    expect(isChatImageMimeType('application/pdf')).toBe(false)
  })
})
