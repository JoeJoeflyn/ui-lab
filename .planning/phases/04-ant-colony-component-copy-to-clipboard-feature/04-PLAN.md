# Phase 4: Ant Colony Component & Copy-to-Clipboard Feature - Plan

**Status:** Ready for execution
**Plans:** 2

## Plan 04-01: Ant Sprite Upgrade with Pheromone Trails

### Tasks
1. Generate ant sprite atlas procedurally on offscreen canvas (body segments + animated legs, 4-8 frames)
2. Load sprite atlas as Three.js texture in AntText component
3. Replace Points rendering with sprite-based rendering (THREE.Points with custom shader using texture atlas, or THREE.InstancedMesh)
4. Add heading rotation — each ant faces its movement direction
5. Add leg animation — cycle through sprite frames based on movement speed
6. Add pheromone trail layer — separate canvas or shader-based trail rendering
7. Trails fade over time, ants follow nearby trails for organic colony paths
8. Verify performance with 6000 ants + trails at 60fps

### Files
- `src/components/ant-text.tsx` — Major rewrite
- `src/lib/ant-sprite.ts` — New: procedural sprite atlas generator

## Plan 04-02: Copy-to-Clipboard on All Demo Sections

### Tasks
1. Create a `CopyButton` component (extracted from CodeBlock pattern)
2. Create a `component-source.ts` utility that reads component source files
3. Add copy button to each section header in page.tsx:
   - West Wing (effect-cards.tsx source)
   - East Wing (effect-cards.tsx source)
   - Salon (artwork-exhibit.tsx source)
   - Terminal (ascii-art.tsx source)
   - Colony (ant-text.tsx source)
4. Copy button copies full standalone component code with all imports
5. Style consistently with existing UI (gold border, monospace, "Copy" / "Copied!" states)

### Files
- `src/components/copy-button.tsx` — New: reusable copy button
- `src/lib/component-source.ts` — New: component source code loader
- `src/app/page.tsx` — Add copy buttons to section headers
