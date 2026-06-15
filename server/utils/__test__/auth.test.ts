import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockSendRedirect } from './setup'
import { sendOAuthErrorRedirect } from '../auth'

describe('sendOAuthErrorRedirect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should redirect to /login?error=github_auth_failed for github', () => {
    const event = {} as any
    sendOAuthErrorRedirect(event, 'github')
    expect(mockSendRedirect).toHaveBeenCalledWith(event, '/login?error=github_auth_failed')
  })

  it('should redirect to /login?error=google_auth_failed for google', () => {
    const event = {} as any
    sendOAuthErrorRedirect(event, 'google')
    expect(mockSendRedirect).toHaveBeenCalledWith(event, '/login?error=google_auth_failed')
  })
})
