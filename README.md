# Personal Website

Astro blog with MDX posts, Pagefind search, tag filtering, dark mode, and GitHub Pages deploy.

## Quick Start

```sh
npm install        # install deps
npm run dev        # dev server at localhost:4321
npm run build      # build + pagefind search index → dist/
npm run preview    # preview production build locally
```

## Add a Blog Post

```sh
cp src/content/blog/_template.mdx src/content/blog/YYYY-MM-DD-slug.mdx
```

Frontmatter (file top):

```yaml
---
title: "Post Title"
date: 2026-06-25
excerpt: "One-liner for listing & meta."
tags: [tag1, tag2]
image: "/assets/blog/images/20260625_file.png"   # optional thumbnail
draft: true                                        # optional, hides from listing
---
```

- Place images in `src/assets/blog/images/`, reference as `/assets/blog/images/file.ext`
- Components available: `Callout`, `Details`, `Figure`, `Tooltip`, `TwoCol`, `PlotlyCompare`

## Drafts

Add `draft: true` to frontmatter. Post stays accessible at its URL but hidden from listing.

## Deploy

Push to `master`. GitHub Actions builds + deploys to GitHub Pages automatically.
