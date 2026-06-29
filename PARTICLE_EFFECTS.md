# Particle Animation Effects — Reference for Library Design

A taxonomy of GPU shader-based particle effects, categorized by behavior pattern.
All effects operate on a point cloud where each particle has a target position
(text-sampled) and responds to cursor proximity via a falloff function.

---

## Core Architecture

### Particle Attributes

Each particle carries the following attributes (GLSL `attribute` / JS `BufferAttribute`):

| Attribute | Type | Description |
|-----------|------|-------------|
| `aTarget` | `vec3` | Home position sampled from text glyph coverage |
| `aOrigin` | `vec3` | Entrance animation start position |
| `aPhase`  | `float` | Per-particle random seed (0–1) for variation |
| `aSpeed`  | `float` | Per-particle speed multiplier (0–1) |

### Uniforms

| Uniform | Type | Description |
|---------|------|-------------|
| `uTime` | `float` | Elapsed time (seconds) |
| `uCursor` | `vec2` | Cursor position in canvas space |
| `uCursorStrength` | `float` | Smoothed cursor presence (0–1) |
| `uCursorRadius` | `float` | Hover influence radius (px) |
| `uHoverMode` | `int` | Active hover effect ID (0–49) |
| `uEntranceMode` | `int` | Active entrance animation ID (0–74) |
| `uProgress` | `float` | Entrance animation progress (0–1) |
| `uSize` | `float` | Base particle point size |
| `uPixelRatio` | `float` | Device pixel ratio |
| `uCameraZ` | `float` | Camera z-position for perspective |
| `uCanvasW` | `float` | Canvas width (for slide/diagonal entrances) |

---

## Falloff Functions

| Name | Formula | Shape | Feel |
|------|---------|-------|------|
| **Gaussian** | `exp(-(d/sigma)^2)` | Soft circle | Natural, organic |
| **Linear** | `1 - d / R` | Circle | Simple, predictable |
| **Smoothstep** | `smoothstep(R, 0, d)` | Soft circle | Slightly harder edge than Gaussian |
| **Manhattan** | `1 - (|dx|+|dy|) / R` | Diamond | Sharp tech aesthetic |
| **Chebyshev** | `1 - max(|dx|,|dy|) / R` | Square | Blocky, geometric |

### Entrance Animations

#### Direction Family — particles enter from a specific direction

| # | Name | Description | Key technique |
|---|------|-------------|---------------|
| 1 | **Rise up** | Particles rise from below into position | `origin.y = target.y - offset`, `mix` with ease |
| 2 | **Fall down** | Particles fall from above into position | `origin.y = target.y + offset`, gravity-like ease |
| 3 | **Slide left** | Particles slide in from the right edge | `origin.x = target.x + canvasW`, linear ease |
| 4 | **Slide right** | Particles slide in from the left edge | `origin.x = target.x - canvasW` |
| 5 | **Slide up** | Particles slide in from the bottom | `origin.y = target.y - canvasH` |
| 6 | **Slide down** | Particles slide in from the top | `origin.y = target.y + canvasH` |
| 7 | **Diagonal TL** | Particles slide in from top-left corner | `origin.x -= W`, `origin.y += H` |
| 8 | **Diagonal TR** | Particles slide in from top-right corner | `origin.x += W`, `origin.y += H` |
| 9 | **Diagonal BL** | Particles slide in from bottom-left | `origin.x -= W`, `origin.y -= H` |
| 10 | **Diagonal BR** | Particles slide in from bottom-right | `origin.x += W`, `origin.y -= H` |
| 11 | **Converge** | Particles converge from all screen edges | `origin = edge nearest to target` |
| 12 | **Diverge** | Particles start at center, diverge outward to targets | `origin = center`, `mix` to target |

#### Wave Family — sequential reveal with a propagating front

