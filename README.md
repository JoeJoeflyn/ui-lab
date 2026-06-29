# UI Lab

A gallery of GPU shader-based particle text effects: **50 hover interactions** and **75 entrance animations**, each with a live preview and copy-paste code.

Born from the [`PARTICLE_EFFECTS.md`](./PARTICLE_EFFECTS.md) design spec.

## Stack

- Next.js 16 (App Router, Turbopack)
- React 19
- Tailwind CSS 4
- three.js (GPU point-cloud rendering)
- TypeScript (strict)

## Develop

```bash
npm install
npm run dev          # http://localhost:3000
npm run typecheck    # tsc --noEmit
npm run build        # production build
```

## Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout, fonts, metadata
│   ├── page.tsx                # Gallery home — all effects grouped by category
│   ├── effects/[slug]/page.tsx # Per-effect page (preview + code + neighbors)
│   ├── globals.css             # Tailwind 4 theme (dark oklch palette)
│   ├── robots.ts
│   └── sitemap.ts
├── components/
│   └── particle-text.tsx       # ParticleText component (spec API, stub impl)
└── lib/
    ├── effects.ts              # Effect catalog (single source of truth)
    ├── fonts.ts                # Syne / Sora / JetBrains Mono
    └── url.ts                  # Base URL resolver
```

## Effect Catalog

The catalog in `src/lib/effects.ts` is generated from `PARTICLE_EFFECTS.md`. Each effect has:

- `slug` — URL path and API union member
- `name` — display name
- `kind` — `hover` or `entrance`
- `category` — family (scatter, attract, wave, transform, etc.)
- `feel` — one-line description
- `technique` — key GLSL technique
- `specRef` — section number in the spec

## Status

- [x] Project scaffold + gallery home + per-effect routes
- [x] Effect catalog (125 effects from spec)
- [x] ParticleText component API (types match spec)
- [ ] GLSL shader implementation per effect
- [ ] Live preview wiring on effect pages
- [ ] Copy-to-clipboard on code blocks
