import { describe, expect, it } from 'vitest'
import { isSafeHotspotActionValue } from '#shared/types/hotspot'
import {
  draftsToConfig,
  hotspotToDraft,
  parseHotspotConfig,
  toPctString,
  tryParseHotspotConfig
} from '../hotspot'

describe('hotspot utils', () => {
  it('formats percent strings', () => {
    expect(toPctString(10.56)).toBe('10.6%')
    expect(toPctString(0)).toBe('0%')
  })

  it('round-trips rect/circle/polygon drafts', () => {
    const config = draftsToConfig(
      [
        {
          id: 'area_1',
          shape: 'rect',
          x: 10.5,
          y: 20.3,
          width: 15.2,
          height: 8.1,
          radius: 0,
          points: [],
          title: '购买按钮',
          action: { type: 'navigate', value: '/product/detail?id=123' }
        },
        {
          id: 'area_2',
          shape: 'circle',
          x: 50,
          y: 50,
          width: 0,
          height: 0,
          radius: 5,
          points: [],
          title: '',
          action: { type: 'popup', value: 'hello' }
        },
        {
          id: 'area_3',
          shape: 'polygon',
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          radius: 0,
          points: [10, 20, 30, 40, 15, 50],
          title: 'poly',
          action: { type: 'download', value: 'https://example.com/a.pdf' }
        }
      ],
      { bgImage: 'https://xxx.com/activity_bg_2026.jpg', width: 1920, height: 1080 }
    )

    expect(config.hotspots[0]).toMatchObject({
      shape: 'rect',
      x: '10.5%',
      y: '20.3%',
      width: '15.2%',
      height: '8.1%'
    })
    expect(config.hotspots[1]).toMatchObject({
      shape: 'circle',
      x: '50%',
      y: '50%',
      radius: '5%'
    })
    expect(config.hotspots[2]?.points).toBe('10%,20%,30%,40%,15%,50%')

    const again = hotspotToDraft(config.hotspots[0]!)
    expect(again.width).toBe(15.2)
    expect(parseHotspotConfig(config).width).toBe(1920)
  })

  it('rejects invalid import json', () => {
    const bad = tryParseHotspotConfig('{ "bgImage": 1 }')
    expect(bad.ok).toBe(false)
  })

  it('rejects unsafe navigate/download schemes on import', () => {
    const bad = tryParseHotspotConfig(JSON.stringify({
      bgImage: 'https://example.com/bg.jpg',
      width: 100,
      height: 100,
      hotspots: [{
        id: 'a1',
        shape: 'rect',
        x: '0%',
        y: '0%',
        width: '10%',
        height: '10%',
        action: { type: 'navigate', value: 'javascript:alert(1)' }
      }]
    }))
    expect(bad.ok).toBe(false)
  })
})

describe('isSafeHotspotActionValue', () => {
  it('allows relative navigate and https download', () => {
    expect(isSafeHotspotActionValue('navigate', '/chat')).toBe(true)
    expect(isSafeHotspotActionValue('navigate', 'https://example.com')).toBe(true)
    expect(isSafeHotspotActionValue('download', 'https://example.com/a.pdf')).toBe(true)
    expect(isSafeHotspotActionValue('popup', 'anything')).toBe(true)
  })

  it('blocks dangerous schemes', () => {
    expect(isSafeHotspotActionValue('navigate', 'javascript:alert(1)')).toBe(false)
    expect(isSafeHotspotActionValue('navigate', '//attacker.example')).toBe(false)
    expect(isSafeHotspotActionValue('download', 'data:text/html,hi')).toBe(false)
    expect(isSafeHotspotActionValue('download', '/relative.pdf')).toBe(false)
  })
})