| # | Name | Description | Key technique |
|---|------|-------------|---------------|
| 13 | **Wave right** | Left-to-right wave reveal | `delay = xNorm * 0.5`, smoothstep front |
| 14 | **Wave left** | Right-to-left wave reveal | `delay = (1.0 - xNorm) * 0.5` |
| 15 | **Wave up** | Bottom-to-top wave reveal | `delay = yNorm * 0.5` |
| 16 | **Wave down** | Top-to-bottom wave reveal | `delay = (1.0 - yNorm) * 0.5` |
| 17 | **Radial bloom** | Center-out Gaussian wave expands | `delay = distFromCenter / maxR * 0.5` |
| 18 | **Radial implode** | Outside-in — wave contracts from edges to center | `delay = (1.0 - dist/maxR) * 0.5` |
| 19 | **Circular reveal** | Expanding circle mask from center | `if dist < progress * maxR: show` |
| 20 | **Diamond reveal** | Expanding diamond (Manhattan distance) mask | `if |dx|+|dy| < progress * maxR: show` |
| 21 | **Diagonal wave** | Top-left to bottom-right diagonal sweep | `delay = (xNorm + yNorm) * 0.25` |
| 22 | **Anti-diagonal wave** | Top-right to bottom-left sweep | `delay = ((1-xNorm) + yNorm) * 0.25` |
| 23 | **Sine wave** | Wavy left-to-right reveal (zigzag front) | `delay = (xNorm + sin(yNorm * 5.0) * 0.1) * 0.5` |
| 24 | **Spiral reveal** | Spiral arm rotates outward from center | `delay = (angle + dist * k) / total` |

#### Easing Family — same fly-in direction, different easing curves

| # | Name | Description | Key technique |
|---|------|-------------|---------------|
| 25 | **Power3 out** | Sharp deceleration (current default) | `ease = 1 - (1-t)^3` |
| 26 | **Power5 out** | Even sharper deceleration | `ease = 1 - (1-t)^5` |
| 27 | **Expo out** | Exponential deceleration | `ease = 1 - pow(2, -10 * t)` |
| 28 | **Sine out** | Gentle sine deceleration | `ease = sin(t * PI / 2)` |
| 29 | **Back out** | Overshoot then settle back | `ease = 1 + 2.7 * pow(t-1, 3) + 1.7 * pow(t-1, 2)` |
| 30 | **Elastic out** | Bouncy spring with oscillation | `ease = sin(t * PI * 3) * pow(2, -10*t)` |
| 31 | **Bounce out** | Multiple bounces | Piecewise: `ease = bounce(t)` |
| 32 | **Circ out** | Circular deceleration | `ease = sqrt(1 - pow(1-t, 2))` |
| 33 | **Linear** | Constant speed | `ease = t` |

#### Morph Family — particles start from a geometric shape

| # | Name | Description | Key technique |
|---|------|-------------|---------------|
| 34 | **Morph sphere** | Particles start on a sphere, morph to text | `origin = sphere(angle, phi)` |
| 35 | **Morph cube** | Particles start on a cube surface | `origin = cubeFace(face, uv)` |
| 36 | **Morph grid** | Particles start on a grid lattice | `origin = floor(random * grid) * cell` |
| 37 | **Morph circle** | Particles start on a circle ring | `origin = circle(angle, radius)` |
| 38 | **Morph line** | Particles start on a line | `origin = line(t, axis)` |
| 39 | **Morph cloud** | Particles start as a random cloud | `origin = random * spread` |
| 40 | **Morph spiral** | Particles start on a spiral | `origin = spiral(angle, r)` |
| 41 | **Morph torus** | Particles start on a torus | `origin = torus(u, v)` |
| 42 | **Morph wave** | Particles start on a wave surface | `origin = wave(x, y, t)` |

#### Physics Family — particles obey physical motion

| # | Name | Description | Key technique |
|---|------|-------------|---------------|
| 43 | **Gravity settle** | Particles fall with gravity, bounce, settle | `y -= g*t`, bounce on ground |
| 44 | **Rain** | Particles fall like rain with slight drift | `y -= fast`, `x += sin(t + phase) * drift` |
| 45 | **Snow** | Particles drift down gently with wobble | `y -= slow`, `x += sin(t + phase) * wobble` |
| 46 | **Ascend** | Particles float upward with slight wobble | `y += rise`, `x += sin(t) * drift` |
| 47 | **Smoke** | Particles drift upward with turbulence | `y += slow`, `x += noise(t, phase) * turbulence` |
| 48 | **Ember rise** | Particles float up with flickering glow | `y += rise`, glow flicker during ascent |
| 49 | **Magnetic snap** | Particles pulled magnetically to targets with overshoot | Spring physics: `pos += (target - pos) * k`, overshoot |

