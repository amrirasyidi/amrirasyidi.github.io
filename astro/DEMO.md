# Why Migrate to Astro — Before vs After

## The Problem

Your blog works. But every new post costs you friction that compounds over time.

---

## Pain Point 1: Manual Post Registration

**Before** — Every new post requires editing `blog-posts.js`:

```js
// static/blog-posts.js — you maintain this by hand
const BLOG_POSTS = [
    '20260408-aef.html',
    '20260307-freelance.html',
    '20251019-sg1.html',
    // ... 15 more entries you must not forget to add
];
```

Miss an entry? Post exists but is invisible on the blog page. No error, no warning.

**After** — Drop a file in `src/content/blog/`. Done. Astro discovers it automatically.

```
src/content/blog/
├── 2023-05-29-occams-razor.md     ← just exists
├── 2026-04-08-aef.mdx             ← just exists
└── my-new-post.md                 ← add file = published
```

No registration file. No manual list. No forgetting.

---

## Pain Point 2: Repeated Metadata

**Before** — Title, date, and tags appear in 4 different places per post:

```html
<!-- 1. HTML comment metadata (for blog.js parser) -->
<!--
title: Occam's Razor
date: 2023-05-29
tags: python, data-science
-->

<!-- 2. <title> tag -->
<title>Occam's Razor - Amri Rasyidi</title>

<!-- 3. <h1> in body -->
<h1>Occam's Razor</h1>

<!-- 4. Post meta section -->
<div class="post-meta">Published on May 29, 2023</div>

<!-- 5. Tags section at bottom -->
<a href="../tags.html?tag=python" class="tag">python</a>
```

Change the title? Update 3 places. Forget one? Inconsistency. No warning.

**After** — Write once in frontmatter. Layout renders everything from it.

```md
---
title: Occam's Razor
date: 2023-05-29
tags: [python, data-science]
excerpt: ...
---

Your content starts here. Title, date, tags — all rendered by the layout automatically.
```

Frontmatter is validated by schema. Wrong date format = **build error**, not silent bug.

---

## Pain Point 3: 40 Lines of Boilerplate Per Post

**Before** — Every post repeats nav, head, CSS links, dark-mode script, tags section:

```
Lines 1-6:    HTML comment metadata
Lines 7-15:   DOCTYPE, head, CSS links
Lines 16-27:  Nav bar (copied into every file)
Lines 29-31:  Back link
Lines 33:     h1 (duplicated from metadata)
Lines 35-37:  Post meta (date duplicated again)
...content...
Lines 325-331: Tags section (tags duplicated again)
Lines 333:     Dark mode script tag
Lines 334:     </body></html>
```

~40 lines of boilerplate wrapping your actual content. Change the nav? Edit 17 files.

**After** — Layout handles all chrome. Post file = pure content.

```
Lines 1-5:   Frontmatter (single source of truth)
Lines 7+:    Your content. Nothing else.
```

Change nav? Edit `BlogPost.astro` once → all 17 posts update.

---

## Pain Point 4: Slow Blog Page (Client-Side Pagination)

**Before** — `blog.js` is 368 lines of client-side JavaScript that:
1. Fetches each post HTML file via network request
2. Parses HTML in the browser to extract metadata
3. Calculates reading time by stripping HTML tags client-side
4. Manages pagination state, URL params, loading spinners, error states

Result: loading spinner on every page visit. Network waterfall of 3-5 fetches per page. User waits.

```
User visits /blog.html
  → browser loads blog.js (368 lines)
  → JS fetches blog-posts.js
  → JS fetches post1.html, post2.html, post3.html in parallel
  → JS parses each HTML to extract title/date/tags
  → JS renders cards
  → user sees content (after 3-5 network round trips)
```

**After** — Blog index is pre-rendered HTML. Zero JavaScript. Instant.

```
User visits /blog
  → browser renders pre-built HTML
  → user sees content (0 network round trips for data)
```

All 17 posts on one page. No pagination needed — it's just HTML, no parsing overhead.
If pagination desired later, Astro has built-in `paginate()` that generates `/blog/1`, `/blog/2` as static HTML.

---

## Pain Point 5: No Search

**Before** — None. Users scroll through paginated lists or use browser Ctrl+F on individual posts.

**After** — Pagefind: static search index built at build time.
- ~100KB total payload
- Zero backend / API
- Searches across all post content, titles, tags
- Instant results with highlighting

---

