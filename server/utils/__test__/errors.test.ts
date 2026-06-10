import { describe, it, expect } from 'vitest'
import { raiseNotFound, raiseRateLimit } from '../errors'

describe('raiseNotFound', () => {
  it('should create a 404 error with default message', () => {
    const err = raiseNotFound()
    expect(err.statusCode).toBe(404)
    expect(err.statusMessage).toBe('Not found')
  })

  it('should create a 404 error with custom message', () => {
    const err = raiseNotFound('Chat not found')
    expect(err.statusCode).toBe(404)
    expect(err.statusMessage).toBe('Chat not found')
  })
})

describe('raiseRateLimit', () => {
  it('should create a 429 error', () => {
    const err = raiseRateLimit('每日提问次数已达上限（5 次）')
    expect(err.statusCode).toBe(429)
    expect(err.statusMessage).toBe('每日提问次数已达上限（5 次）')
  })

  it('should create a 429 error with any message', () => {
    const err = raiseRateLimit('Too many requests')
    expect(err.statusCode).toBe(429)
    expect(err.statusMessage).toBe('Too many requests')
  })
})
