import { describe, expect, it } from 'vitest'
import { resolveCapabilityOption } from '../modelCapability'

describe('resolveCapabilityOption', () => {
  it('preserves preference when model metadata is not loaded yet', () => {
    expect(resolveCapabilityOption(true, undefined, false)).toBe(true)
    expect(resolveCapabilityOption(false, undefined, false)).toBe(false)
  })

  it('forces false when model is known not to support the capability', () => {
    expect(resolveCapabilityOption(true, false, true)).toBe(false)
    expect(resolveCapabilityOption(true, undefined, true)).toBe(false)
  })

  it('passes preference through when model supports the capability', () => {
    expect(resolveCapabilityOption(true, true, true)).toBe(true)
    expect(resolveCapabilityOption(false, true, true)).toBe(false)
  })
})
