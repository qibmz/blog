import { describe, expect, it } from 'vitest'
import { modelShowsWebSearch } from '../modelCapability'

describe('modelShowsWebSearch', () => {
  it('honors explicit supportsWebSearch false even for MiMo ids', () => {
    expect(modelShowsWebSearch({ supportsWebSearch: false }, 'mimo-v2.5-pro')).toBe(false)
  })

  it('honors explicit supportsWebSearch true', () => {
    expect(modelShowsWebSearch({ supportsWebSearch: true }, 'deepseek-v4-pro')).toBe(true)
  })

  it('falls back to MiMo chat ids when model metadata is missing', () => {
    expect(modelShowsWebSearch(undefined, 'mimo-v2.5-pro')).toBe(true)
    expect(modelShowsWebSearch(null, 'mimo-v2.5')).toBe(true)
    expect(modelShowsWebSearch(undefined, 'deepseek-v4-pro')).toBe(false)
  })
})
