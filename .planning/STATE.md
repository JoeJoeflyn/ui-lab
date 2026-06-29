---
gsd_state_version: '1.0'
status: phase_complete
progress:
  total_phases: 3
  completed_phases: 2
  total_plans: 13
  completed_plans: 12
  percent: 92
---

# Project State

## Project Reference

See: .planning/PROJECT.md

**Core value:** Every effect card renders a live, interactive particle preview via the composite ParticleText component.
**Current focus:** Phase 2 complete — Phase 3 (Gallery Polish) next

## Current Position

Phase: 2 of 3 (Entrance Effects) — COMPLETE
Plan: 12 of 13 in current phase
Status: Phase complete
Last activity: 2025-06-29 — Added 75 entrance effects (uEntranceMode/uProgress + aOrigin/aIndex attributes + applyEntrance if-chain); all entrance cards now live

Progress: [█████████░] 92%

## Phase 1 Tracker

| Plan | Category | Effects | Status |
|------|----------|---------|--------|
| 01-01 | Scatter | ripple, shatter, confetti, spiralout, wind | done |
| 01-02 | Attract | spiral, drain, assemble, magnetize | done |
| 01-03 | Wave | pulse, echo, bounce, lightning | done |
| 01-04 | Transform | shake, inflate, gravity, liquid, bokeh, stretch, breathing, morph, parallax, twist, flatten, pinch, slice | done |
| 01-05 | Ambient | tornado, matrix, constellation, lens, orbit, quantum, static, sand, bubbles, comet, ink | done |
| 01-06 | Visual | vanish, hueshift, cloak, mirror, scaleup | done |

## Phase 2 Tracker

| Plan | Category | Effects | Status |
|------|----------|---------|--------|
| 02-01 | Direction | rise-up, fall-down, slide-left, slide-right, slide-up, slide-down, diagonal-tl, diagonal-tr, diagonal-bl, diagonal-br, converge, diverge | done |
| 02-02 | Wave | wave-right, wave-left, wave-up, wave-down, radial-bloom, radial-implode, circular-reveal, diamond-reveal, diagonal-wave, anti-diagonal-wave, sine-wave, spiral-reveal | done |
| 02-03 | Easing | power3-out, power5-out, expo-out, sine-out, back-out, elastic-out, bounce-out, circ-out, linear | done |
| 02-04 | Morph | morph-sphere, morph-cube, morph-grid, morph-circle, morph-line, morph-cloud, morph-spiral, morph-torus, morph-wave | done |
| 02-05 | Physics | gravity-settle, rain, snow, ascend, smoke, ember-rise, magnetic-snap | done |
| 02-06 | Special | explode-inward, starburst, fireworks, vortex-in, tornado-in, orbit-in, scatter-gather, teleport, quantum-assemble, pixelate, dissolve-in, materialize, blur-in, scale-up, scale-down, flip-x, flip-y, cascade, liquid-flow, constellation-form, typewriter, curtain-open, venetian-blinds, scanline, glitch-assemble, ink-spread | done |

## Notes

- Baseline: 8 hover effects already implemented (dissolve, explode, vortex, magnet, wave, glitch, blackhole, ember)
- All 42 remaining hover effects implemented in a single GLSL expansion pass (Phase 1)
- Phase 2 added uEntranceMode/uProgress uniforms, aOrigin/aIndex attributes, uBounds uniform, applyEntrance() if-chain (75 branches), and entrance props (entranceMode/entrance/entranceLoop) to ParticleText with requestAnimationFrame progress animation
- All 125 effects now implemented: true; gallery cards + detail pages render live entrance previews
