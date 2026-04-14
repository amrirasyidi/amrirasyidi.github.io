# NEXT STEPS

Status snapshot after the image-opt + layout cleanup pass. Reordered by impact.

---

## Tier 0 — Ship it (do next)

### 0.1 Migrate `astro/` → repo root + deploy to GitHub Pages

Decision confirmed: **move Astro to root, deploy via GH Pages Actions.** Rationale:

- Repo is already named `amrirasyidi.github.io` → user-site magic. Serves from `https://amrirasyidi.github.io/`.
- No Netlify config exists — nothing to preserve.
- Nested `astro/` layout is confusing long-term.
- PR previews aren't worth a second vendor for a one-person site.

**Pre-flight check (from current repo state):**

- Current branch: `rework`
- `astro/public/assets` is an **absolute symlink** to `/home/arasyidi/project/amrirasyidi.github.io/assets` → will break after move. Must convert to real dir.
- Legacy root files to remove: `index.html`, `blog.html`, `services.html`, `tags.html`, `tags.md`, `blog/`, `service/`, `static/`, `favicon.ico` (duplicate — `astro/public/` already has it).
- `astro/.gitignore` already covers `dist/`, `.astro/`, `node_modules/`. Root `.gitignore` may need merging.

#### Command sheet — migration

Run from repo root `/home/arasyidi/project/amrirasyidi.github.io`. Do **not** batch blindly — check each step.

```sh
# 0. Safety: clean working tree first
git status
git stash -u   # if anything dirty

# 1. New branch off rework
git checkout rework
git pull
git checkout -b migrate-to-root

# 2. Break the broken symlink BEFORE moving anything
#    (astro/public/assets → absolute path that won't exist post-move)
rm astro/public/assets

# 3. Move legacy /assets into astro/public/assets as a real directory
#    (this is what the symlink pointed at)
mv assets astro/public/assets

# 4. Remove legacy root files (frameworkless site)
rm -rf blog service static
rm index.html blog.html services.html tags.html tags.md
rm favicon.ico   # astro/public/favicon.ico already exists

# 5. Move astro/* (including dotfiles) up to repo root
#    Use shopt for dotglob so .gitignore etc. come along
shopt -s dotglob
mv astro/* .
shopt -u dotglob
rmdir astro

# 6. Sanity check tree
ls -la
ls public/assets   # should be real dir, not symlink

# 7. Build locally to verify nothing broke
npm ci
npm run build
npm run preview    # open browser, click through home / blog / post / tags

# 8. Stage + commit
git add -A
git status         # eyeball — make sure no stray files
git commit -m "migrate astro to repo root, drop legacy frameworkless site"
```

#### Command sheet — deploy workflow

```sh
mkdir -p .github/workflows
# then create .github/workflows/deploy.yml (content below)
```

`.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [master]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: withastro/action@v3

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

`astro.config.mjs` already has `site: 'https://amrirasyidi.github.io'` — no `base` needed for user-sites.

#### Command sheet — merge + publish

```sh
# 1. Push branch, open PR (or merge direct)
git push -u origin migrate-to-root

# Option X: merge via PR
gh pr create --base master --title "Migrate to Astro at repo root + GH Pages deploy" --body "Move astro/ → root, drop legacy HTML, add GH Pages workflow."
# review, merge in GH UI

# Option Y: fast-forward locally
git checkout master
git merge --ff-only migrate-to-root
git push origin master

# 2. In GH UI: Settings → Pages → Source: GitHub Actions
# 3. Watch Actions tab — first run should build + deploy
# 4. Visit https://amrirasyidi.github.io/
```

#### Rollback

```sh
# If deploy breaks and you need the old site back:
git revert <merge-commit-sha>
git push origin master
# or switch Pages source back to the old branch in Settings → Pages
```

---

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

## ✅ Done (this session)

- ~~MDX `img` component mapping~~ → `components/MdxImg.astro` + `<Content components={{ img: MdxImg }} />` in `[...slug].astro`. Legacy raw-`<img>` MDX files (4) rewritten to `<MdxImg>`.
- ~~Shared `Layout.astro`~~ → created. `index`, `blog/index`, `tags/index`, `tags/[tag]`, `services/index`, `BlogPost`, `ServicePage` all route through it. ~400 dup lines killed. Dev-only Services nav gated in one place.
- ~~`@astrojs/sitemap`~~ → integrated. `site:` set in `astro.config.mjs`.
- ~~Responsive `widths` + `sizes` on `<Image>`~~ → Figure + MdxImg emit `[480,960,1440,1920]` srcset. Fixed slow image loads (was serving original dims per image).
- ~~Lightbox~~ → BlogPost.astro click-to-fullres overlay, srcset-aware (picks largest entry), ESC + backdrop close.
- ~~OL numbering regression~~ → removed CSS counter hack, restored native `list-style: decimal`.
- ~~Port `20260413-gemma-wsl-local.html` → MDX~~ → `content/blog/2026-04-13-gemma-wsl-local.mdx`.
- ~~Auto-allow discovery commands~~ → `.claude/settings.local.json`.

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