#### Special Family — unique reveal patterns

| # | Name | Description | Key technique |
|---|------|-------------|---------------|
| 50 | **Explode inward** | Particles start scattered, implode to targets | `origin = random * 3W`, `mix` inward |
| 51 | **Starburst** | Particles burst from center outward then settle | `origin = center`, expand past target, settle back |
| 52 | **Fireworks** | Multiple burst points, particles fly to targets | `origin = burstPoint + random * burst`, `mix` |
| 53 | **Vortex in** | Particles spiral inward from outer ring | `origin = spiral(angle, maxR)`, spiral to target |
| 54 | **Tornado in** | Particles twist down/up into position | `origin = spiral + heightOffset`, twist decreases |
| 55 | **Orbit in** | Particles orbit center, then spiral into targets | `angle = t * speed`, `r = lerp(maxR, dist, ease)` |
| 56 | **Scatter gather** | Particles scatter outward then gather back | Phase 1: expand, Phase 2: contract to target |
| 57 | **Teleport** | Particles blink in sequentially at full opacity | `if t > delay: alpha = 1`, no movement |
| 58 | **Quantum assemble** | Particles blink in at random quantum times | `delay = random * duration`, instant appear |
| 59 | **Pixelate in** | Particles start blocky/quantized, smooth to text | `origin = floor(target / gridSize) * gridSize`, `mix` |
| 60 | **Dissolve in** | Particles materialize from noise pattern | `alpha = noise(target.xy, t) > threshold` |
| 61 | **Materialize** | Particles fade in with slight scatter, then settle | `alpha = ease`, `pos = target + scatter * (1-ease)` |
| 62 | **Blur in** | Particles start with large z-spread, focus to plane | `origin.z = random * spread`, `mix` z to 0 |
| 63 | **Scale up** | Particles start at 0 size, grow to full size | `pointSize = uSize * ease`, no movement |
| 64 | **Scale down** | Particles start huge, shrink to normal size | `pointSize = uSize * (1 + (1-ease) * 10)` |
| 65 | **Flip X** | Particles rotate in on X axis (3D flip) | `angleX = (1-ease) * PI`, `pos.z = sin(angle) * depth` |
| 66 | **Flip Y** | Particles rotate in on Y axis (3D flip) | `angleY = (1-ease) * PI`, `pos.x += sin(angle) * depth` |
| 67 | **Cascade** | Particles cascade in like dominoes falling | `delay = i / count * duration`, sequential |
| 68 | **Liquid flow** | Particles flow in like liquid, viscous motion | `origin = offscreen`, `pos = origin + flow(t)` |
| 69 | **Constellation form** | Stars twinkle in sequentially, then connect | `delay = random`, `alpha = twinkle(t, delay)` |
| 70 | **Typewriter** | Letter-by-letter reveal | `delay = charIndex * charDelay`, per-letter |
| 71 | **Curtain open** | Particles split from center, open like curtains | `origin.x = target.x ± (W/2 * (1-ease))` |
| 72 | **Venetian blinds** | Particles appear in horizontal strips sequentially | `delay = floor(yNorm * strips) / strips` |
| 73 | **Scanline** | Particles appear following a scanning line | `delay = yNorm`, bright scanline at `y = progress` |
| 74 | **Glitch assemble** | Particles glitch in with random offsets then settle | `origin = target + glitch`, glitch decreases with t |
| 75 | **Ink spread** | Particles spread from a point like ink in water | `origin = point`, `r = ease * dist`, turbulent |

---

## Hover/Interaction Effects

### 1. Dissolve
Particles scatter in chaotic directions and disintegrate.
- Angular scatter: `atan(dir) + phase * 3.0` — each particle flies in a unique direction
- Noise jitter: time-varying `sin/cos` displacement adds organic chaos
- Feel: text breaking apart into dust

### 2. Magnet + Burst
Particles get sucked into cursor, then explode outward in a pulsing cycle.
- `phase = sin(time * 3.0 + particleSeed * 6.28)`
- Pull: `-strength * radius * (0.5 + 0.5 * phase)` (negative = toward cursor)
- Burst: `+strength * radius * (0.5 - 0.5 * phase)` (positive = away)
- Feel: magnetic attraction that periodically detonates

