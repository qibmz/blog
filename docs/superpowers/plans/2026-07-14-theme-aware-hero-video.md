# Theme-aware Hero Video Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the homepage Hero use matching light and dark videos and WebP posters without downloading both videos.

**Architecture:** Keep one video element and expose a computed `currentHeroMedia` record from Nuxt Color Mode. The active poster updates reactively; the active video is loaded lazily and reloaded only when the resolved theme changes. A source-path guard prevents an old `loadeddata` event from revealing the wrong theme.

**Tech Stack:** Nuxt 4, Vue 3 Composition API, Nuxt Color Mode, Vitest source contracts, Playwright/Chromium frame capture, Sharp WebP encoding.

## Global Constraints

- Asset names are `hero-bg-light.*` and `hero-bg-dark.*`.
- Desktop posters are exactly 1280×720; mobile posters are exactly 640×360.
- Only one `<video>` is rendered and only the current theme video is loaded.
- Reduced-motion mode loads no video and shows the active theme poster.
- Hero copy, layout, dimensions, and article sections remain unchanged.

---

### Task 1: Normalize assets and create the light posters

**Files:**
- Rename: `public/video/hero-bg.mp4` → `public/video/hero-bg-dark.mp4`
- Rename: `public/video/hero-bg-poster.webp` → `public/video/hero-bg-dark-poster.webp`
- Rename: `public/video/hero-bg-poster-sm.webp` → `public/video/hero-bg-dark-poster-sm.webp`
- Rename: `public/video/这个是我博客的hero页的视频_是dark版本的_我想要一个.mp4` → `public/video/hero-bg-light.mp4`
- Create: `public/video/hero-bg-light-poster.webp`
- Create: `public/video/hero-bg-light-poster-sm.webp`

**Interfaces:**
- Produces: six static assets addressed by `/video/hero-bg-{light|dark}{-poster|-poster-sm}.(mp4|webp)`.

- [ ] **Step 1: Rename the MP4 and existing dark posters**

Use filesystem renames so binary data is not rewritten:

```bash
mv public/video/hero-bg.mp4 public/video/hero-bg-dark.mp4
mv public/video/hero-bg-poster.webp public/video/hero-bg-dark-poster.webp
mv public/video/hero-bg-poster-sm.webp public/video/hero-bg-dark-poster-sm.webp
mv 'public/video/这个是我博客的hero页的视频_是dark版本的_我想要一个.mp4' public/video/hero-bg-light.mp4
```

- [ ] **Step 2: Capture a stable light-video frame**

Serve `public/` locally, load `hero-bg-light.mp4` in Chromium, seek to 0.3 seconds, and screenshot the video element to `/tmp/hero-bg-light-frame.png` at 1280×720. Confirm the capture is a real video frame with no controls or blank canvas.

- [ ] **Step 3: Encode desktop and mobile WebP posters**

```js
const sharp = require('sharp')

await sharp('/tmp/hero-bg-light-frame.png')
  .resize(1280, 720, { fit: 'cover' })
  .webp({ quality: 84 })
  .toFile('public/video/hero-bg-light-poster.webp')

await sharp('/tmp/hero-bg-light-frame.png')
  .resize(640, 360, { fit: 'cover' })
  .webp({ quality: 82 })
  .toFile('public/video/hero-bg-light-poster-sm.webp')
```

- [ ] **Step 4: Verify the asset set and dimensions**

Run:

```bash
rg --files public/video | sort
node -e "const sharp=require('sharp'); Promise.all(process.argv.slice(1).map(async p=>[p,await sharp(p).metadata()])).then(console.log)" public/video/*poster*.webp
```

Expected: six theme media files; desktop posters report 1280×720 and mobile posters report 640×360.

---

### Task 2: Add theme-aware media selection with TDD

**Files:**
- Modify: `app/__test__/homepage-ui.contract.test.ts`
- Modify: `app/pages/index.vue`

**Interfaces:**
- Produces: `heroMedia.light`, `heroMedia.dark`, and computed `currentHeroMedia` with `{ video, poster, posterSm }`.
- Consumes: Nuxt `useColorMode()` resolved value and the six assets from Task 1.