## Pain Point 6: No Table of Contents

**Before** — Long posts (like the AEF post, 857 lines) have no navigation. Users scroll or use manual anchor links you hand-craft.

**After** — Automatic sticky TOC sidebar:
- Headings extracted at build time from your markdown
- Sticky sidebar follows scroll
- Highlights current section (scrollspy)
- Clickable — jumps to section
- Zero manual maintenance — add a heading, TOC updates

---

## Authoring Comparison

### A prose-heavy post (Occam's Razor)

**Before (HTML)** — 334 lines:

```html
<p>
    I planned this to be a shorter entry, I just want to point out what should I
    do in my next project, some sort of lessons learned from this project, then
    some thought on some alternatives that I tried to finish this project.
</p>

<h2>The Case of Obviousness</h2>

<blockquote>
    <p><em>Pluralitas non est ponenda sine necessitate</em></p>
    <footer>William of Ockham</footer>
</blockquote>

<p>why does anything in latin sounds so big brained?</p>

<ul>
    <li>
        This is actually the initial plan. Initially we want to do all the
        process inside ArcGIS Pro. However, what we wanted to achieve is not
        natively provided by ArcGIS Pro...
    </li>
</ul>
```

**After (Markdown)** — ~160 lines (estimated):

```md
I planned this to be a shorter entry, I just want to point out what should I
do in my next project, some sort of lessons learned from this project, then
some thought on some alternatives that I tried to finish this project.

## The Case of Obviousness

> *Pluralitas non est ponenda sine necessitate*
> — William of Ockham

why does anything in latin sounds so big brained?

- This is actually the initial plan. Initially we want to do all the
  process inside ArcGIS Pro. However, what we wanted to achieve is not
  natively provided by ArcGIS Pro...
```

No `<p>` tags. No `<li>` wrappers. No closing tags. Just text.

For prose-heavy posts (most of yours), markdown is genuinely less typing. For complex posts with tables + tooltips + Plotly, you can use MDX or even keep raw HTML — both work in Astro.

---

## Performance

| Metric | Before (Raw HTML) | After (Astro) |
|--------|-------------------|---------------|
| Blog index JS payload | ~370 lines blog.js + blog-posts.js | 0 KB (pre-rendered) |
| Network requests to show blog | 4-6 (JS + post fetches) | 1 (the HTML page) |
| Syntax highlighting | Prism.js (client parse) | Shiki (build-time, 0 JS) |
| Dark mode toggle | dark-mode.js on every page | Dark-only (0 JS) |
| Image format | Raw JPEG/PNG as uploaded | WebP/AVIF auto-optimized (future) |
| Search | None | Pagefind (~100KB static index) |

---

## What You Keep

- **Full HTML escape hatch** — MDX supports inline HTML. Complex posts stay complex.
- **Same CSS** — `style.css` ported as-is. Same look.
- **Same design** — dark theme, nav, layout, tags — all preserved.
- **GitHub Pages / Netlify compatible** — `astro build` → static files, same deploy.
- **No runtime** — output is still static HTML/CSS/JS. No server needed.

## What You Gain

- Write prose in markdown (or HTML — your choice, per post)
- Single-source frontmatter (title/date/tags typed once, validated)
- Auto-discovered posts (no manual registration)
- One layout file (change nav once → all posts update)
- Static search across all posts
- Auto-generated table of contents
- Pre-rendered blog index (no client-side fetching)
- Build-time syntax highlighting (zero client JS)
- Component reuse for callouts, tooltips, figures

## What You Lose

- Zero-build simplicity (now need `npm run build`, but Netlify handles this)
- Node.js dependency (~200MB node_modules)
- Direct "edit HTML, push, done" workflow → becomes "edit md, push, Netlify builds"

---

## Demo Checklist

After reviewing this document, verify the following in the running Astro dev server:

- [ ] Blog index at `/blog` — auto-lists posts, no `blog-posts.js`
- [ ] Post renders at `/blog/2026-04-08-aef` — same look as current site
- [ ] Post renders at `/blog/2023-05-29-occams-razor` — ported as plain `.md`
- [ ] Dark-only mode — no toggle, no flash
- [ ] Sticky TOC sidebar on long posts — clickable headings, scrollspy
- [ ] Search on blog index — type query, get results
- [ ] Syntax highlighting — build-time Shiki, no Prism JS loaded
- [ ] Compare `.md` source vs `.html` source — line count, readability