### 3. Ripple
Concentric waves ripple outward from cursor like a stone in water.
- `wave = sin(dist * 0.1 - time * 4.0)` — outgoing wave
- Displacement perpendicular to cursor direction
- Feel: water ripples, stone drop, concentric expansion

### 4. Fade Vanish
Particles near cursor disappear — smooth alpha fade.
- `hoverFade = 1.0 - strength` — full alpha fade
- No displacement, just visibility
- Feel: ghosting, invisibility, fading away

### 5. Vortex
Particles swirl around cursor in a spinning vortex.
- `angle = atan(dir) + time * 3.0` — rotation over time
- `pos = cursor + cos/sin(angle) * dist` — orbit at current distance
- Feel: whirlpool, tornado, centrifugal spin

### 6. Explode
Violent burst outward in all directions from cursor.
- `pos += dir * strength * radius * 5.0` — strong radial push
- Glow spike at burst center
- Feel: explosion, detonation, shrapnel

### 7. Shake
Rapid vibration/trembling near cursor.
- `shake = sin(time * 30.0 + phase * 20.0) * strength * radius * 0.3`
- Random per-particle frequency via phase
- Feel: earthquake, vibration, trembling

### 8. Black Hole
Suck particles in and shrink them — gravitational collapse.
- `pos -= dir * strength * radius * 3.0` — pull toward cursor
- `pointSize *= (1.0 - strength * 0.7)` — shrink
- Feel: black hole, gravity well, singularity

### 9. Wave
Perpendicular sine wave displacement — text ripples like a flag.
- `wave = sin(dist * 0.08 + time * 3.0) * strength * radius`
- Displacement perpendicular to cursor direction
- Feel: flag waving, fabric ripple, sine motion

### 10. Shatter
Glass breaking — each particle gets a unique hash-based random direction.
- `shatterDir = hash(phase) * 2.0 - 1.0` — random direction per particle
- Strong outward push with rotation
- Feel: glass shatter, breaking, fragmentation

### 11. Inflate
Balloon expansion — particles push outward from text center.
- Uniform expansion: `pos += dir * strength * radius * 2.0`
- Slight z-push for depth
- Feel: balloon inflating, expansion, swelling

### 12. Gravity
Particles fall downward with slight horizontal sway.
- `pos.y -= strength * radius * 3.0` — fall down
- `pos.x += sin(time * 2.0 + phase * 10.0) * strength * radius * 0.3` — sway
- Feel: gravity, falling, dropping

### 13. Lightning
Jagged electric arcs — high-frequency multiplied sines.
- `jx = sin(time * 20.0 + phase * 30.0) * sin(time * 7.0 + speed * 15.0)`
- Creates chaotic, non-repeating jagged motion
- Flickering glow: `vGlow = strength * (0.5 + 0.5 * abs(jx))`
- Feel: electric arc, tesla coil, glitch

### 14. Liquid
Fluid flow around cursor — particles part like water around an object.
- `tangent = vec2(-dir.y, dir.x)` — perpendicular flow direction
- `side = sign(dir.x)` — flow direction depends on which side of cursor
- `pos += tangent * curve * side`
- Feel: water parting, laminar flow, viscous fluid

### 15. Glitch
Digital artifacts — particles snap to quantized positions in blocky chunks.
- `glitchSeed = floor(time * 8.0 + phase * 5.0)` — discrete time steps
- `glitchMask = step(0.6, fract(seed * 0.3 + phase))` — only some particles glitch
- Random teleport offsets based on seed, RGB-split z offset
- Feel: VHS tracking, datamosh, corrupted data

### 16. Bokeh
Defocus blur — push particles far in z-depth, spread outward, fade.
- `pos.z += strength * radius * 8.0` — recede into distance
- `hoverFade = 1.0 - strength * 0.5` — blur transparency
- Feel: camera focus pull, depth of field, dreamy blur

### 17. Pulse
Rhythmic heartbeat expansion and contraction.
- `beat = sin(time * 4.0) * 0.5 + 0.5`
- `pulse = pow(beat, 3.0)` — sharp heartbeat curve (quick expansion, slow relaxation)
- Glow pulses with the beat
- Feel: heartbeat, breathing, organic rhythm

