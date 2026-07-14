# Homepage Content-First Redesign

Date: 2026-07-14
Status: Approved

## Goal

Redesign the homepage so technical articles are the primary destination while preserving the existing animated tree Hero as the site's signature visual.

The redesign should make light mode calmer, reduce template-like portfolio sections, and let a visitor reach recent writing after one short scroll.

## Success Criteria

- The Hero remains recognizable and retains its poster, delayed video loading, typewriter text, and reduced-motion behavior.
- Recent articles begin immediately after the Hero.
- At 1440x1000, the recent-articles heading is visible in the initial viewport and article cards begin within 300px of scrolling.
- The homepage no longer presents statistics and generic skill cards before the writing.
- Light mode has clear separation between page canvas, cards, borders, and text without relying on large pure-white areas.
- Mobile content remains usable at 375px without horizontal scrolling, clipped text, or overlapping controls.
- Normal body text targets at least WCAG AA contrast, interactive controls have visible focus states, and touch targets are at least 44px.

## Scope

### In scope

- Reorder and restyle the homepage in `app/pages/index.vue`.
- Simplify the homepage presentation of the existing `TechStack` content.
- Add light-mode homepage surface tokens or scoped styles where the existing Nuxt UI tokens are insufficient.
- Preserve existing routes, content queries, navigation, SEO metadata, and article data.
- Verify desktop and mobile light mode, then check dark mode for regressions.

### Out of scope

- Redesigning article detail pages, the blog index, documentation, chat, or playground pages.
- Changing the content schema, adding a CMS, or changing backend/database behavior.
- Adding newsletter signup, search infrastructure, analytics, or new routes.
- Replacing the existing Hero video or brand logo.

## Information Architecture

The homepage order will be:

1. Header
2. Compact signature Hero
3. Recent articles
4. Writing topics
5. Compact technology stack
6. Contact call to action
7. Footer

The current statistics section and four generic skill cards will be removed from the homepage.

## Header

The current navigation structure and logo remain unchanged. Styling should become quieter in light mode:

- Use a `white/90` light-mode surface with backdrop blur and a subtle slate-200 bottom border.
- Reduce decorative shadow around the logo.
- Preserve search, color-mode switch, GitHub link, and mobile navigation.
- Preserve existing keyboard behavior supplied by Nuxt UI.

## Compact Hero

The Hero retains the tree poster/video and centered composition, but it becomes a compact brand cover instead of occupying most of the first screen.

### Content

- Keep the availability/status badge.
- Keep the site title and typewriter role line.
- Replace the supporting description with `记录前端开发、UniApp、Web3 与工程化实践中的问题和解决方案。`.
- Primary action: `阅读最新文章`, linking to the recent-articles section with an in-page anchor.
- Secondary action: `关于我`, linking to `/about-us`.
- GitHub and email remain available as smaller tertiary actions.
- Remove the redundant RSS-style button that currently links to `/blog`.

### Layout

- Desktop Hero height: 600px, excluding the global header.
- Mobile Hero height: 560px.
- Desktop content remains centered with a controlled text width.
- Mobile buttons may wrap, but primary and secondary actions must remain visually distinct and at least 44px high.

### Visual treatment

- Light mode uses a restrained blue-slate overlay over the media instead of the current strong white wash.
- Hero text switches to high-contrast light text where necessary.
- The lower edge transitions smoothly into the light canvas color.
- Dark mode keeps its current mood, adjusted only where needed for consistency.

### Motion and performance

- Preserve poster-first rendering and delayed video source assignment.
- Preserve the `prefers-reduced-motion` behavior that prevents video loading.
- Keep entrance motion subtle and short.
- Avoid scale animations that make controls or cards jump.

## Recent Articles

Recent writing is the first section after the Hero and the main content of the homepage.

### Data

- Reuse the existing `posts` content query and date sort.
- Display the five most recent posts.
- Do not add a new API or duplicate article metadata in the component.

### Desktop layout

- One featured article occupies the wider left column.
- Four remaining articles use a compact two-by-two grid in the right column.
- Each article shows title, short description, date, and its existing badge/category.
- The entire card is clickable.
- Include a clear `查看全部文章` link to `/blog`.

### Mobile layout

- All cards stack in one column.
- The featured card remains visually stronger but loses unnecessary fixed height.
- Descriptions use line clamping without hiding titles.
- Dates and metadata remain readable and do not rely on very light gray.

