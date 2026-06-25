## Tier 1 — Do before growing the site

### 1.1 Services-page image optimization

**Why:** `pages/services/index.astro:104` still uses raw `<img>`, and `content/services/*.mdx` uses `![]()` pointing to `public/assets/portfolio/` — both bypass `astro:assets`. Not blocking prod (services is dev-gated) but must land before un-hiding services.

**Approach:** generalize `src/lib/blogImages.ts` into `assetImages.ts` — add second `import.meta.glob` for `/src/assets/portfolio/images/*`. Export `resolveAsset(src)` handling both `/assets/blog/...` and `/assets/portfolio/...`. Keep `resolveBlogImage` as alias.

**Files:**
- `src/lib/blogImages.ts` — add portfolio glob + `resolveAsset`
- `src/components/Figure.astro` — point to generalized helper
- `src/pages/services/index.astro:104` — `<Image>` + `resolveAsset`
- `src/content/services/*.mdx` (3 files) — `![]()` → `<Figure>`
- `src/pages/index.astro:25` — profile.jpg same fix in same pass

**Prerequisite (one-time):**
```sh
cp -r public/assets/portfolio/images src/assets/portfolio/images
```
(After §0.1 migration, paths are repo-root-relative.)

**Out of scope:** `<video>` in service MDX (Astro has no video opt; passthrough).

**Verify:**
```sh
npm run build
grep '_astro' dist/services/index.html | head
```
Expect hashed `.webp` with `srcset`.

### 1.2 RSS feed (`@astrojs/rss`)

Single `src/pages/rss.xml.js` generating from the `blog` collection. ~15 lines. Standard Astro pattern.

### 1.3 `@astrojs/check` in pre-commit / CI

Catches `.astro` prop typos + schema drift. `astro check`. Add to the new deploy workflow as a build step, or as a lefthook pre-commit.

---

## Tier 2 — Polish, pick up whenever

| Item | Notes |
|---|---|
| **`<ViewTransitions />`** | One import in `Layout.astro` → SPA cross-fades. Zero JS to write. |
| **`getImage()` for OG tags** | When adding per-post social previews. |
| **`<Picture>`** | Only if you want art direction (different crops per breakpoint). Likely overkill. |
| **`@astrojs/partytown`** | Pre-emptive; only matters once you add analytics. |

---

## Tier 3 — Situational / deferred indefinitely

- **Astro Actions** — needs SSR adapter; skip while static.
- **`<Code>` / `<Prism>`** — shiki already wired through markdown pipeline.
- **Comments (Sivers-style static HTML)** — **deprioritized, not doing this yet.** Sketch preserved at the bottom of this file for future reference.

---

## Verification checklist (post-migration)

1. `npm run build && npm run preview` → click every page type locally.
2. Push → GH Action green → `https://amrirasyidi.github.io/` serves new site.
3. Spot-check old blog URLs against live: `/blog/2023-04-23-python-speedup/` etc.
4. `dist/sitemap-index.xml` exists.
5. No `<img>` in `dist/**/index.html` pointing outside `/_astro/` except intentional passthroughs (remote URLs, videos).

---

## Critical files referenced

- `astro.config.mjs` — `site:` set, sitemap integrated
- `src/lib/blogImages.ts` — to generalize for portfolio in §1.1
- `src/components/Figure.astro`, `src/components/MdxImg.astro`
- `src/pages/services/index.astro:104` — raw `<img>` remaining
- `src/content/services/*.mdx` — `![]()` remaining
- `public/assets/portfolio/images/` — copy source for §1.1
- `.github/workflows/deploy.yml` — to create in §0.1

---

## Appendix — Comments sketch (not doing yet)

Preserved from earlier plan in case future-you wants it. Sivers' sive.rs/shc idea: comments are build artifacts, not runtime queries. Adapted to Astro: each comment = a file in a `comments` content collection under `src/content/comments/<post-id>/<date-author>.md`. Build folds them into the post page. New comment = commit = rebuild. Submission via `mailto:` link (Option A, zero infra). No Disqus/giscus/utterances. Full schema + render snippet was in the prior NEXT_STEPS revision; recover from git history if needed.
