# Service Detail Page Redesign Plan

## Goal
Conversion-optimized product landing pages for each service. Structured gallery, carded capabilities, value propositions with icons, hero CTA.

## Current State
- `src/layouts/ServicePage.astro` — bare: back link + `<h1>` + `.post-content` slot + generic CTA
- `src/pages/services/[...slug].astro` — passes `Content` from MDX render to `ServicePage`
- 3 MDX files in `src/content/services/` — each has frontmatter `title`, `cardTitle`, `excerpt`, `image`, `order` + markdown body with `## Capability Overview` and `## Business Value` sections
- Images/videos inside MDX are raw markdown/media — no structured gallery
- Capability/value lists are plain `<ul>` with bold prefixes and emoji on value items

## Page Structure (top → bottom)

| # | Section | Implementation |
|---|---|---|
| 1 | **Hero** | Full-width image background + overlay. Title, excerpt, CTA button ("Discuss This Service"), back link pill. |
| 2 | **Demo Gallery** | Hero image from frontmatter (full-width). Then videos and additional images as a responsive grid (2-column masonry or single column). |
| 3 | **Capabilities** | "Capabilities" heading. Bullet list rendered as card grid (2-col). Each card: icon/emoji (extracted from bold prefix) + title + description. |
| 4 | **Business Value** | "Business Value" heading. Bullet list as value card grid (2-col). Each card: emoji (from ** prefix) + title + description. |
| 5 | **CTA Section** | Full-width section with "Interested in this service?" headline + "Discuss This Service" button + "← All Services" secondary link. Sticky CTA also present. |

## Files to Change

### 1. `src/layouts/ServicePage.astro`
Restructure to replace the plain `<h1>` + `.post-content` with the hero + section layout:

```
- import Layout from './Layout.astro'
- accept props: title, excerpt, image
- hero section: full-width image using props.image, overlay with title + excerpt + CTA button
- .post-content slot for the MDX body (Capabilities + Business Value)
- CTA section at bottom
- sticky CTA
```

Props needed from `[...slug].astro`:
- `title` (already passed)
- `excerpt` (already passed)
- `image` (NEW — from `service.data.image`)

### 2. `src/pages/services/[...slug].astro`
Pass `image={service.data.image}` to `<ServicePage>`.

### 3. `src/styles/style.css` — Add wide-page scoped styles:
- `.wide-page .service-detail-hero` — full-width image hero with overlay
  - Background image, min-height 400px, flex column, justify-content flex-end
  - Overlay gradient from bottom
  - Title, excerpt, CTA button
- `.wide-page .service-detail-hero .back-link-pill` — subtle pill for back to services
- `.wide-page .service-detail-content` — wrapper that constraints width, centers content
- `.wide-page .service-detail-gallery` — image/video grid
  - Hero image full-width
  - Additional images: 2-column grid or single column
  - Videos: 16:9 aspect ratio container
- `.wide-page .service-capabilities-grid` — 2-column grid for capability cards
- `.wide-page .service-capability-card` — card with icon, title, description
- `.wide-page .service-value-grid` — 2-column grid for value cards
- `.wide-page .service-value-card` — card with emoji, title, description
- `.wide-page .service-detail-cta` — bottom CTA section with sticky support

### 4. MDX files — minor changes (optional)
Keep existing structure. The new layout/StylePage.astro will handle the hero and content wrapper. MDX just provides the raw content.

## CSS Patterns to Reuse
- Glassmorphism cards from `.service-card`: `background: rgba(51,51,51,0.4)`, `backdrop-filter: blur(8px)`, `border: 1px solid var(--border-light)`
- `.primary-cta` / `.secondary-cta` buttons
- `.section` padding (48px 0)
- `.sticky-cta` from services index page

## MDX Content Extraction Strategy

Capability bullets: current format is `- **Title** — Description`.
Extract title (bold text before ` — `) and description. Use CSS to style each bullet as a card.

Business Value bullets: current format is `- **emoji Title** — Description`.
Same extraction, but keep emoji as icon.

If using JS to parse the HTML after rendering:
- Query `.post-content h2` to find section boundaries
- For each `<ul>` after `## Capability Overview`, wrap in `<div class="service-capabilities-grid">`
- For each `<ul>` after `## Business Value`, wrap in `<div class="service-value-grid">`
- Each `<li>` becomes a card

Alternatively, restructure MDX content to use frontmatter arrays for capabilities and values, removing the markdown body. This is cleaner but requires data migration.

## Order of Implementation

1. Add CSS for service detail page (hero, content wrapper, gallery, capability/value grids)
2. Update `ServicePage.astro` with new structure and props
3. Update `[...slug].astro` to pass `image` prop
4. Optionally restructure MDX frontmatter for cleaner data extraction
5. Add sticky CTA
6. Test all 3 service pages

## Verification
```sh
npm run build
check dist/services/boundary-monitor/index.html for correct structure
npm run dev to preview visually
```
