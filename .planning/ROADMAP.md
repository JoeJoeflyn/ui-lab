# Roadmap: UI Lab Particle Effects

## Overview

Take the gallery from 8/50 hover effects (0 entrance) to the full 125-effect spec. Work proceeds in three phases: complete the hover effect GLSL registry, add the entrance animation system, then polish the gallery so every card is a live composite preview.

## Phases

- [ ] **Phase 1: Hover Effects Completion** — Implement the remaining 42 hover effects as GLSL branches
- [ ] **Phase 2: Entrance Effects** — Implement all 75 entrance effects (origin + progress mix)
- [ ] **Phase 3: Gallery Polish** — Make every card composite, fix UI issues

## Phase Details

### Phase 1: Hover Effects Completion
**Goal**: All 50 hover effects have working GLSL implementations and render live in cards
**Depends on**: Nothing (baseline exists — 8 effects done)
**Requirements**: REQ-01, REQ-04, REQ-05
**Success Criteria** (what must be TRUE):
  1. `EFFECT_IDS` contains all 50 hover slugs with unique int IDs
  2. `displace()` has a GLSL branch for every effect ID
  3. `IMPLEMENTED_EFFECTS` lists all 50 hover slugs
  4. `npx tsc --noEmit` passes
  5. Every hover effect card shows a live `ParticleText` preview (no "coming soon" badge for hover)
**Plans**: 6 plans (batched by category)

Plans (batched by hover category from the spec):
- [ ] 01-01: Scatter family — ripple, shatter, confetti, spiralout, wind (5 effects; dissolve/explode/glitch done)
- [ ] 01-02: Attract family — spiral, drain, assemble, magnetize (4 effects; vortex/magnet/blackhole done)
- [ ] 01-03: Wave family — pulse, echo, bounce, lightning (4 effects; wave done)
- [ ] 01-04: Transform family — shake, inflate, gravity, liquid, bokeh, stretch, breathing, morph, parallax, twist, flatten, pinch, slice (13 effects)
- [ ] 01-05: Ambient family — tornado, matrix, constellation, lens, orbit, quantum, static, sand, bubbles, comet, ink (11 effects; ember done)
- [ ] 01-06: Visual family — vanish, hueshift, cloak, mirror, scaleup (5 effects)

### Phase 2: Entrance Effects
**Goal**: All 75 entrance effects animate particles from an origin to their text target
**Depends on**: Phase 1
**Requirements**: REQ-02, REQ-04, REQ-05
**Success Criteria** (what must be TRUE):
  1. Vertex shader supports `uEntranceMode` + `uProgress` with origin/target mix
  2. All 75 entrance slugs have GLSL branches
  3. `ParticleText` accepts an `entrance` prop and replays on change
  4. `npx tsc --noEmit` passes
**Plans**: 6 plans (batched by entrance category)

Plans:
- [ ] 02-01: Direction family (12 effects: rise-up … diverge)
- [ ] 02-02: Wave family (12 effects: wave-right … spiral-reveal)
- [ ] 02-03: Easing family (9 effects: power3-out … linear)
- [ ] 02-04: Morph family (9 effects: morph-sphere … morph-wave)
- [ ] 02-05: Physics family (7 effects: gravity-settle … magnetic-snap)
- [ ] 02-06: Special family (26 effects: explode-inward … ink-spread)

### Phase 3: Gallery Polish
**Goal**: Every effect card is a live composite preview; UI issues resolved
**Depends on**: Phase 2
**Requirements**: REQ-03
**Success Criteria** (what must be TRUE):
  1. No placeholder text cards remain — all use `ParticleText`
  2. Hero exhibit cycles through a representative sample
  3. No console errors / WebGL context leaks across navigation
**Plans**: 1 plan

Plans:
- [ ] 03-01: Convert all placeholder cards to composite previews + final QA
