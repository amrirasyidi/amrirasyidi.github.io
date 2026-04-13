# Plan: Services-page image optimization + framework cleanup + GitHub Pages migration

> **Save target:** `astro/reference/NEXT_STEPS.md` (will be written on plan approval — plan mode currently restricts edits to this scratch file).

## Context

Three open threads after the image-optimization pass on blog list/tag pages:

1. **Services page images are still unoptimized.** `pages/services/index.astro:104` uses raw `<img src={s.data.image}>`, and the three `content/services/*.mdx` files use markdown `![alt](/assets/portfolio/...)` syntax. Both bypass `astro:assets`. Portfolio images live in `public/assets/portfolio/images/`, **not** `src/assets/`, so Astro's optimizer cannot see them at all.
2. **Several hand-rolled patterns duplicate things Astro/integrations already give us for free.** Worth a sweep before more pages get added.
3. **Deployment is undecided.** Repo is `amrirasyidi.github.io` (a GitHub user-site repo) but the `astro/` build is currently a subdirectory next to the legacy frameworkless HTML still at the repo root. No `netlify.toml`, no `.github/workflows/`. Need to pick a deploy story.

Services pages are currently dev-only (`{import.meta.env.DEV && <a href="/services">…}`), so item 1 isn't blocking prod, but it has to land before services are unhidden.

---

## 1. Services-page image optimization (deferred — execute later)

### Approach

Generalize the existing helper rather than duplicating it.

**Files to modify:**

