import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import matter from 'gray-matter'
import { describe, it, expect, beforeAll } from 'vitest'

const FILE_PATH = resolve(__dirname, '../../content/3.blog/11.uniapp-root-portal.md')

interface PostFrontmatter {
  title?: unknown
  description?: unknown
  date?: unknown
  image?: { src?: unknown }
  authors?: Array<{ name?: unknown; to?: unknown; avatar?: { src?: unknown } }>
  badge?: { label?: unknown }
}

let raw: string
let frontmatter: PostFrontmatter
let content: string

beforeAll(() => {
  raw = readFileSync(FILE_PATH, 'utf-8')
  const parsed = matter(raw)
  frontmatter = parsed.data as PostFrontmatter
  content = parsed.content
})

describe('11.uniapp-root-portal.md — frontmatter', () => {
  it('has a non-empty title', () => {
    expect(typeof frontmatter.title).toBe('string')
    expect((frontmatter.title as string).trim().length).toBeGreaterThan(0)
  })

  it('title mentions RootPortal as the main topic', () => {
    expect(frontmatter.title as string).toContain('RootPortal')
  })

  it('has a non-empty description', () => {
    expect(typeof frontmatter.description).toBe('string')
    expect((frontmatter.description as string).trim().length).toBeGreaterThan(0)
  })

  it('description mentions RootPortal', () => {
    expect(frontmatter.description as string).toContain('RootPortal')
  })

  it('has a date field', () => {
    expect(frontmatter.date).toBeDefined()
  })

  it('date is a valid ISO date string (YYYY-MM-DD)', () => {
    const dateStr = String(frontmatter.date)
    // gray-matter may parse date strings as Date objects; normalise to string
    const normalised = frontmatter.date instanceof Date
      ? frontmatter.date.toISOString().slice(0, 10)
      : dateStr.slice(0, 10)
    expect(normalised).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('date is 2026-04-22', () => {
    const normalised = frontmatter.date instanceof Date
      ? frontmatter.date.toISOString().slice(0, 10)
      : String(frontmatter.date).slice(0, 10)
    expect(normalised).toBe('2026-04-22')
  })

  it('has an image with a non-empty src', () => {
    expect(frontmatter.image).toBeDefined()
    expect(typeof frontmatter.image?.src).toBe('string')
    expect((frontmatter.image?.src as string).trim().length).toBeGreaterThan(0)
  })

  it('image.src is a valid URL', () => {
    const src = frontmatter.image?.src as string
    expect(() => new URL(src)).not.toThrow()
  })

  it('has a non-empty authors array', () => {
    expect(Array.isArray(frontmatter.authors)).toBe(true)
    expect((frontmatter.authors as unknown[]).length).toBeGreaterThan(0)
  })

  it('first author has a non-empty name', () => {
    const author = frontmatter.authors?.[0]
    expect(typeof author?.name).toBe('string')
    expect((author?.name as string).trim().length).toBeGreaterThan(0)
  })

  it('first author name is qibmz', () => {
    expect(frontmatter.authors?.[0]?.name).toBe('qibmz')
  })

  it('first author has an avatar with a non-empty src', () => {
    const avatar = frontmatter.authors?.[0]?.avatar
    expect(avatar).toBeDefined()
    expect(typeof avatar?.src).toBe('string')
    expect((avatar?.src as string).trim().length).toBeGreaterThan(0)
  })

  it('first author avatar.src points to an image path', () => {
    const src = frontmatter.authors?.[0]?.avatar?.src as string
    // Should be a relative path or URL starting with / or http
    expect(src).toMatch(/^(\/|https?:\/\/)/)
  })

  it('has a badge with a non-empty label', () => {
    expect(frontmatter.badge).toBeDefined()
    expect(typeof frontmatter.badge?.label).toBe('string')
    expect((frontmatter.badge?.label as string).trim().length).toBeGreaterThan(0)
  })

  it('badge label is UniApp', () => {
    expect(frontmatter.badge?.label).toBe('UniApp')
  })

  // Regression: schema requires authors[].to — document this known mismatch
  it('documents that authors[0].to is absent (known schema mismatch)', () => {
    // The posts collection schema in content.config.ts requires `to: z.string().nonempty()`
    // on every author, but this post omits the field. This test records that fact so
    // it becomes visible if the schema is tightened or the field is added later.
    const to = frontmatter.authors?.[0]?.to
    expect(to).toBeUndefined()
  })
})

describe('11.uniapp-root-portal.md — content structure', () => {
  it('has non-empty body content', () => {
    expect(content.trim().length).toBeGreaterThan(0)
  })

  it('contains a problem-reproduction section (H2)', () => {
    expect(content).toContain('## 问题复现')
  })

  it('contains a RootPortal solution section (H2)', () => {
    expect(content).toContain('## 解决方案')
  })

  it('contains a usage section (H2)', () => {
    expect(content).toContain('## 使用方式')
  })

  it('contains a notes/caveats section (H2)', () => {
    expect(content).toContain('## 注意事项')
  })

  it('contains a summary section (H2)', () => {
    expect(content).toContain('## 总结')
  })

  it('contains a references section (H2)', () => {
    expect(content).toContain('## 参考')
  })

  it('contains the RootPortal component implementation code block', () => {
    // Should contain the core Vue SFC template for the component
    expect(content).toContain('components/RootPortal.vue')
  })

  it('contains a Vue code block for the problem reproduction example', () => {
    expect(content).toContain('```vue')
  })

  it('contains a TypeScript/options-API code block', () => {
    expect(content).toContain('```ts')
  })

  it('mentions teleport (H5 implementation)', () => {
    expect(content).toContain('<teleport to="body">')
  })

  it('mentions root-portal (WeChat/Alipay mini-program implementation)', () => {
    expect(content).toContain('<root-portal>')
  })

  it('mentions renderjs (APP implementation)', () => {
    expect(content).toContain('renderjs')
  })

  it('mentions virtualHost option', () => {
    expect(content).toContain('virtualHost')
  })

  it('mentions addGlobalClass option', () => {
    expect(content).toContain('addGlobalClass')
  })

  it('mentions styleIsolation option', () => {
    expect(content).toContain('styleIsolation')
  })

  it('mentions DingTalk mini-program exclusion (MP-DINGTALK)', () => {
    expect(content).toContain('MP-DINGTALK')
  })

  it('contains the platform comparison table', () => {
    // The table header row lists the three platform columns
    expect(content).toContain('| 平台 |')
    expect(content).toContain('| H5 |')
  })

  it('contains the summary table', () => {
    expect(content).toContain('| 场景 |')
  })

  it('references wot-design-uni as the inspiration source', () => {
    expect(content).toContain('wot-design-uni')
  })

  it('has a reference link to the WeChat root-portal documentation', () => {
    expect(content).toContain('developers.weixin.qq.com')
  })

  it('has a reference link to the Vue3 Teleport documentation', () => {
    expect(content).toContain('cn.vuejs.org')
  })

  it('has exactly 3 reference links in the references section', () => {
    const refsSection = content.split('## 参考')[1] ?? ''
    const links = refsSection.match(/\[.+?\]\(https?:\/\/.+?\)/g) ?? []
    expect(links.length).toBe(3)
  })

  it('contains the overflow:hidden problem description', () => {
    expect(content).toContain('overflow: hidden')
  })

  it('mentions beforeDestroy lifecycle hook for cleanup', () => {
    expect(content).toContain('beforeDestroy')
  })

  it('file starts with YAML front-matter delimiter', () => {
    expect(raw.startsWith('---')).toBe(true)
  })
})