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
})
