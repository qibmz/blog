# Copilot / AI Agent Instructions for this repo

- Purpose: Help an AI agent be productive quickly in this Nuxt 4 + @nuxt/content site.

## Quick start ✅
- Use pnpm (package manager specified in `package.json`).
  - Install: `pnpm install` (postinstall runs `nuxt prepare`).
  - Dev: `pnpm dev` (runs `nuxt dev --host`).
  - Build: `pnpm build` (runs `nuxt build`).
  - Preview: `pnpm preview` (runs `nuxt preview`).
  - Lint: `pnpm lint` (eslint with auto-fix).  Type check: `pnpm typecheck` (vue-tsc / nuxt typecheck).

## Big picture / architecture 🧭
- Nuxt 4 app using: `@nuxt/content` (content-driven pages), `@nuxt/ui` (U-prefixed UI components), `nuxt-og-image` (OG image components), plus `@vueuse/nuxt` helpers.
- Content directories are the single source of truth for pages: see `content/`.
  - `1.docs/**` -> docs pages
  - `3.blog/**` -> blog posts
  - `0.index.yml`, `2.aboutUs.yml` -> index / about pages
- Pages query content via helpers like `queryCollection('docs')`, `queryCollection('posts')` in page components (example: `app/pages/docs/[...slug].vue`).
- UI uses `U*` components (from `@nuxt/ui`) across pages, e.g., `UPage`, `UPageHeader`, `UPageBody`, `UContentSurround`, `UContentToc`.
- OG images: pages call `defineOgImageComponent('Saas')` and the component is `app/components/OgImage/OgImageSaas.vue`.

## Project-specific conventions & patterns 🔧
- Content schemas are enforced in `content.config.ts` (Zod). Always consult this file before adding new content fields or collections.
  - Example: `posts` collection requires `date`, `image.src`, `authors[]` (see `content.config.ts`).
- Collection lookups usually use `useAsyncData()` with the route path as cache key; pattern: `useAsyncData(route.path, () => queryCollection('docs').path(route.path).first())` (see `app/pages/docs/[...slug].vue`).
- Search/navigation helpers: `queryCollectionNavigation('docs')` and `queryCollectionSearchSections('docs')` are used to build sidebars / search indices (used in `app/app.vue` and `app/layouts/docs.vue`).
- Route rules and prerendering are set in `nuxt.config.ts` (`routeRules` and `nitro.prerender`). Note: `/docs` redirects to `/docs/getting-started`.
- UI component naming: components follow `U*` prefix (UI primitives) and `Content*` naming for content adapters (e.g., `ContentRenderer`). Prefer reusing these patterns.
- SEO & OG: pages use `useSeoMeta()` and `defineOgImageComponent()` to set meta and OG rendering.

## Files to check before editing or adding features 🔍
- `content.config.ts` — required schema and collection sources (Zod). Breaking these will cause runtime or build errors for content pages.
- `app/pages/*` and `app/layouts/*` — show how pages query content and use components.
- `app/components/*` — reusable UI and content components, e.g., `OgImage/`, `content/` folder for content-specific components.
- `nuxt.config.ts` — build/runtime options, prerender, route rules, and ESLint config.

## Debugging and common pitfalls ⚠️
- Missing or invalid frontmatter fields (title/description/date) will fail Zod validation; fix content or update `content.config.ts` if intentional.
- Dynamic content pages use `.path(route.path)`, so double-check the route path when creating new files (file paths map to route paths under `/docs` and `/blog`).
- Pre-rendering: some dynamic routes may not be pre-rendered — verify Nitro prerender settings and set explicit routes if needed.
- ESLint / TypeScript: run `pnpm lint` and `pnpm typecheck` locally during changes.

## Examples (copy/paste) 📎
- Fetch page in a docs page:

```ts
const { data: page } = await useAsyncData(route.path, () =>
  queryCollection('docs').path(route.path).first()
)
if (!page.value) throw createError({ statusCode: 404 })
```

- Add an OG image component reference in a page:

```ts
useSeoMeta({ title, description })
defineOgImageComponent('Saas')
```

- Add a new docs file: `content/1.docs/your-topic/1.index.md` and include frontmatter fields required by `content.config.ts` (e.g., `title`, `description`).

---

If anything here looks incomplete or you want more depth (e.g., where helpers like `queryCollection*` are implemented), tell me which area to expand and I'll update this doc.  