### 18. Spiral
Galactic spiral arms emanating from cursor.
- `armAngle = (dist / radius) * 3.0 + time * 1.5` — spiral wraps with distance
- Two-arm spiral: `armOffset = step(0.5, phase) * PI` — particles choose arm
- Feel: galaxy, nebula, fibonacci spiral

### 19. Echo
Ghost copies trail behind — particles offset in time-based patterns.
- `echo1 = sin(time * 3.0 + phase * 6.28)` — oscillating offset
- `echo2 = cos(time * 2.0 + speed * 6.28)` — secondary offset
- Ghosting fade reduces alpha for trailing effect
- Feel: motion blur, afterimage, stroboscopic echo

### 20. Tornado
Vertical twisting column around cursor — particles spiral upward.
- `twistAngle = atan(dir) + time * 3.0 + pos.y * 0.05` — twist increases with height
- `twistR = dist * (1.0 - strength * 0.5)` — radius shrinks inward
- Column push up in z based on proximity
- Feel: tornado, dust devil, vertical vortex

### 21. Ember
Particles glow and float upward like fire embers with flickering light.
- `pos.y += rise` — particles float up
- Flickering horizontal drift: `sin(time * 5.0 + phase * 20.0)`
- Intense flickering glow: `sin(time * 15.0 + phase * 50.0)` — hot ember pulse
- Feel: campfire, sparks, hot ash rising

### 22. Matrix
Digital rain — particles fall in quantized columns with bright leading edges.
- `colX = floor(pos.x / colWidth) * colWidth` — quantize into columns
- Per-column fall speed: `2.0 + sin(colX * 0.1)` — varies by column
- `fall = mod(time * speed + phase * 5.0, range)` — cyclic fall
- Bright leading edge, dim trail: `lead = 1.0 - fall / range`
- Feel: Matrix digital rain, cascading code

### 23. Constellation
No displacement — particles twinkle and pulse like connected stars.
- `twinkle = sin(time * 2.0 + phase * 25.0)` — slow twinkle
- `twinkle2 = cos(time * 1.3 + speed * 30.0)` — secondary twinkle
- Very slight drift toward cursor, main effect is glow pulsing
- Feel: starry night, twinkling stars, celestial map

### 24. Lens
Magnifying lens — particles pushed outward in a ring, magnification distortion.
- `lensR = radius * 0.7` — lens boundary
- Inside lens: `pos = cursor + dir * dist * (1.0 + strength * 2.0)` — magnify
- Ring glow at lens edge: `exp(-pow(dist - lensR, 2.0) / sigma)`
- Feel: magnifying glass, lens distortion, refraction

### 25. Drain
Swirl down like water going down a drain — spiral inward and sink.
- `drainAngle = atan(dir) + time * 5.0` — fast rotation
- `drainR = dist * (1.0 - strength * 0.7)` — radius shrinks
- `pos.z -= strength * radius * 3.0` — sink down
- Fade as particles drain: `hoverFade = 1.0 - strength * 0.4`
- Feel: drain, whirlpool, toilet flush

### 26. Confetti
Colorful celebration burst with gravity — particles scatter then fall.
- Random scatter: `sin(phase * 95.31) * cos(speed * 52.77)` — hash-based
- Gravity pulls down after burst: `pos.y -= strength * radius * 2.0 * (1.0 - strength)`
- Random brightness per particle: `0.3 + phase * 0.7`
- Feel: confetti, celebration, party popper

### 27. Assemble
Reverse scatter — particles converge toward cursor from their positions.
- `pos.xy = mix(pos.xy, uCursor, strength * 0.8)` — pull toward cursor
- Orbital offset prevents collapse to single point: `cos/sin(phase * 6.28) * 0.3`
- Feel: assembling, gathering, magnetic convergence

### 28. Stretch
Pull text like taffy — particles stretch in the direction from home to cursor.
- `stretchDir = normalize(uCursor - aTarget.xy)` — direction from home to cursor
- `pos.xy += stretchDir * stretch` — pull in that direction
- Z compression for thinning effect
- Feel: taffy pull, elastic stretch, rubber band

### 29. Breathing
Slow organic scale pulse — meditative expansion and contraction.
- `breath = sin(time * 1.5) * 0.5 + 0.5` — slow 0..1 cycle
- Expand outward from home: `pos += (pos - aTarget) * breath * 0.5`
- Soft glow that breathes with the cycle
- Feel: breathing, meditation, organic pulse

