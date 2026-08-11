import { describe, expect, it } from 'vitest'
import type { PosterConfig } from '#shared/types/poster'
import { renderPosterToCanvas } from '../posterCanvas'

const baseConfig: PosterConfig = {
  bgImage: '',
  bgColor: '#ffffff',
  width: 100,
  height: 200,
  layers: []
}

describe('renderPosterToCanvas', () => {
  it('throws AbortError when signal is already aborted', async () => {
    const canvas = {
      width: 0,
      height: 0,
      style: {} as CSSStyleDeclaration,
      getContext: () => null
    } as unknown as HTMLCanvasElement

    const controller = new AbortController()
    controller.abort()

    await expect(
      renderPosterToCanvas(canvas, baseConfig, 100, null, controller.signal)
    ).rejects.toMatchObject({ name: 'AbortError' })
  })
})
