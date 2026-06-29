# UI Lab — GPU Particle Effects Gallery

## What This Is

A Next.js showcase gallery of GPU shader-based particle text effects. Particles are sampled from text glyphs and displaced in real time by a single GLSL vertex shader that dispatches by effect ID. The gallery presents 125 effects (50 hover + 75 entrance) as museum-style "painting" cards.

## Core Value

Every effect card renders a live, interactive particle preview via the composite `ParticleText` component — no static placeholders in the final state.

## Requirements

### Validated

- [x] Text-to-particle sampler (canvas 2D → Float32Array positions)
- [x] Single vertex shader with `uEffect` int dispatch + `displace()` function
- [x] Composite `ParticleText` component (hoverMode prop → GLSL effect)
- [x] 8 hover effects implemented (dissolve, explode, vortex, magnet, wave, glitch, blackhole, ember)
- [x] Effect card gallery with museum framing + hero exhibit

### Active

- [ ] REQ-01: All 50 hover effects implemented as GLSL branches in `displace()`
- [ ] REQ-02: All 75 entrance effects implemented (origin + progress mix in vertex shader)
- [ ] REQ-03: Every effect card uses composite `ParticleText` (no placeholder text)
- [ ] REQ-04: `IMPLEMENTED_EFFECTS` and `EFFECT_IDS` stay in sync with implemented effects
- [ ] REQ-05: `npx tsc --noEmit` passes after each batch

### Out of Scope

- Per-effect falloff curves (uniform uses smoothstep) — reserved uniform, not wired yet
- Mobile touch hover parity — desktop cursor focus for now

## Context

- Spec: `PARTICLE_EFFECTS.md` (repo root) — full taxonomy of all 125 effects with GLSL technique notes
- `src/lib/glsl-effects.ts` — `EFFECT_IDS` map + `VERTEX_SHADER` (one shader, if-chain dispatch) + `FRAGMENT_SHADER`
- `src/lib/effects.ts` — `HOVER_EFFECTS` / `ENTRANCE_EFFECTS` catalogs + `IMPLEMENTED_EFFECTS` set
- `src/components/particle-text.tsx` — composite component, takes `hoverMode: HoverMode`
- `src/components/effect-cards.tsx` — gallery cards render `ParticleText` when `effect.implemented`
- Uses `pnpm`, Three.js, Next 16, React 19, Tailwind v4

## Constraints

- One compiled ShaderMaterial — add effects as `else if (uEffect == N)` branches, not new shaders
- GLSL must stay WebGL1-compatible (no `switch` on int, use if-chain)
- Commit per phase, do NOT push

## Tech Stack

Next.js 16 (turbo) · React 19 · Three.js 0.184 · Tailwind v4 · TypeScript 5.7 · pnpm