### 30. Quantum
Particles teleport between random positions — discrete quantum leaps.
- `qSeed = floor(time * 3.0 + phase * 7.0)` — discrete time steps
- Random offset per seed: `sin(qSeed * 12.9898 + phase * 78.233)`
- Jump mask: only some particles teleport each step
- Flickering glow during teleport
- Feel: quantum superposition, particle teleportation, uncertainty

### 31. Magnetize
Snap particles to a grid lattice near cursor.
- `gridSize = radius * 0.4` — grid spacing
- `snapped = floor((pos + cursor) / gridSize) * gridSize - cursor`
- `pos = mix(pos, snapped + cursor, strength * 0.9)` — pull to grid
- Grid glow — brighter at intersections
- Feel: magnetic alignment, crystallization, lattice snap

### 32. Orbit
Stable circular orbit — particles circle cursor at their current distance.
- `orbitSpeed = 1.5 + speed * 1.0` — per-particle speed variation
- `orbitAngle = atan(dir) + time * orbitSpeed`
- `pos = cursor + cos/sin(angle) * dist` — maintain distance
- Feel: planetary orbit, satellite, stable rotation

### 33. Spiral Out
Particles spiral outward away from cursor (opposite of drain).
- `outAngle = atan(dir) + time * 2.0`
- `outR = dist + strength * radius * 3.0` — radius grows
- Feel: expansion, flower bloom, outward spiral

### 34. Hue Shift
No displacement — cycle particle colors through rainbow near cursor.
- `hue = dist * 0.02 - time * 0.5 + phase`
- RGB sine cycle: `sin(hue * 6.28)`, `sin(hue * 6.28 + 2.09)`, `sin(hue * 6.28 + 4.19)`
- Mix with original color based on strength
- Feel: rainbow, color cycling, chromatic shift

### 35. Parallax
Push particles into z-depth — creates 3D depth effect.
- `pos.z += strength * radius * 6.0` — recede into screen
- Slight xy shift for parallax offset
- Fade with depth
- Feel: depth of field, 3D parallax, z-space push

### 36. Bounce
Elastic bounce — particles bounce off invisible wall at cursor.
- `bouncePhase = sin(time * 6.0 + phase * 10.0)`
- `bounce = abs(bouncePhase) * strength * radius * 4.0`
- Glow spikes at bounce peaks
- Feel: rubber ball, spring, elastic collision

### 37. Morph
Morph text into a circle near cursor.
- `circleAngle = phase * 6.28` — each particle gets a circle position
- `circlePos = cursor + cos/sin(angle) * radius`
- `pos = mix(pos, circlePos, strength * 0.9)` — morph to circle
- Feel: shape morphing, text-to-circle, transformation

### 38. Static
TV static noise — fully chaotic random jitter (not directional).
- `staticSeed = time * 60.0 + phase * 1000.0`
- Hash-based random: `fract(sin(seed) * 43758.5453) - 0.5`
- Random on all 3 axes, high frequency
- Feel: TV static, white noise, signal lost

### 39. Cloak
Invisibility cloak — particles smoothly fade to transparent near cursor.
- `hoverFade = 1.0 - strength` — full alpha fade
- Slight scatter for cloak edge distortion
- No glow — cloak is dark
- Feel: invisibility, cloaking, ghosting

### 40. Slice
Split text along a horizontal line through cursor — top half slides left, bottom slides right.
- `side = step(cursor.y, pos.y)` — determine top/bottom
- `slideDir = side * 2.0 - 1.0` — +1 above, -1 below
- Gap opens at the slice line with bright glow
- Feel: slicing, cutting, text cleaving in two

### 41. Mirror
Particles mirror their position across the cursor point.
- `mirrored = cursor - toCursor` — flip the offset vector
- `pos = mix(pos, mirrored, strength * 0.9)` — reflect through cursor
- Glow at the mirror axis
- Feel: mirror reflection, symmetry, kaleidoscope

### 42. Sand
Particles fall and pile up at the bottom like sand in an hourglass.
- `pos.y -= fallDist * (0.5 + strength * 0.5)` — accelerated fall
- Pile up: particles below a threshold spread horizontally
- `pos.y = pileY + sin(phase * 31.0) * radius * 0.3` — settle at bottom
- Feel: hourglass, sand timer, granular flow

