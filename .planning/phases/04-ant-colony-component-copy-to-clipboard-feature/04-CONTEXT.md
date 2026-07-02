# Phase 4: Ant Colony Component & Copy-to-Clipboard Feature - Context

**Gathered:** 2025-06-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Two deliverables:
1. **Ant Colony Component** — Upgrade the existing AntText component from dot particles to realistic ant-shaped sprites with pheromone trails, crawling behavior, and auto-cycling word formation.
2. **Copy-to-Clipboard Feature** — Add a "Copy code" button to every demo section (West Wing, East Wing, Salon, Terminal, Colony) that copies the full standalone component source code to the user's clipboard.

</domain>

<decisions>
## Implementation Decisions

### Ant Rendering
- **D-01:** Texture atlas sprites — pre-rendered ant PNG/sprite sheet with animated legs, rotated by movement direction. Most realistic approach.
- **D-02:** Ants should rotate to face their movement direction (heading angle)
- **D-03:** Sprite sheet should include multiple leg-animation frames for crawling animation

### Ant Behavior
- **D-04:** Pheromone trails — ants leave fading trails that other ants follow, creating organic colony paths between words
- **D-05:** Trails should be visible as faint gold/amber lines that fade over time
- **D-06:** Three-phase cycle maintained: forming → holding → dispersing → next word

### Copy-to-Clipboard Feature
- **D-07:** All demo sections get a copy button — West Wing, East Wing, Salon, Terminal, Colony
- **D-08:** Copied code is the full standalone component — complete self-contained code with all imports, ready to paste into any project
- **D-09:** Reuse existing CodeBlock component's copy pattern (navigator.clipboard.writeText with fallback)
- **D-10:** Copy button should be styled consistently with existing UI (gold border, monospace, appears on hover or always visible)

### Claude's Discretion
- Ant sprite sheet generation approach (procedural canvas generation vs pre-made PNG)
- Number of ant animation frames in sprite sheet
- Pheromone trail rendering technique (separate canvas layer vs shader)
- Exact placement of copy button within each section header
- How component source code is stored/read (raw imports, inline strings, or file reads)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Components
- `src/components/ant-text.tsx` — Current AntText component (dot particles, to be upgraded)
- `src/components/code-block.tsx` — Existing CodeBlock with copy-to-clipboard + syntax highlighting
- `src/components/particle-painting.tsx` — Three.js particle rendering pattern (WebGL, shader material)
- `src/components/particle-text.tsx` — Core ParticleText component pattern
- `src/components/ascii-art.tsx` — Terminal-style component pattern
- `src/components/effect-cards.tsx` — Gallery card pattern with section headers

### Page Structure
- `src/app/page.tsx` — Main page with all sections (West Wing, East Wing, Salon, Terminal, Colony, Footer)
- `src/components/nav-rail.tsx` — Navigation entries for each section

### Styling
- `src/app/globals.css` — Theme variables, painting-frame, terminal-window, gold-pill classes

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **CodeBlock component** (`src/components/code-block.tsx`): Already has copy-to-clipboard with fallback, syntax highlighting, and styled copy button. Can be reused or its copy pattern extracted.
- **ParticlePainting** (`src/components/particle-painting.tsx`): Three.js WebGL renderer setup, shader material with points, animation loop pattern. AntText already follows this pattern.
- **AntText** (`src/components/ant-text.tsx`): Current implementation with 6000 dot particles, word sampling via offscreen canvas, three-phase cycle (forming/holding/dispersing). Needs sprite upgrade + pheromone trails.

### Established Patterns
- Three.js components create canvas imperatively, dispose on unmount
- IntersectionObserver for in-view detection (debounced 300ms)
- ShaderMaterial with custom vertex/fragment shaders
- Terminal-window styling for showcase components
- Section headers with gold label + brushstroke-divider + title + description + pill badge

### Integration Points
- Each section in `page.tsx` has a section header div — copy button goes there
- AntText component needs sprite texture loading added to Three.js setup
- Pheromone trails need a separate rendering layer (either second canvas or shader approach)

</code_context>

<specifics>
## Specific Ideas

- Ants should look like real ants — body segments, legs that animate while crawling
- Pheromone trails create the visual effect of a colony converging — trails between ants form paths
- This is a UI Lab — users should be able to copy any component and use it in their own projects
- Copy button should be per-section, giving users the component code for that specific demo

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 4-Ant Colony Component & Copy-to-Clipboard Feature*
*Context gathered: 2025-06-30*
