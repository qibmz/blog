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

    expect(source).toContain('min-h-[calc(560px+var(--ui-header-height))]')
    expect(source).toContain('md:min-h-[calc(600px+var(--ui-header-height))]')
    expect(source).toContain('to="#recent-articles"')
    expect(source).toContain('.slice(0, 5)')
    expect(heroEnd).toBeGreaterThan(-1)
    expect(recent).toBeGreaterThan(heroEnd)
    expect(topics).toBeGreaterThan(recent)
    expect(stack).toBeGreaterThan(topics)
  })

  it('keeps a compact whoami card without fake RSS or CountUp widgets', () => {
    const source = readProjectFile('app/pages/index.vue')

    expect(source).toContain('$ whoami')
    expect(source).toContain('data-home-profile')
    expect(source).not.toContain('const highlights =')
    expect(source).not.toContain('<CountUp')
    expect(source).not.toContain('i-lucide-rss')
    expect(source).not.toContain('技术专长')
  })

  it('keeps the profile card above the hero without clipping it', () => {
    const source = readProjectFile('app/pages/index.vue')
    const afterHero = source.slice(source.indexOf('</UPageHero>'))
    const profileStart = afterHero.indexOf('data-home-profile')
    const profileMarkup = afterHero.slice(profileStart, profileStart + 280)

    expect(source).toContain('data-home-hero')
    expect(source).toContain('data-home-profile')
    expect(source).toContain('relative isolate z-0')
    expect(afterHero).toContain('<div class="relative z-10">')
    expect(profileMarkup).toContain('relative z-20 -mt-12 md:-mt-16')
    expect(profileMarkup).not.toContain('overflow-hidden')
  })

  it('renders the featured article label as an inline badge instead of a corner ribbon', () => {
    const source = readProjectFile('app/pages/index.vue')

    expect(source).toContain('精选')
    expect(source).toContain('i-lucide-sparkles')
    expect(source).not.toContain('-rotate-45')
    expect(source).not.toContain('i-lucide-pin')
  })

  it('uses richer scroll reveals than a plain fade-up', () => {
    const reveal = readProjectFile('app/components/ScrollReveal.vue')
    const homepage = readProjectFile('app/pages/index.vue')

    expect(reveal).toContain('filter: \'blur(')
    expect(reveal).toContain('scale:')
    expect(reveal).toContain('usePreferredReducedMotion()')
    expect(reveal).toContain('inViewOptions')
    expect(reveal).toContain('margin: \'-80px\'')
    expect(homepage).toContain('<ScrollReveal')
    expect(homepage).not.toContain(':while-in-view="{ opacity: 1, y: 0 }"')
  })

  it('uses the approved content-first introduction', () => {
    const content = readProjectFile('content/0.index.yml')

    expect(content).toContain(
      'description: UniApp、Nuxt、Vue 开发踩坑与报错修复笔记，按具体错误和库名可检索。'
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
    const reveal = readProjectFile('app/components/ScrollReveal.vue')

    expect(homepage).toContain('motion-reduce:animate-none')
    expect(typewriter).toContain('usePreferredReducedMotion()')
    expect(typewriter).toContain('preferredMotion.value === \'reduce\'')
    expect(typewriter).toContain('motion-reduce:animate-none')
    expect(reveal).toContain('usePreferredReducedMotion()')
    expect(reveal).toContain('reduceMotion.value')
  })

  it('preloads matching light and dark hero media using separate video elements', () => {
    const source = readProjectFile('app/pages/index.vue')

    expect(source).toContain('video: \'/video/hero-bg-light.mp4\'')
    expect(source).toContain('poster: \'/video/hero-bg-light-poster.webp\'')
    expect(source).toContain('posterSm: \'/video/hero-bg-light-poster-sm.webp\'')
    expect(source).toContain('video: \'/video/hero-bg-dark.mp4\'')
    expect(source).toContain('poster: \'/video/hero-bg-dark-poster.webp\'')
    expect(source).toContain('posterSm: \'/video/hero-bg-dark-poster-sm.webp\'')
    expect(source.match(/<video/g)).toHaveLength(2)
    expect(source).toContain('v-if="currentHeroTheme === \'light\' && !videoReadyLight"')
    expect(source).toContain('v-if="currentHeroTheme === \'dark\' && !videoReadyDark"')
    expect(source).not.toContain('v-show="currentHeroTheme === \'light\' && !videoReadyLight"')
    expect(source).not.toContain('v-show="currentHeroTheme === \'dark\' && !videoReadyDark"')
    expect(source).toContain('videoRefLight')
    expect(source).toContain('videoRefDark')
    expect(source).toContain('ensureHeroVideoLoaded')
    expect(source).toContain('requestIdleCallback')
    expect(source).toContain('watch(currentHeroTheme')
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

  it('renders footer with light-mode background', () => {
    const footer = readProjectFile('app/components/AppFooter.vue')

    expect(footer).toContain('bg-slate-50')
    expect(footer).toContain('dark:bg-slate-950')
    expect(footer).toContain('Built with qibmz')
    expect(footer).not.toContain('qbimz')
    // only allow dark override, forbid a plain (light-mode) bg-slate-950 class
    expect(footer).not.toContain(' bg-slate-950')
  })
})