- `astro/src/lib/blogImages.ts` → rename to `assetImages.ts` (or add a sibling export). Add a second `import.meta.glob` for `/src/assets/portfolio/images/*.{png,jpg,jpeg,gif,webp,avif}`. Export `resolveAsset(src)` that handles both `/assets/blog/...` and `/assets/portfolio/...` prefixes. Keep `resolveBlogImage` as a thin alias for back-compat (or update the 3 call sites — they're all in this repo).
- `astro/src/components/Figure.astro` — switch the import to the generalized helper. No prop changes.
- `astro/src/pages/services/index.astro:104` — replace raw `<img>` with `<Image src={resolveAsset(s.data.image)!} … width=… height=… />`.
- `astro/src/content/services/*.mdx` (3 files) — replace `![alt](/assets/portfolio/...)` with `<Figure src="/assets/portfolio/..." alt="…" />`. Markdown `![]()` won't auto-optimize for absolute `/assets/...` paths in Astro 6; routing through Figure is the simplest fix and gives us captions for free.
- `astro/src/content.config.ts` — services schema currently `image: z.string()`. Leave as string; the helper resolves it. (Switching to the `image()` schema helper would force per-MDX relative imports, defeating the point.)

**Prerequisite (one-time copy):**

```
cp -r public/assets/portfolio/images src/assets/portfolio/images
```

`public/assets/portfolio/` is a real directory (not a symlink), so this is a plain copy. Don't delete the public copy yet — the legacy `services.html` at repo root still consumes it until the migration in §3.

**Out of scope:**

- `<video>` tags in service MDX — Astro has no built-in video optimization; passthrough is the only option. Leave as-is.
- `astro/src/pages/index.astro:25` profile.jpg — same fix pattern, do it in the same pass.

### Verification

```
npm run build
grep -oE '<img[^>]*service-demo-img[^>]*' dist/services/index.html | head
```

Expect `src="/_astro/..._demo0.<hash>.webp"` with explicit `width`/`height` and a `srcset`. Then load `/services/computer-vision-geospatial/` in `npm run preview` and confirm Figure-wrapped MDX images also resolve to `/_astro/...`.

---

## 2. Future plan — built-in components / integrations we should adopt

Things the current code reinvents or skips that Astro (or first-party `@astrojs/*` integrations) already provides. **None of these are urgent** — file under "do before the site grows further."

| # | Built-in / integration | Replaces today | Why it's worth it |
|---|---|---|---|
| 1 | **MDX `components` mapping** — register `{ img: Figure }` once, so every markdown `![alt](path)` auto-routes through Figure | Hand-wrapped `<Figure>` tags in MDX, raw `<img>` carryover from legacy HTML in some posts (`2022-09-04`, `2023-04-24`, `2023-06-30`, etc.) | Single source of truth for image rendering. Fixes the optimization gap for all `<img>`-tagged MDX in one shot. Astro/MDX docs: "Assigning custom components to HTML elements" |
| 2 | **Shared `Layout.astro`** with `<slot />` | Every page (`pages/index.astro`, `pages/blog/index.astro`, `pages/tags/index.astro`, `pages/tags/[tag].astro`, `pages/services/index.astro`, layouts) re-declares `<!doctype>`, `<head>`, `<meta>`, nav markup | ~80 duplicated lines per page. Title/description become props. Nav lives in one place — currently the dev-only Services link is gated in 5 separate files. |
| 3 | **`<ViewTransitions />`** from `astro:transitions` | Hard nav on every link | One import in the shared Layout → SPA-style cross-fades, persistent nav state. Zero JS to write. |
| 4 | **`@astrojs/sitemap`** | No sitemap.xml today | Auto-generated on build. Add `site:` to `astro.config.mjs` and the integration. ~3 lines. |
| 5 | **`@astrojs/rss`** | No RSS feed | Single `pages/rss.xml.js` file, generates from the blog collection. Standard pattern in Astro docs. |
| 6 | **`getImage()`** for `<head>` Open Graph tags | No OG images today | If/when you add per-post social previews, use `getImage()` to produce a hashed optimized URL for `<meta property="og:image">`. |
| 7 | **`<Picture>` from `astro:assets`** | `<Image>` everywhere | Only worth it where you want art-direction (different crops at different breakpoints). Probably overkill here. Listed for completeness. |
| 8 | **`@astrojs/check`** in CI / pre-commit | No type checking on `.astro` files today | Catches prop typos and schema drift. `astro check` is the command. |
| 9 | **Astro Actions** (`astro:actions`) | The Web3Forms client-side fetch in `services/index.astro` | Only useful if you move off pure static (Actions need an SSR adapter). Skip unless you adopt SSR. |
| 10 | **`@astrojs/partytown`** | Inline 3rd-party scripts (none today, but if you ever add analytics) | Moves analytics off the main thread. Pre-emptive note. |
| 11 | **`<Code>` / `<Prism>` from `astro:components`** | Shiki via markdown (already configured in `astro.config.mjs`) | You're already using shiki via the markdown pipeline — no action needed unless you want to render code blocks outside MDX. |

**Recommended order if/when you tackle this:** #2 (Layout) → #1 (MDX img mapping) → #3 (ViewTransitions) → #4/#5 (sitemap + RSS) → #8 (astro check). Items #6, #7, #9, #10, #11 are situational.

---

## 3. Question 1 — How do I actually make the migration?

Today the repo looks like:

```
amrirasyidi.github.io/
├── index.html          ← legacy frameworkless site (currently deployed)
├── blog.html           ← legacy
├── services.html       ← legacy
├── tags.html           ← legacy
├── assets/             ← legacy images, symlinked into astro/public/assets
├── blog/, service/, static/    ← legacy directories
└── astro/              ← the new Astro source (NOT deployed)
    └── dist/           ← built output
```

You have three viable paths. Pick **one**.

### Option A — Move Astro to the root (cleanest, recommended)

1. On a new branch, `git mv astro/* astro/.* .` so `package.json`, `src/`, `public/`, `astro.config.mjs` end up at the repo root.
2. Delete the legacy `index.html`, `blog.html`, `services.html`, `tags.html`, `blog/`, `service/`, `static/`, `tags.md` from the root. Move `assets/` into `public/assets/` (or `src/assets/`, see §1).
3. Update `public/assets` — currently a symlink to `../../assets`; after the move, make it a real directory.
4. Update `.gitignore` to ignore `dist/` and `node_modules/`.
5. Set up a deploy workflow (see §4 — Option 1).
6. Final check: `npm run build && npm run preview` → load every page → push.

**Pros:** repo becomes a normal Astro project, no nested confusion, easier for future-you.
**Cons:** one big destructive commit. Legacy HTML lost from working tree (still recoverable via git history).

### Option B — Keep `astro/` as a subdirectory, deploy `astro/dist`

Configure your deploy step to `cd astro && npm ci && npm run build`, then publish `astro/dist/`. The legacy HTML at the root stays around but is no longer served.

**Pros:** non-destructive. You can keep the legacy site as a reference until you're sure.
**Cons:** weird repo layout long-term. CI config slightly more verbose. You'll forget which directory to edit.

### Option C — Two branches: source on `main`, built site on `gh-pages`

GitHub Pages can serve from a separate branch. CI builds and force-pushes to `gh-pages`. This works for both Option A and Option B layouts.

**Pros:** clean separation of source vs. build artifact.
**Cons:** needs GH Actions either way; no real win over the modern "Pages from Actions" flow (§4 Option 1).

### Recommended path

**Option A + GitHub Pages from Actions (§4 Option 1).** It's the standard Astro-on-GitHub-Pages setup, the legacy HTML gets one final commit in git history, and there's no nested `astro/` confusion afterward.

---

## 4. Question 2 — Netlify or GitHub Pages?

You **don't currently use Netlify** — there's no `netlify.toml`, no Netlify config in the repo, and the only mention is one line in `readme.md` suggesting "drag and drop to Netlify" as a manual deploy option. So this isn't "switching off Netlify," it's "picking a host for the new build."

GitHub Pages is more than enough for this site. Static output, no server-side anything, custom domain support, free, and the repo is already named `amrirasyidi.github.io` — which is the magic name for a GH user-site (deploys to `https://amrirasyidi.github.io/` from the repo's configured branch/source).

### Option 1 — GitHub Pages via Actions (recommended)

Astro publishes a [first-party guide](https://docs.astro.build/en/guides/deploy/github/) for this. Workflow file (`.github/workflows/deploy.yml`):

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]   # or master, whichever is the default
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
        # If you keep Option B layout, add: with: { path: ./astro }

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

In repo settings → Pages → **Source: GitHub Actions**.

Add to `astro.config.mjs`:

```js
export default defineConfig({
  site: 'https://amrirasyidi.github.io',
  // base: undefined  ← user-site, no base path needed
  …
});
```

**Pros:** zero infra cost, runs on every push, official Astro action handles `withastro/action@v3` build + cache, custom domain works (add `CNAME` file in `public/`).
**Cons:** rebuild + deploy takes ~1–2 min per push (vs. Netlify's slightly faster pipeline). Build minutes are free for public repos.

### Option 2 — Netlify

Connect the repo, set build command to `npm run build` (or `cd astro && npm run build` for Option B), publish dir to `dist/` (or `astro/dist/`). Done.

**Pros:** instant deploy previews on PRs (GH Pages has nothing equivalent without extra work). Slightly faster builds. Better build logs UI.
**Cons:** another vendor account, another dashboard. Pulls deploy off GitHub. No real win for a personal site that doesn't need PR previews.

### Recommendation

**GitHub Pages via Actions.** You're already on GitHub, the repo name is already the GH-Pages magic name, you don't have a Netlify dependency to preserve, and PR previews aren't worth the extra vendor for a one-person site.

---

## Verification (when this whole plan is executed)

1. **Image opt:** `npm run build` then `grep '_astro' dist/services/index.html` and `grep '_astro' dist/services/computer-vision-geospatial/index.html` — every demo image should be a hashed `.webp` under `/_astro/`.
2. **Built-ins (when adopted):** check `dist/sitemap-index.xml` exists, `dist/rss.xml` exists, `View Transitions` script tag in `<head>`, no duplicated nav HTML across pages (single Layout.astro).
3. **Migration:** push to default branch → GH Action goes green → `https://amrirasyidi.github.io/` serves the new site → custom domain (if any) still resolves → all blog post URLs from the legacy site still work (compare a few `/blog/2023-...` URLs against the live site before pushing).

---

## 5. Comments — Sivers-style static HTML comments

### The idea (from sive.rs/shc)

Derek Sivers serves comments as **static HTML files written to disk only when a comment changes**, never queried from a database on page load. His stack is Sinatra + Postgres + `LISTEN`/`NOTIFY` + a Ruby listener that exports each post's comment thread to `/commentcache/<uri>.html`, which the page then `<include>`s. The page never touches the DB at read time.

**Why this matters for us:** the site is going to GitHub Pages — a pure static host with no runtime, no DB, no functions. We literally cannot run Sivers' Sinatra app there. But we don't need to: the *principle* is "comments are build artifacts, not runtime queries," and Astro's content collections + a rebuild trigger fit that exactly.

### Adapted approach for Astro + GH Pages

Treat each comment as a file in a content collection. The build folds them into the post page. New comment = new file = rebuild = new static HTML. No JS fetch, no DB, no third-party iframe (no Disqus, no utterances).

#### Storage shape

```
astro/src/content/comments/
├── 2023-04-23-python-speedup/
│   ├── 2023-05-01-alice.md
│   └── 2023-05-03-bob.md
├── 2026-04-08-aef/
│   └── 2026-04-12-carol.md
```

Filename = sortable date + author slug. Folder = blog post `id` (matches the `pages/blog/[...slug].astro` route).

Comment file frontmatter:

```markdown
---
author: Alice
date: 2023-05-01T14:22:00Z
website: https://alice.example  # optional
replyTo: 2023-04-30-zeke         # optional, for threading
---

The actual comment body, markdown allowed.
```

#### Wiring it into the build

1. **Add a `comments` collection** in `astro/src/content.config.ts`:

   ```ts
   const comments = defineCollection({
     loader: glob({ pattern: '**/*.md', base: './src/content/comments' }),
     schema: z.object({
       author: z.string(),
       date: z.coerce.date(),
       website: z.string().url().optional(),
       replyTo: z.string().optional(),
     }),
   });
   export const collections = { blog, services, comments };
   ```

2. **Render under each post** in `pages/blog/[...slug].astro` (or `layouts/BlogPost.astro`):

   ```astro
   ---
   const allComments = await getCollection('comments');
   const postComments = allComments
     .filter((c) => c.id.startsWith(`${entry.id}/`))
     .sort((a, b) => a.data.date.valueOf() - b.data.date.valueOf());
   ---
   {postComments.length > 0 && (
     <section class="comments">
       <h2>Comments ({postComments.length})</h2>
       {postComments.map((c) => {
         const Body = c.render ? (await c.render()).Content : null;
         return (
           <article class="comment" id={c.id}>
             <header>
               <strong>{c.data.author}</strong>
               <time datetime={c.data.date.toISOString()}>
                 {c.data.date.toLocaleDateString()}
               </time>
             </header>
             <Body />
           </article>
         );
       })}
     </section>
   )}
   ```

3. **CSS:** add `.comments`, `.comment` rules to `style.css`. Keep them visually distinct from post body — indented or a left border.

That's the "read" side. Zero runtime cost. Pure static HTML. **This alone is the Sivers-faithful core.** Everything below is optional polish around how comments *get into* the repo.

#### How comments get submitted (pick one)

The hard part is: a static site has no form handler. Three viable paths, ordered by ease.

**Option A — Email-only (zero infra, fully manual, very Sivers-coded).**

- At the bottom of every post, a `mailto:` link: "Send me your thoughts → comment+post-id@yourdomain".
- You read incoming email, decide what to publish, paste content into a new `.md` file, commit, push.
- GH Action rebuilds the site. Comment goes live.
- **Pros:** zero new infra. Total editorial control. Spam = your spam folder, already solved. Honors Sivers' "I personally read every email" ethos.
- **Cons:** every comment needs your hands on a keyboard. No anonymous commenting (sender identifies via email).

**Option B — Web form → GitHub Issue → manual merge.**

- Add a `<form>` on each post that POSTs to a free form-relay (Web3Forms — already in the repo for the contact page — or Formspree).
- Submission lands in your inbox **and** as a GitHub issue (Web3Forms has a webhook to GH).
- For approved comments: copy the issue body into a new `.md` file, commit, close issue. (Or: write a one-time script that does this from the GH CLI.)
- **Pros:** lowers reader friction (no email client needed). Still 100% your decision what publishes.
- **Cons:** spam reaches the issues queue; needs a honeypot field on the form.

**Option C — Form → Action → auto-PR.**

- Form POSTs to a GH Action via `repository_dispatch`.
- Action writes the comment file, opens a PR (or commits directly if you trust your spam check).
- You merge → site rebuilds.
- **Pros:** closest thing to "instant comment" on a static site.
- **Cons:** most moving parts. Auth secrets to manage. Still needs a relay endpoint for the form POST (GH doesn't accept arbitrary unauth POSTs).

**Recommendation: start with Option A.** It's one `mailto:` link and a folder convention. You can graduate to B or C only if comment volume becomes a problem — and on a personal blog, it usually doesn't.

#### What's intentionally NOT in this plan

- **No Disqus / utterances / giscus.** Those are exactly the runtime-DB / third-party-iframe pattern Sivers' post argues against. They also break on slow networks, get blocked by trackers, and rot when the vendor goes away.
- **No live moderation queue UI.** Editing files in your editor is the moderation queue.
- **No nested-reply UI in v1.** The `replyTo` field is in the schema for later; the v1 render is a flat list. Threading is a render-only change when you want it.
- **No comment counts on the blog index** in v1. Easy to add later (`getCollection('comments')` in `pages/blog/index.astro`, group-by post id).
- **No avatars.** They require Gravatar (privacy hit) or hosting images. Skip.
- **No "Notify me of replies."** Needs a mailing-list backend. Out of scope for static.

### Verification

1. Hand-create one comment file under `src/content/comments/2026-04-08-aef/2026-04-13-test.md`.
2. `npm run build` — should succeed.
3. Open `dist/blog/2026-04-08-aef/index.html` — search for the comment author name. It should be **inline HTML**, not a `<script>` placeholder. (This is the Sivers-faithful proof: comment is static, not fetched.)
4. `npm run preview` and load the post — comment renders under the post body, no network requests for comment data.

### Critical files for §5

- `astro/src/content.config.ts` — add `comments` collection
- `astro/src/content/comments/` — new directory, one subfolder per post
- `astro/src/pages/blog/[...slug].astro` — render comments block under post body
- `astro/src/styles/style.css` — `.comments`, `.comment` styles

---

## Critical files referenced

- `astro/src/lib/blogImages.ts` (helper to generalize)
- `astro/src/components/Figure.astro` (already routes through helper)
- `astro/src/pages/services/index.astro:104` (raw `<img>` to fix)
- `astro/src/content/services/*.mdx` (markdown `![]()` to wrap)
- `astro/src/content.config.ts` (services schema — leave as `z.string()`)
- `astro/astro.config.mjs` (add `site:` for sitemap/RSS/canonical URLs)
- `astro/package.json` (Astro `^6.1.5`, MDX `^5.0.3`, no integrations yet)
- `public/assets/portfolio/images/` (source to copy into `src/assets/`)
- `.github/workflows/deploy.yml` (to be created for GH Pages)
