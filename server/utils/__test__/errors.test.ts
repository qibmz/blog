import { describe, it, expect } from 'vitest'
import { isUniqueViolation, raiseConflict, raiseNotFound, raiseRateLimit } from '../errors'

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

describe('raiseConflict', () => {
  it('should create a 409 error', () => {
    const err = raiseConflict('Chat already exists')
    expect(err.statusCode).toBe(409)
    expect(err.statusMessage).toBe('Chat already exists')
  })

  it('should create a 409 error with default message', () => {
    const err = raiseConflict()
    expect(err.statusCode).toBe(409)
    expect(err.statusMessage).toBe('Conflict')
  })
})

describe('isUniqueViolation', () => {
  it('detects postgres unique_violation code', () => {
    expect(isUniqueViolation({ code: '23505' })).toBe(true)
    expect(isUniqueViolation({ code: '23503' })).toBe(false)
    expect(isUniqueViolation(null)).toBe(false)
    expect(isUniqueViolation('boom')).toBe(false)
  })
})