### Empty state

- Preserve a simple empty state when no posts are available.
- A failed unrelated request must not cover or displace the article section.

## Writing Topics

Replace statistics and generic skill claims with a compact description of the subjects covered by the blog.

- Use four topics derived from existing content: `UniApp`, `Vue / Nuxt`, `工程化`, and `Web3`.
- Present them as restrained topic chips or compact rows, not large feature cards.
- Topic elements are informational and are not interactive in this redesign.
- Do not add fake counts or unsupported claims.

## Compact Technology Stack

The technology stack becomes supporting author context rather than a major homepage destination.

- Show these 10 core technologies: Vue 3, Nuxt 4, TypeScript, Tailwind CSS, Nuxt UI, UniApp, Vite, Git, Wagmi, and Viem.
- Remove homepage category tabs and the full logo matrix.
- Use consistent icon sizing and neutral text treatment.
- External technology links may remain, but focus and hover states must be visible.
- Add a compact display variant to `TechStack.vue` and keep its existing technology list as the single source of truth.

## Contact Call to Action

Retain the dark contact block as the closing section but reduce its visual weight.

- Reduce vertical padding and decorative glow.
- Keep the existing collaboration message, email action, and GitHub action.
- Use one primary and one secondary button.
- Maintain sufficient contrast in both modes.

## Light-Mode Visual System

Use the existing Public Sans typography and Nuxt UI component system. Do not introduce another font dependency.

Recommended homepage values:

- Canvas: `#F6F8FB`
- Surface: `#FFFFFF`
- Primary text: `#0F172A`
- Secondary text: `#475569`
- Border: `#E2E8F0`
- Accent: `#2563EB`

Rules:

- Use white for cards, not for every section background.
- Prefer thin borders and very soft shadows.
- Standardize major card radius around 16px.
- Remove rainbow gradient treatments from homepage capability content.
- Use the blue accent for links, active states, and primary actions only.
- Avoid text lighter than slate-600 for normal-sized body copy.

## Responsive Behavior

- Verify at 375px, 390px, 768px, 1024px, and 1440px.
- The mobile Hero should not hide the start of the article section behind oversized spacing.
- Article cards must switch cleanly to a single column.
- Topic and stack items may wrap without creating horizontal scroll.
- Desktop content uses one consistent container width rather than mixing unrelated maximum widths.

## Accessibility

- Preserve meaningful image `alt` text and empty alt text for decorative Hero media.
- Keep one logical page heading followed by sequential section headings.
- Maintain visible keyboard focus for links and buttons.
- Ensure icon-only actions retain accessible names.
- Ensure animations respect reduced-motion preferences.
- Do not communicate article category or interaction state through color alone.

## Component Boundaries

- Keep page-level data fetching, sorting, and section order in `app/pages/index.vue`.
- Extract a new component only when it represents a reusable or independently understandable section; avoid splitting the page into trivial wrappers.
- Keep technology data inside `TechStack.vue`.
- Add a compact prop to `TechStack` so the homepage can render the 10-item subset without duplicating its technology list.

## Error Handling

- Article rendering continues to use the current empty state when the content query returns no posts.
- Hero video playback failure continues to leave the poster visible.
- No new network request is required by the redesign.
- Existing unrelated API errors should not be made more prominent by the new layout.

## Verification

- Run type checking and the existing automated test suite.
- Render light mode at 1440px and 390px and compare the full page against this design.
- Check that recent articles are reachable after one normal scroll.
- Check dark mode at the same viewports for contrast or layout regressions.
- Verify reduced-motion behavior keeps the poster and avoids loading/playing the video.
- Check keyboard focus order through Header, Hero actions, article cards, stack links, and contact actions.
- Confirm no horizontal overflow at the required responsive widths.

## Acceptance Checklist

- Hero visual remains recognizable but is materially shorter.
- `阅读最新文章` scrolls to the recent-articles section.
- Five recent posts render from the existing collection.
- Statistics and generic skill cards are absent from the homepage.
- Writing topics replace capability claims without fake counts.
- Technology stack is visibly compact and limited to core items.
- Light mode uses distinct canvas and surface layers.
- Mobile shows articles substantially earlier than the current 4281px-long composition.
- Existing routes, SEO, dark mode, and reduced-motion behavior continue to work.
