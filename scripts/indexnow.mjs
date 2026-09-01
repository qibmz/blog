#!/usr/bin/env node
/**
 * 根据 git diff 把变更内容映射成公开 URL，提交到 IndexNow。
 * 用法：node scripts/indexnow.mjs [--base HEAD^] [--head HEAD] [--dry-run]
 */
import { execFileSync } from 'node:child_process'
import { parseArgs } from 'node:util'

const HOST = 'blog.qibmz.com'
const SITE = `https://${HOST}`
const KEY = '3f0a252b63eb49cf800c230d2a89c047'
const ENDPOINT = 'https://api.indexnow.org/indexnow'

const { values } = parseArgs({
  options: {
    'base': { type: 'string', default: 'HEAD^' },
    'head': { type: 'string', default: 'HEAD' },
    'dry-run': { type: 'boolean', default: false }
  }
})

function gitDiffNames(base, head) {
  try {
    const out = execFileSync('git', ['diff', '--name-only', `${base}...${head}`], {
      encoding: 'utf8'
    })
    return out.split('\n').map(s => s.trim()).filter(Boolean)
  } catch {
    // 首次提交或无父节点时回退到单 commit diff
    const out = execFileSync('git', ['diff', '--name-only', `${head}^`, head], {
      encoding: 'utf8'
    })
    return out.split('\n').map(s => s.trim()).filter(Boolean)
  }
}

/** Nuxt Content：去掉分段前的数字前缀，如 3.blog / 17.slug */
function stripContentPrefixes(relPath) {
  return relPath
    .replace(/\.(md|yml|yaml)$/i, '')
    .split('/')
    .map(seg => seg.replace(/^\d+\./, ''))
    .filter(Boolean)
}

function fileToUrls(file) {
  if (file.startsWith('content/')) {
    const parts = stripContentPrefixes(file.slice('content/'.length))
    if (parts.at(-1) === 'index') parts.pop()
    const path = parts.length ? `/${parts.join('/')}` : '/'
    return [path]
  }

  // 公开页面（排除 chat）
  const page = file.match(/^app\/pages\/(?!chat\/)(.+)\.vue$/)
  if (page) {
    let route = page[1]
      .replace(/\/index$/, '')
      .replace(/\[\.\.\..+\]$/, '')
      .replace(/\[.+\]/g, '')
    route = route.replace(/\/+/g, '/').replace(/\/$/, '')
    if (!route || route.includes('[')) return []
    return [`/${route}`]
  }

  return []
}

function unique(urls) {
  return [...new Set(urls)]
}

const files = gitDiffNames(values.base, values.head)
const urls = unique(
  files.flatMap(fileToUrls).map(path => `${SITE}${path === '/' ? '/' : path}`)
)

const keyFileTouched = files.some(f => f === `public/${KEY}.txt`)
if (!urls.length && keyFileTouched) {
  urls.push(`${SITE}/`, `${SITE}/blog`)
}

if (!urls.length) {
  console.log('IndexNow: 无公开页面变更，跳过提交')
  process.exit(0)
}

const body = {
  host: HOST,
  key: KEY,
  keyLocation: `${SITE}/${KEY}.txt`,
  urlList: urls
}

console.log(`IndexNow: 准备提交 ${urls.length} 个 URL`)
for (const url of urls) console.log(`  - ${url}`)

if (values['dry-run']) {
  console.log('IndexNow: dry-run，未实际请求')
  process.exit(0)
}

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body)
})

const text = await res.text().catch(() => '')
console.log(`IndexNow: HTTP ${res.status}${text ? ` ${text}` : ''}`)

// 200 / 202 都算接受；其它视为失败
if (res.status !== 200 && res.status !== 202) {
  process.exit(1)
}
