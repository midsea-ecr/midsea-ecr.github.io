# MIDSEA — Quarto site scaffold

This folder is a runnable **Quarto website** version of the MIDSEA prototype.

## Structure

```
quarto/
├── _quarto.yml           # site config, navbar, footer
├── index.qmd             # homepage (hero + previews)
├── about.qmd
├── network.qmd           # interactive SEA map (SVG + JS)
├── people.qmd            # listing → people/*.qmd
├── research.qmd          # listing → publications/*.qmd
├── events.qmd            # listing → events/*.qmd
├── news.qmd              # listing → posts/*.qmd (blog)
├── training.qmd          # listing → courses/*.qmd
├── mentorship.qmd
├── join.qmd              # membership form
├── contact.qmd
├── theme/
│   ├── midsea.scss       # Bootstrap / Quarto variables + overrides
│   ├── midsea.css        # component styles (full CSS from prototype)
│   ├── midsea.js         # hero network, map, listings, ticker, tweaks
│   ├── fonts.html        # Google Fonts <link> injected into <head>
│   └── scripts.html      # <script> tag injected before </body>
├── assets/
│   └── midsea-logo.svg
└── (you create)
    ├── people/
    ├── publications/
    ├── events/
    ├── posts/
    └── courses/
```

## Render locally

```bash
cd quarto/
quarto preview
```

## Populating listings

Each listing page reads a folder of individual `.qmd` or `.md` files.
Example — a person at `people/minh-anh.qmd`:

```yaml
---
name: "Nguyễn Minh Anh"
role: "PhD Candidate"
institution: "University of Medicine & Pharmacy"
country: "Viet Nam"
tags: [Dengue, Serology]
image: profiles/minh-anh.jpg
date: 2023-01-15
---

Short bio in markdown…
```

A news post at `posts/2026-04-14-dengue-accepted.qmd`:

```yaml
---
title: "Dengue serotype dynamics paper accepted at Lancet ID"
date: 2026-04-14
categories: [Preprint]
description: "The network's flagship multi-country study lands after two years of data harmonisation."
---
```

## Homepage previews

`index.qmd` contains `#hero-events` and `#hero-news` placeholders. The script
at `theme/midsea.js` populates them from hard-coded arrays — swap for a small
Quarto build script if you want them auto-pulled from the listing folders.

## Notes

- The left-rail nav of the prototype is mapped to Quarto's top navbar in
  `_quarto.yml`. If you prefer a sidebar-style layout, swap `navbar:` for
  `sidebar:` in `_quarto.yml`.
- `theme/midsea.css` is the full component library — tables, pubs, events,
  mentorship card, join form, map, etc. You can strip out what you don't use.
- The animated SVG hero respects `prefers-reduced-motion` and reduces its node
  count on small screens for performance.
