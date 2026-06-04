# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick start

- Package manager: `pnpm` (lockfile `pnpm-lock.yaml`)
- Install: `pnpm install` (postinstall runs `nuxt prepare`)
- Dev: `pnpm dev` (`nuxt dev --host`)
- Build: `pnpm build` / Preview: `pnpm preview`
- Lint: `pnpm lint` (eslint --fix) / Type check: `pnpm typecheck`
- DB migrations: `npx drizzle-kit generate` then `npx drizzle-kit push`

## Architecture

Nuxt 4 app with content-driven pages + AI chat feature, deployed on Vercel with Neon PostgreSQL.

### Content system

Content lives in `content/` and is the source of truth for docs, blog, and landing pages:
- `0.index.yml` → `/` landing page
- `1.docs/**/*` → `/docs/**` pages (collection `docs`)
- `2.about-us.yml` → `/about-us`
- `3.blog.yml` → `/blog` listing
- `3.blog/**/*` → `/blog/**` posts (collection `posts`)

Schemas are defined in `content.config.ts` (Zod). Pages query content via `queryCollection()`, `queryCollectionNavigation()`, `queryCollectionSearchSections()` — see `app/app.vue` for the shared search/nav data pipeline.

UI uses `@nuxt/ui` U-prefixed components (`UApp`, `UPage`, `UContentSearch`, etc.).

### AI Chat (`/chat/**`)

SSR is disabled for chat routes (`nuxt.config.ts` routeRules: `'/chat/**': { ssr: false }`).

**Auth flow:** GitHub OAuth via `nuxt-auth-utils`. Route: `server/routes/auth/github.get.ts` → sets user session → redirects to `/chat`. Session encrypted with `NUXT_SESSION_PASSWORD` env var. User type augmented in `server/types/auth.d.ts`.

**Database:** Neon PostgreSQL (serverless) + Drizzle ORM.
- Schema: `server/db/schema.ts` — `chats` and `messages` tables, one-to-many relation
- DB singleton: `server/db/index.ts` — lazy-init Proxy, auto-imported via `nitro.imports.dirs: ['server/db']`
- `db` and `schema` are auto-imported in all `server/` files, no explicit import needed
- Config: `drizzle.config.ts` (uses `DATABASE_URL` env var)

**API endpoints** (all require auth via `requireUserSession(event)`):
| Endpoint | File | Purpose |
|----------|------|---------|
| `GET /api/chats` | `server/api/chats.get.ts` | List user's chats + remaining daily quota |
| `POST /api/chats` | `server/api/chats.post.ts` | Create chat with first message |
| `GET /api/chats/:id` | `server/api/chats/[id].get.ts` | Get single chat with messages |
| `POST /api/chats/:id` | `server/api/chats/[id].post.ts` | Send message, stream AI reply, save to DB |
| `GET /api/models` | `server/api/models.get.ts` | Available AI models (cached 5 min) |

**AI providers:** DeepSeek and MiMo (Xiaomi), configured in `server/utils/models.ts`. Uses `@ai-sdk/deepseek` and `@ai-sdk/openai-compatible`. API keys: `DEEPSEEK_API_KEY`, `MIMO_API_KEY`.

**Rate limiting:** 5 questions/day per user, enforced in `server/utils/rateLimiter.ts`. Checked on chat creation and each follow-up message. **Note:** check-then-insert is not transactional — concurrent requests may exceed the limit.

**Error handling:** `server/utils/errors.ts` provides `raiseNotFound()` / `raiseRateLimit()`. Global error pipeline in `server/plugins/error-handler.ts` logs all errors and sanitizes 5xx responses (replaces internal errors with generic message for non-`createError` throws).

**Client components:**
- `app/layouts/chat.vue` — sidebar layout with chat history navigation
- `app/pages/chat/index.vue` — new chat page with prompt input + model selector
- `app/pages/chat/[id].vue` — chat detail with `@ai-sdk/vue` Chat, streaming, markdown rendering
- `app/components/chat/ChatMarkdown.vue` — renders AI replies via `@nuxtjs/mdc` + Shiki, with debounced streaming
- `app/components/chat/ChatSearch.vue` — command palette modal to search past chats

### Page conventions

- Use `useSeoMeta()` for per-page SEO, `defineOgImageComponent('Saas')` for OG images
- `useAsyncData()` with `default: () => []` pattern for safe fallback when content query fails
- `definePageMeta({ layout: 'chat' })` for chat pages to use the chat layout
- View Transitions enabled via `experimental.viewTransition: true` (replaces old pageTransition/layoutTransition)

## Key files

| File | Purpose |
|------|---------|
| `nuxt.config.ts` | Modules, runtimeConfig, routeRules, nitro config |
| `content.config.ts` | Content collection schemas (Zod) — breaking changes here break content pages |
| `server/db/schema.ts` | Database tables — run `drizzle-kit generate` after changes |
| `server/utils/models.ts` | AI model registry — add new providers/models here |
| `app/app.vue` | Root component — global nav data, search, SEO defaults |
| `app/error.vue` | Error page (same nav data pipeline as app.vue) |