### 43. Bubbles
Particles rise upward with wobble like bubbles in water.
- `pos.y += rise` — float up
- `pos.x += sin(time * 3.0 + phase * 20.0) * rise * 0.4` — wobble
- Soft pulsing glow
- Feel: bubbles, effervescence, carbonation

### 44. Pinch
Squeeze particles toward a horizontal line through cursor.
- `pos.y = mix(pos.y, lineY, strength * 0.85)` — pull to line
- `pos.x += dir.x * strength * radius * 1.5` — expand outward (volume conservation)
- Bright glow at the pinch line: Gaussian on line distance
- Feel: pinch, squeeze, accordion compression

### 45. Twist
Rotate particles around a vertical axis through cursor — like wringing a towel.
- `twistAngle = strength * PI * (pos.y - cursor.y) / radius` — twist varies with height
- 2D rotation matrix applied to relative position
- `cos/sin(twistAngle)` rotation around cursor
- Feel: wringing, twisting, torsion

### 46. Comet
Particles trail behind cursor direction — stretched trail effect.
- `trailX/Y = sin/cos(time) * radius` — simulated cursor velocity
- `trailFactor = strength * (0.3 + phase * 0.7)` — per-particle trail length
- Brighter at head (near cursor), dimmer in trail
- Feel: comet tail, motion trail, streak

### 47. Flatten
Squish particles flat against the ground plane.
- `pos.y = mix(pos.y, cursor.y, strength * 0.9)` — compress vertically
- `pos.x += dir.x * strength * radius * 3.0` — expand horizontally
- `pos.z -= strength * radius` — push into screen
- Feel: flattening, squishing, pancake

### 48. Ink
Particles bleed outward like ink diffusing in water — slow, organic, turbulent.
- `inkSpeed = time * 0.8 + phase * 3.0` — slow time scale
- `inkX = sin(inkSpeed) * cos(inkSpeed * 1.3 + speed * 5.0)` — turbulent flow
- Dark, intense glow with slow pulse
- Feel: ink in water, diffusion, bleeding

### 49. Wind
Particles blow in a consistent direction, stronger near cursor — with turbulence.
- `windAngle = sin(time * 0.3) * 0.5` — slowly rotating wind direction
- `windDir = vec2(cos(windAngle), sin(windAngle))`
- Turbulence: `sin(time * 2.0 + phase * 20.0) * windForce * 0.15`
- Feel: wind, gust, blowing, drift

### 50. Scale Up
Particles grow larger near cursor with no displacement.
- Point size scales up to 5x based on cursor proximity with Gaussian falloff
- `vHoverScale` varying passes scale factor to fragment shader
- Feel: magnification, emphasis, zoom in

---

## Effect Categories (for library API design)

### Scatter Family
Effects that disperse particles away from a point.
- Dissolve, Explode, Shatter, Vanish, Glitch, Confetti, Spiral Out, Wind

### Attract Family
Effects that pull particles toward a point.
- Magnet, Black Hole, Vortex, Spiral, Assemble, Drain, Magnetize

### Wave Family
Effects that create propagating wave patterns.
- Ripple, Wave, Lightning, Pulse, Echo, Bounce

### Transform Family
Effects that change particle state/behavior.
- Freeze, Shake, Inflate, Gravity, Liquid, Bokeh, Stretch, Breathing, Morph, Parallax, Twist, Flatten, Pinch, Slice

### Ambient/Scene Family
Effects that create scene-level atmosphere rather than text distortion.
- Tornado, Ember, Matrix, Constellation, Lens, Orbit, Quantum, Static, Sand, Bubbles, Comet, Ink

### Visual Family
Effects that change appearance without displacement.
- Hue Shift, Cloak, Mirror, Scale Up

---

## Library API Suggestion

