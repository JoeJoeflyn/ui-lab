# Phase 3 Context: Gallery Polish

## Goal
Every effect card is a live composite preview; UI issues resolved.

## Success Criteria
1. No placeholder text cards remain — all use `ParticleText`
2. Hero exhibit cycles through a representative sample
3. No console errors / WebGL context leaks across navigation

## Current State (pre-audit)
- All 125 effects have `implemented: true` via the `IMPLEMENTED_EFFECTS` sync loop in effects.ts (lines 342-346)
- Entrance cards auto-play WebGL on scroll into view (IntersectionObserver)
- Hover cards mount WebGL on hover only
- Hero has 12-dot navigation but NO auto-advance timer (only manual click)
- Hero only receives `HOVER_EFFECTS` (50 effects) — should cycle through ALL effects
- WebGL cleanup in particle-text.tsx is correct (cancelAnimationFrame, dispose, removeChild)
- Copy button generates correct code snippets for both hover and entrance effects

## Issues Found
1. **Hero lacks auto-advance** — only advances on dot/arrow click. Need a 5s timer.
2. **Hero only shows hover effects** — should cycle through a representative sample of ALL 125 effects (hover + entrance).

## Key Files
- `src/components/effect-cards.tsx` — EffectHero + EffectMiniCard
- `src/components/particle-text.tsx` — WebGL composite component
- `src/components/effect-preview.tsx` — detail page preview
- `src/app/page.tsx` — homepage (passes effects to hero)
- `src/lib/effects.ts` — effect catalog
