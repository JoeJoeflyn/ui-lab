# Phase 3 Discussion Log

## 2025-06-29 — Initial Audit

### Findings
- **Placeholder cards**: The `IMPLEMENTED_EFFECTS` sync loop (effects.ts:342-346) sets `implemented: true` on all 125 effects at runtime. No "coming soon" badges will appear. PASS.
- **Hero cycling**: EffectHero has `next`/`prev` callbacks and dot navigation, but NO auto-advance timer. The hero only changes when the user clicks. FAIL — need to add a 5s interval timer.
- **Hero sample scope**: page.tsx passes only `HOVER_EFFECTS` to EffectHero. The hero should cycle through a representative sample of ALL effects (both hover and entrance). FAIL — need to pass ALL_EFFECTS or a curated sample.
- **WebGL cleanup**: particle-text.tsx cleanup function (lines 285-296) correctly calls cancelAnimationFrame, removeEventListener, renderer.dispose(), geometry.dispose(), material.dispose(), and removeChild. PASS.
- **Effect detail pages**: effect-preview.tsx correctly passes hoverMode/entranceMode based on effect.kind. PASS.
- **Copy button**: Generates correct code snippets — entrance effects get `hoverMode="dissolve"` + `entranceMode="<slug>"`, hover effects get `hoverMode="<slug>"`. PASS.

### Plan
1. Add auto-advance timer to EffectHero (5s interval, pause on user interaction)
2. Pass ALL_EFFECTS to hero so it cycles through both hover and entrance effects
3. Run tsc + build, fix any errors
4. Commit and push