- [ ] **Step 1: Write the failing theme-media contract test**

Add a focused test:

```ts
it('loads matching light and dark hero media through one video element', () => {
  const source = readProjectFile('app/pages/index.vue')

  expect(source).toContain("video: '/video/hero-bg-light.mp4'")
  expect(source).toContain("poster: '/video/hero-bg-light-poster.webp'")
  expect(source).toContain("posterSm: '/video/hero-bg-light-poster-sm.webp'")
  expect(source).toContain("video: '/video/hero-bg-dark.mp4'")
  expect(source).toContain("poster: '/video/hero-bg-dark-poster.webp'")
  expect(source).toContain("posterSm: '/video/hero-bg-dark-poster-sm.webp'")
  expect(source.match(/<video/g)).toHaveLength(1)
  expect(source).toContain('watch(currentHeroTheme')
  expect(source).toContain("source.getAttribute('src') !== currentHeroMedia.value.video")
})
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
pnpm vitest run app/__test__/homepage-ui.contract.test.ts
```

Expected: FAIL because the theme records and source guard do not exist.

- [ ] **Step 3: Implement the minimal theme-media state**

Add:

```ts
const colorMode = useColorMode()
const heroMedia = {
  light: {
    video: '/video/hero-bg-light.mp4',
    poster: '/video/hero-bg-light-poster.webp',
    posterSm: '/video/hero-bg-light-poster-sm.webp'
  },
  dark: {
    video: '/video/hero-bg-dark.mp4',
    poster: '/video/hero-bg-dark-poster.webp',
    posterSm: '/video/hero-bg-dark-poster-sm.webp'
  }
} as const

const currentHeroTheme = computed(() => colorMode.value === 'dark' ? 'dark' : 'light')
const currentHeroMedia = computed(() => heroMedia[currentHeroTheme.value])
const reduceMotion = ref(false)
```

Update the loader so it assigns only `currentHeroMedia.value.video`, does nothing when the same source is already loading, and keeps the existing idle scheduling. Watch `currentHeroTheme` to hide the old video and load the new source when reduced motion is off.

- [ ] **Step 4: Guard stale load events and bind the active poster**

Before setting `videoReady` in `onVideoReady`, require:

```ts
const source = videoRef.value?.querySelector('source')
if (source?.getAttribute('src') !== currentHeroMedia.value.video) return
```

Bind the image:

```vue
<img
  v-if="!videoReady"
  :src="currentHeroMedia.poster"
  :srcset="`${currentHeroMedia.posterSm} 640w, ${currentHeroMedia.poster} 1280w`"
  ...
>
```

- [ ] **Step 5: Run focused tests and type checking**

Run:

```bash
pnpm vitest run app/__test__/homepage-ui.contract.test.ts
pnpm typecheck
```

Expected: all homepage contracts pass and Nuxt type checking exits 0.

---

### Task 3: Verify theme switching and finish

**Files:**
- Verify: `app/pages/index.vue`
- Verify: `public/video/`

**Interfaces:**
- Consumes: finished theme-aware Hero.

- [ ] **Step 1: Run production preview and inspect both themes**

Capture light and dark desktop/mobile screenshots after `loadeddata`. Evaluate the active `<source src>` and `<img src>` before and after pressing the theme toggle. Expected: each theme reports only its own asset paths; viewport widths have no overflow.

- [ ] **Step 2: Verify reduced motion**

Open the page with `reducedMotion: 'reduce'`. Expected: `<source>` has no `src`, the theme-specific poster is visible, and switching theme changes only the poster.

- [ ] **Step 3: Run complete verification**

```bash
pnpm test
pnpm typecheck
pnpm build
git diff --check
```

Expected: all commands exit 0. Existing non-fatal Rollup chunk-size warnings may remain.

- [ ] **Step 4: Commit implementation**

```bash
git add app/pages/index.vue app/__test__/homepage-ui.contract.test.ts public/video
git commit -m "feat: switch hero media with theme"
```
