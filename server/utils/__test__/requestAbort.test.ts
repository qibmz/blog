import { describe, it, expect } from 'vitest'
import { EventEmitter } from 'node:events'
import { getRequestAbortSignal } from '../requestAbort'

function createNodeEvent() {
  const req = new EventEmitter() as EventEmitter & { aborted?: boolean }
  const res = new EventEmitter() as EventEmitter & { writableEnded: boolean }
  res.writableEnded = false
  return {
    req,
    res,
    event: { node: { req, res } } as any
  }
}

describe('getRequestAbortSignal', () => {
  it('returns web request signal when available', () => {
    const controller = new AbortController()
    const event = {
      web: { request: { signal: controller.signal } }
    } as any

    expect(getRequestAbortSignal(event)).toBe(controller.signal)
  })

  it('aborts when response closes before writableEnded', () => {
    const { res, event } = createNodeEvent()
    const signal = getRequestAbortSignal(event)

    expect(signal.aborted).toBe(false)
    res.emit('close')
    expect(signal.aborted).toBe(true)
  })

  it('does not abort when response closed after writableEnded', () => {
    const { res, event } = createNodeEvent()
    const signal = getRequestAbortSignal(event)

    res.writableEnded = true
    res.emit('close')
    expect(signal.aborted).toBe(false)
  })

  it('aborts immediately when request already aborted', () => {
    const { req, event } = createNodeEvent()
    req.aborted = true

    const signal = getRequestAbortSignal(event)
    expect(signal.aborted).toBe(true)
  })

  it('aborts on request aborted event', () => {
    const { req, event } = createNodeEvent()
    const signal = getRequestAbortSignal(event)

    req.emit('aborted')
    expect(signal.aborted).toBe(true)
  })

  it('returns a non-aborted signal when node/web are missing', () => {
    const signal = getRequestAbortSignal({} as any)
    expect(signal.aborted).toBe(false)
  })
})