```typescript
interface ParticleTextProps {
  // Content
  text: string;
  gradientPart?: string;

  // Particles
  particleCount?: number;
  fontSize?: number;
  weight?: number;

  // Colors (linear RGB 0–1)
  color?: [number, number, number];
  gradientFrom?: [number, number, number];
  gradientTo?: [number, number, number];

  // Interaction
  hoverMode: HoverMode;
  cursorRadius?: number;
  falloff?: "gaussian" | "linear" | "smoothstep" | "manhattan" | "chebyshev";

  // Entrance
  entrance?: EntranceMode;
  entranceDuration?: number;
  triggerOnScroll?: boolean; // IntersectionObserver

  // Layout
  fillContainer?: boolean;
  verticalAlign?: "top" | "center";
}

type HoverMode =
  | "dissolve" | "magnet" | "ripple" | "vanish" | "vortex"
  | "explode" | "shake" | "blackhole" | "wave" | "freeze"
  | "shatter" | "inflate" | "gravity" | "lightning" | "liquid"
  | "glitch" | "bokeh" | "pulse" | "spiral" | "echo"
  | "tornado" | "ember" | "matrix" | "constellation" | "lens"
  | "drain" | "confetti" | "assemble" | "stretch" | "breathing"
  | "quantum" | "magnetize" | "orbit" | "spiralout" | "hueshift"
  | "parallax" | "bounce" | "morph" | "static" | "cloak"
  | "slice" | "mirror" | "sand" | "bubbles" | "pinch"
  | "twist" | "comet" | "flatten" | "ink" | "wind"
  | "scaleup";

type EntranceMode =
  // Direction (1-12)
  | "rise-up" | "fall-down" | "slide-left" | "slide-right"
  | "slide-up" | "slide-down" | "diagonal-tl" | "diagonal-tr"
  | "diagonal-bl" | "diagonal-br" | "converge" | "diverge"
  // Wave (13-24)
  | "wave-right" | "wave-left" | "wave-up" | "wave-down"
  | "radial-bloom" | "radial-implode" | "circular-reveal"
  | "diamond-reveal" | "diagonal-wave" | "anti-diagonal-wave"
  | "sine-wave" | "spiral-reveal"
  // Easing (25-33)
  | "power3-out" | "power5-out" | "expo-out" | "sine-out"
  | "back-out" | "elastic-out" | "bounce-out" | "circ-out"
  | "linear"
  // Morph (34-42)
  | "morph-sphere" | "morph-cube" | "morph-grid" | "morph-circle"
  | "morph-line" | "morph-cloud" | "morph-spiral" | "morph-torus"
  | "morph-wave"
  // Physics (43-49)
  | "gravity-settle" | "rain" | "snow" | "ascend" | "smoke"
  | "ember-rise" | "magnetic-snap"
  // Special (50-75)
  | "explode-inward" | "starburst" | "fireworks" | "vortex-in"
  | "tornado-in" | "orbit-in" | "scatter-gather" | "teleport"
  | "quantum-assemble" | "pixelate" | "dissolve-in" | "materialize"
  | "blur-in" | "scale-up" | "scale-down" | "flip-x" | "flip-y"
  | "cascade" | "liquid-flow" | "constellation-form"
  | "typewriter" | "curtain-open" | "venetian-blinds" | "scanline"
  | "glitch-assemble" | "ink-spread";
```

---

## Key GLSL Techniques

- **Hash randomness**: `fract(sin(seed * 12.9898) * 43758.5453)` — cheap per-particle random
- **Angular scatter**: `atan(dir.y, dir.x) + phase * k` — unique direction per particle
- **Gaussian falloff**: `exp(-pow(dist/sigma, 2.0))` — soft radial influence
- **Orbit math**: `pos = cursor + vec2(cos(angle), sin(angle)) * radius`
- **Perpendicular wave**: `vec2(-dir.y, dir.x)` — 90° rotation of direction vector
- **Cursor smoothing**: `cursorStrength += (target - cursorStrength) * dt * speed` — eased presence
- **Scroll trigger**: `IntersectionObserver` gates `entranceStarted` flag — only animate when visible
- **Mode refs**: `hoverMode` and `entranceMode` stored in `useRef` to avoid scene rebuild on mode change
- **Entrance replay**: `replayEntranceRef` counter increments on mode change → tick loop resets `entranceTime` and `uProgress`

---

## References

- [Codrops particle effects](https://tympanus.net/codrops/)
- [sanprieto kinetic text](https://github.com/sanprieto/kinetic-text-3d)
- [Arknights official site](https://ak.hypergryph.com/#world) — original dot-matrix inspiration
- KamehaDB landing — adapted amber palette variant
