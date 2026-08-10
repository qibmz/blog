import { describe, expect, it } from 'vitest'
import {
  draftsToConfig,
  getByPath,
  layerToDraft,
  moveLayer,
  parsePosterConfig,
  resolveTextContent,
  tryParsePosterConfig
} from '../poster'

describe('poster utils', () => {
  it('round-trips text and image drafts', () => {
    const config = draftsToConfig(
      [
        {
          id: 'text_1',
          type: 'text',
          x: 10,
          y: 20,
          width: 40,
          height: 12,
          opacity: 1,
          rotation: 0,
          content: '春季上新',
          field: 'product.title',
          fontSize: 4.5,
          fontFamily: 'system-ui, sans-serif',
          fontWeight: '700',
          color: '#111827',
          textAlign: 'center',
          lineHeight: 1.3,
          src: '',
          objectFit: 'contain'
        },
        {
          id: 'image_1',
          type: 'image',
          x: 20,
          y: 40,
          width: 60,
          height: 30,
          opacity: 0.9,
          rotation: 0,
          content: '',
          field: '',
          fontSize: 4,
          fontFamily: 'system-ui, sans-serif',
          fontWeight: '600',
          color: '#111827',
          textAlign: 'left',
          lineHeight: 1.3,
          src: 'https://example.com/product.png',
          objectFit: 'cover'
        }
      ],
      {
        bgImage: 'https://example.com/poster-bg.jpg',
        bgColor: '#fff7ed',
        width: 1080,
        height: 1920
      }
    )

    expect(config.layers[0]).toMatchObject({
      type: 'text',
      x: '10%',
      y: '20%',
      width: '40%',
      height: '12%',
      fontSize: '4.5%',
      content: '春季上新',
      field: 'product.title',
      textAlign: 'center'
    })
    expect(config.layers[0]).not.toHaveProperty('opacity')
    expect(config.layers[1]).toMatchObject({
      type: 'image',
      src: 'https://example.com/product.png',
      objectFit: 'cover',
      opacity: 0.9
    })

    const again = layerToDraft(config.layers[0]!)
    expect(again.fontSize).toBe(4.5)
    expect(again.textAlign).toBe('center')
    expect(again.field).toBe('product.title')
    expect(parsePosterConfig(config).height).toBe(1920)
  })

  it('resolves text from api field with fallback', () => {
    expect(getByPath({ product: { title: '礼包' } }, 'product.title')).toBe('礼包')
    expect(resolveTextContent(
      { content: '兜底', field: 'nickname' },
      { nickname: 'Master' }
    )).toBe('Master')
    expect(resolveTextContent(
      { content: '兜底', field: 'missing' },
      { nickname: 'Master' }
    )).toBe('兜底')
    expect(resolveTextContent({ content: '静态', field: '' }, { nickname: 'x' })).toBe('静态')
  })

  it('moves layers up/down for z-order', () => {
    const drafts = [
      { id: 'a' },
      { id: 'b' },
      { id: 'c' }
    ] as Parameters<typeof moveLayer>[0]

    expect(moveLayer(drafts, 'a', 'up').map(d => d.id)).toEqual(['b', 'a', 'c'])
    expect(moveLayer(drafts, 'c', 'down').map(d => d.id)).toEqual(['a', 'c', 'b'])
    expect(moveLayer(drafts, 'a', 'down').map(d => d.id)).toEqual(['a', 'b', 'c'])
  })

  it('rejects invalid import json', () => {
    const bad = tryParsePosterConfig('{ "bgImage": 1 }')
    expect(bad.ok).toBe(false)
  })
})
