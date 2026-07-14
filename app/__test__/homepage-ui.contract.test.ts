import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const readProjectFile = (relativePath: string) =>
  readFileSync(fileURLToPath(new URL(`../../${relativePath}`, import.meta.url)), 'utf8')

describe('homepage UI contracts', () => {
  it('provides a compact ten-item technology stack', () => {
    const source = readProjectFile('app/components/TechStack.vue')

    expect(source).toContain('compact?: boolean')
    expect(source).toContain('const compactTechNames = [')
    expect(source).toContain('\'Vue 3\'')
    expect(source).toContain('\'Nuxt 4\'')
    expect(source).toContain('\'TypeScript\'')
    expect(source).toContain('\'Tailwind CSS\'')
    expect(source).toContain('\'Nuxt UI\'')
    expect(source).toContain('\'UniApp\'')
    expect(source).toContain('\'Vite\'')
    expect(source).toContain('\'Git\'')
    expect(source).toContain('\'Wagmi\'')
    expect(source).toContain('\'Viem\'')
    expect(source).toContain('v-if="!compact"')
  })

  it('places five recent articles directly after a compact hero', () => {
    const source = readProjectFile('app/pages/index.vue')
    const heroEnd = source.indexOf('</UPageHero>')
    const recent = source.indexOf('id="recent-articles"')
    const topics = source.indexOf('id="writing-topics"')
    const stack = source.indexOf('<TechStack compact')

    expect(source).toContain('min-h-[560px]')
    expect(source).toContain('md:min-h-[600px]')
    expect(source).toContain('to="#recent-articles"')
    expect(source).toContain('.slice(0, 5)')
    expect(heroEnd).toBeGreaterThan(-1)
    expect(recent).toBeGreaterThan(heroEnd)
    expect(topics).toBeGreaterThan(recent)
    expect(stack).toBeGreaterThan(topics)
  })

  it('removes portfolio-template sections and the fake RSS action', () => {
    const source = readProjectFile('app/pages/index.vue')

    expect(source).not.toContain('const stats =')
    expect(source).not.toContain('const highlights =')
    expect(source).not.toContain('<CountUp')
    expect(source).not.toContain('i-lucide-rss')
    expect(source).not.toContain('技术专长')
  })

  it('uses the approved content-first introduction', () => {
    const content = readProjectFile('content/0.index.yml')

    expect(content).toContain(
      'description: 记录前端开发、UniApp、Web3 与工程化实践中的问题和解决方案。'
    )
  })

  it('uses a quiet translucent header without a jumping logo shadow', () => {
    const source = readProjectFile('app/components/AppHeader.vue')

    expect(source).toContain('<UHeader')
    expect(source).not.toContain('shadow-md hover:shadow-lg')
  })

  it('stops decorative hero motion when reduced motion is preferred', () => {
    const homepage = readProjectFile('app/pages/index.vue')
    const typewriter = readProjectFile('app/components/TypewriterText.vue')

    expect(homepage).toContain('motion-reduce:animate-none')
    expect(typewriter).toContain('usePreferredReducedMotion()')
    expect(typewriter).toContain('preferredMotion.value === \'reduce\'')
    expect(typewriter).toContain('motion-reduce:animate-none')
  })

  it('loads matching light and dark hero media through one video element', () => {
    const source = readProjectFile('app/pages/index.vue')

    expect(source).toContain('video: \'/video/hero-bg-light.mp4\'')
    expect(source).toContain('poster: \'/video/hero-bg-light-poster.webp\'')
    expect(source).toContain('posterSm: \'/video/hero-bg-light-poster-sm.webp\'')
    expect(source).toContain('video: \'/video/hero-bg-dark.mp4\'')
    expect(source).toContain('poster: \'/video/hero-bg-dark-poster.webp\'')
    expect(source).toContain('posterSm: \'/video/hero-bg-dark-poster-sm.webp\'')
    expect(source.match(/<video/g)).toHaveLength(1)
    expect(source).toContain('watch(currentHeroTheme')
    expect(source).toContain('source.getAttribute(\'src\') !== currentHeroMedia.value.video')
  })

  it('uses the light video without a dark full-screen mask', () => {
    const source = readProjectFile('app/pages/index.vue')

    expect(source).toContain('from-transparent via-transparent to-[#F6F8FB]')
    expect(source).not.toContain('from-slate-950/70 via-slate-900/45')
    expect(source).toContain('text-slate-950 dark:text-white dark:drop-shadow-sm')
    expect(source).toContain('text-slate-700 dark:text-slate-100')
    expect(source).toContain('text-slate-800 hover:bg-white/70 dark:text-white')
  })

  it('extends the hero media behind the header without moving its content upward', () => {
    const source = readProjectFile('app/pages/index.vue')

    expect(source).toContain('-mt-(--ui-header-height)')
    expect(source).toContain('min-h-[calc(560px+var(--ui-header-height))]')
    expect(source).toContain('md:min-h-[calc(600px+var(--ui-header-height))]')
    expect(source).toContain('pt-[calc(var(--ui-header-height)+2.5rem)]')
  })
})
