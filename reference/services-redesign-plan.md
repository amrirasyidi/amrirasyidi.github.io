# Services Page Redesign Plan

## Goal
Conversion-optimized services page that drives client contact inquiries. Bold, confident tone, no rounded edges, zero fluff.

## Design Principles
- Pain-first copy (lead with client problem, not own skills)
- ROI framing on all services (how does this make/save money?)
- Trust signals everywhere (stats, testimonials, free consultation)
- Always-one-click-to-contact (sticky CTA, nav button)
- Zero border-radius on services page only

## Page Structure (top → bottom)

| # | Section | Purpose |
|---|---|---|
| 1 | **Sticky nav** | Logo + anchor links (Services, Portfolio, Contact) + "Hire Me" button |
| 2 | **Hero** | Badge pill + pain-first headline + 2 CTA buttons + trust stats inline |
| 3 | **Services** | 3 cards with checkmark bullet lists + "Learn More" links to detail pages |
| 4 | **Process** | 3-step numbered timeline with time estimates + connector lines |
| 5 | **Testimonials** | 3-card grid with star ratings (from real quotes) |
| 6 | **CTA** | Simple centered block before contact form |
| 7 | **Contact form** | 2-column name/email, inline success message |
| 8 | **Sticky CTA** | Fixed bottom-right button, appears after 400px scroll |

## Copy Direction

### Hero
- **Headline**: "Stop Guessing. See What Your Location Data Is Really Worth."
- **Sub**: "Satellite imagery analysis, AI computer vision, and custom GeoAI — built to ship results, not slide decks."
- **CTA**: "Get a Free Consultation" / "View Case Studies"

### Services (ROI framing)
- Satellite Imagery Analysis → "Detect unauthorized activity before it costs you millions"
- AI Computer Vision → "Automate analysis of thousands of images in hours, not weeks"
- Business Lead Extraction → "Turn location data into your next $100K deal"

### Stats (honest)
- 9 Projects Delivered
- 4 Countries Served
- 3 of 4 Clients Rehire

### Process (with time estimates)
1. **Assessment** — 30 min call. Understand data landscape, identify highest-impact opportunity.
2. **Proof of Concept** — 1 week. Working prototype with your actual data.
3. **Delivery** — 2-4 weeks. Production-ready solution + documentation + team training.

## Style Changes
- `--border-radius: 0px` scoped to `.wide-page` (services-only class)
- Glassmorphism cards: `background: rgba(51,51,51,0.5)` + `backdrop-filter: blur(8px)`  (approx of Tailwind bg-background/50 backdrop-blur)
- Color-coded service icons using existing `--accent-primary` variants
- Sticky CTA: fixed bottom-right, `z-index: 50`, hidden until scroll > 400px

## Files to Edit
1. `src/pages/services/index.astro` — full restructure of sections and copy
2. `src/styles/style.css` — add services-specific styles:
   - `.wide-page` zero-radius overrides
   - Service card glassmorphism
   - Process timeline
   - Sticky CTA
   - Star ratings for testimonials

## Non-Goals
- Changing blog/tags pages (keep their rounded edges)
- Removing `import.meta.env.DEV` guard on nav (will release later)
- Adding fake metrics (50K hectares, 95% retention)
