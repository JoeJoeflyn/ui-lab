/**
 * Effect catalog — single source of truth for the gallery.
 * Generated from PARTICLE_EFFECTS.md (the design spec at repo root).
 * Slugs match the `HoverMode` / `EntranceMode` union in the spec's Library API.
 */

export type EffectKind = "hover" | "entrance";

export type EffectCategory =
  | "scatter"
  | "attract"
  | "wave"
  | "transform"
  | "ambient"
  | "visual"
  | "direction"
  | "easing"
  | "morph"
  | "physics"
  | "special";

/** Slugs that have working GLSL implementations (see glsl-effects.ts). */
export const IMPLEMENTED_EFFECTS = new Set([
  "dissolve",
  "explode",
  "vortex",
  "magnet",
  "wave",
  "glitch",
  "blackhole",
  "ember",
]);

export interface Effect {
  /** URL slug — matches the union member in the spec API */
  slug: string;
  /** Display name */
  name: string;
  kind: EffectKind;
  category: EffectCategory;
  /** One-line feel description from the spec */
  feel: string;
  /** Whether this effect has a working GLSL implementation */
  implemented: boolean;
  /** Key GLSL technique (short) */
  technique: string;
  /** Spec section number for cross-reference */
  specRef: string;
}

export const HOVER_CATEGORIES: Record<
  Exclude<EffectCategory, "direction" | "easing" | "morph" | "physics" | "special">,
  string
> = {
  scatter: "Scatter",
  attract: "Attract",
  wave: "Wave",
  transform: "Transform",
  ambient: "Ambient / Scene",
  visual: "Visual",
};

export const ENTRANCE_CATEGORIES: Record<
  "direction" | "wave" | "easing" | "morph" | "physics" | "special",
  string
> = {
  direction: "Direction",
  wave: "Wave",
  easing: "Easing",
  morph: "Morph",
  physics: "Physics",
  special: "Special",
};

export const HOVER_EFFECTS: Effect[] = [
  { slug: "dissolve", name: "Dissolve", kind: "hover", implemented: true, category: "scatter", feel: "Text breaking apart into dust", technique: "Angular scatter + noise jitter", specRef: "§1" },
  { slug: "magnet", name: "Magnet + Burst", kind: "hover", implemented: true, category: "attract", feel: "Magnetic attraction that periodically detonates", technique: "sin phase pull/burst cycle", specRef: "§2" },
  { slug: "ripple", name: "Ripple", kind: "hover", implemented: false, category: "wave", feel: "Water ripples, stone drop, concentric expansion", technique: "Outgoing sin wave, perpendicular displacement", specRef: "§3" },
  { slug: "vanish", name: "Fade Vanish", kind: "hover", implemented: false, category: "visual", feel: "Ghosting, invisibility, fading away", technique: "Alpha fade only", specRef: "§4" },
  { slug: "vortex", name: "Vortex", kind: "hover", implemented: true, category: "attract", feel: "Whirlpool, tornado, centrifugal spin", technique: "Orbit at current distance", specRef: "§5" },
  { slug: "explode", name: "Explode", kind: "hover", implemented: true, category: "scatter", feel: "Explosion, detonation, shrapnel", technique: "Strong radial push + glow spike", specRef: "§6" },
  { slug: "shake", name: "Shake", kind: "hover", implemented: false, category: "transform", feel: "Earthquake, vibration, trembling", technique: "High-freq sin with per-particle phase", specRef: "§7" },
  { slug: "blackhole", name: "Black Hole", kind: "hover", implemented: true, category: "attract", feel: "Black hole, gravity well, singularity", technique: "Pull inward + shrink point size", specRef: "§8" },
  { slug: "wave", name: "Wave", kind: "hover", implemented: true, category: "wave", feel: "Flag waving, fabric ripple, sine motion", technique: "Perpendicular sine displacement", specRef: "§9" },
  { slug: "shatter", name: "Shatter", kind: "hover", implemented: false, category: "scatter", feel: "Glass shatter, breaking, fragmentation", technique: "Hash-based random direction per particle", specRef: "§10" },
  { slug: "inflate", name: "Inflate", kind: "hover", implemented: false, category: "transform", feel: "Balloon inflating, expansion, swelling", technique: "Uniform outward expansion + z-push", specRef: "§11" },
  { slug: "gravity", name: "Gravity", kind: "hover", implemented: false, category: "transform", feel: "Gravity, falling, dropping", technique: "Fall down + horizontal sway", specRef: "§12" },
  { slug: "lightning", name: "Lightning", kind: "hover", implemented: false, category: "wave", feel: "Electric arc, tesla coil, glitch", technique: "Multiplied high-freq sines + flicker glow", specRef: "§13" },
  { slug: "liquid", name: "Liquid", kind: "hover", implemented: false, category: "transform", feel: "Water parting, laminar flow, viscous fluid", technique: "Tangent flow with side sign", specRef: "§14" },
  { slug: "glitch", name: "Glitch", kind: "hover", implemented: true, category: "scatter", feel: "VHS tracking, datamosh, corrupted data", technique: "Quantized time steps + teleport offsets", specRef: "§15" },
  { slug: "bokeh", name: "Bokeh", kind: "hover", implemented: false, category: "transform", feel: "Camera focus pull, depth of field, dreamy blur", technique: "Z-depth push + alpha fade", specRef: "§16" },
  { slug: "pulse", name: "Pulse", kind: "hover", implemented: false, category: "wave", feel: "Heartbeat, breathing, organic rhythm", technique: "Sharp heartbeat curve + glow pulse", specRef: "§17" },
  { slug: "spiral", name: "Spiral", kind: "hover", implemented: false, category: "attract", feel: "Galaxy, nebula, fibonacci spiral", technique: "Two-arm spiral with distance wrap", specRef: "§18" },
  { slug: "echo", name: "Echo", kind: "hover", implemented: false, category: "wave", feel: "Motion blur, afterimage, stroboscopic echo", technique: "Oscillating time-based offsets + ghosting", specRef: "§19" },
  { slug: "tornado", name: "Tornado", kind: "hover", implemented: false, category: "ambient", feel: "Tornado, dust devil, vertical vortex", technique: "Twist angle by height + shrinking radius", specRef: "§20" },
  { slug: "ember", name: "Ember", kind: "hover", implemented: true, category: "ambient", feel: "Campfire, sparks, hot ash rising", technique: "Rise + flicker drift + intense glow", specRef: "§21" },
  { slug: "matrix", name: "Matrix", kind: "hover", implemented: false, category: "ambient", feel: "Matrix digital rain, cascading code", technique: "Quantized columns + cyclic fall + leading edge", specRef: "§22" },
  { slug: "constellation", name: "Constellation", kind: "hover", implemented: false, category: "ambient", feel: "Starry night, twinkling stars, celestial map", technique: "Twinkle sines + glow pulse, no displacement", specRef: "§23" },
  { slug: "lens", name: "Lens", kind: "hover", implemented: false, category: "ambient", feel: "Magnifying glass, lens distortion, refraction", technique: "Magnify inside ring + edge glow", specRef: "§24" },
  { slug: "drain", name: "Drain", kind: "hover", implemented: false, category: "attract", feel: "Drain, whirlpool, toilet flush", technique: "Fast rotation + shrinking radius + sink z", specRef: "§25" },
  { slug: "confetti", name: "Confetti", kind: "hover", implemented: false, category: "scatter", feel: "Confetti, celebration, party popper", technique: "Hash scatter + gravity + random brightness", specRef: "§26" },
  { slug: "assemble", name: "Assemble", kind: "hover", implemented: false, category: "attract", feel: "Assembling, gathering, magnetic convergence", technique: "Mix to cursor + orbital offset", specRef: "§27" },
  { slug: "stretch", name: "Stretch", kind: "hover", implemented: false, category: "transform", feel: "Taffy pull, elastic stretch, rubber band", technique: "Pull along home-to-cursor direction", specRef: "§28" },
  { slug: "breathing", name: "Breathing", kind: "hover", implemented: false, category: "transform", feel: "Breathing, meditation, organic pulse", technique: "Slow 0..1 cycle + outward expansion", specRef: "§29" },
  { slug: "quantum", name: "Quantum", kind: "hover", implemented: false, category: "ambient", feel: "Quantum superposition, teleportation, uncertainty", technique: "Discrete time steps + random teleport + mask", specRef: "§30" },
  { slug: "magnetize", name: "Magnetize", kind: "hover", implemented: false, category: "attract", feel: "Magnetic alignment, crystallization, lattice snap", technique: "Snap to grid lattice + intersection glow", specRef: "§31" },
  { slug: "orbit", name: "Orbit", kind: "hover", implemented: false, category: "ambient", feel: "Planetary orbit, satellite, stable rotation", technique: "Stable circular orbit at current distance", specRef: "§32" },
  { slug: "spiralout", name: "Spiral Out", kind: "hover", implemented: false, category: "scatter", feel: "Expansion, flower bloom, outward spiral", technique: "Spiral with growing radius", specRef: "§33" },
  { slug: "hueshift", name: "Hue Shift", kind: "hover", implemented: false, category: "visual", feel: "Rainbow, color cycling, chromatic shift", technique: "RGB sine cycle mixed by strength", specRef: "§34" },
  { slug: "parallax", name: "Parallax", kind: "hover", implemented: false, category: "transform", feel: "Depth of field, 3D parallax, z-space push", technique: "Z-depth push + xy shift + fade", specRef: "§35" },
  { slug: "bounce", name: "Bounce", kind: "hover", implemented: false, category: "wave", feel: "Rubber ball, spring, elastic collision", technique: "Abs sin bounce + glow at peaks", specRef: "§36" },
  { slug: "morph", name: "Morph", kind: "hover", implemented: false, category: "transform", feel: "Shape morphing, text-to-circle, transformation", technique: "Mix to circle positions around cursor", specRef: "§37" },
  { slug: "static", name: "Static", kind: "hover", implemented: false, category: "ambient", feel: "TV static, white noise, signal lost", technique: "Hash-based random on all 3 axes", specRef: "§38" },
  { slug: "cloak", name: "Cloak", kind: "hover", implemented: false, category: "visual", feel: "Invisibility, cloaking, ghosting", technique: "Full alpha fade + slight scatter, no glow", specRef: "§39" },
  { slug: "slice", name: "Slice", kind: "hover", implemented: false, category: "transform", feel: "Slicing, cutting, text cleaving in two", technique: "Top/bottom split + opposite slides + gap glow", specRef: "§40" },
  { slug: "mirror", name: "Mirror", kind: "hover", implemented: false, category: "visual", feel: "Mirror reflection, symmetry, kaleidoscope", technique: "Reflect offset through cursor", specRef: "§41" },
  { slug: "sand", name: "Sand", kind: "hover", implemented: false, category: "ambient", feel: "Hourglass, sand timer, granular flow", technique: "Accelerated fall + horizontal pile spread", specRef: "§42" },
  { slug: "bubbles", name: "Bubbles", kind: "hover", implemented: false, category: "ambient", feel: "Bubbles, effervescence, carbonation", technique: "Rise + wobble + soft pulse glow", specRef: "§43" },
  { slug: "pinch", name: "Pinch", kind: "hover", implemented: false, category: "transform", feel: "Pinch, squeeze, accordion compression", technique: "Pull to horizontal line + expand outward", specRef: "§44" },
  { slug: "twist", name: "Twist", kind: "hover", implemented: false, category: "transform", feel: "Wringing, twisting, torsion", technique: "Rotation by height around vertical axis", specRef: "§45" },
  { slug: "comet", name: "Comet", kind: "hover", implemented: false, category: "ambient", feel: "Comet tail, motion trail, streak", technique: "Trail behind cursor velocity + head glow", specRef: "§46" },
  { slug: "flatten", name: "Flatten", kind: "hover", implemented: false, category: "transform", feel: "Flattening, squishing, pancake", technique: "Compress vertically + expand horizontally + z-push", specRef: "§47" },
  { slug: "ink", name: "Ink", kind: "hover", implemented: false, category: "ambient", feel: "Ink in water, diffusion, bleeding", technique: "Slow turbulent flow + dark intense glow", specRef: "§48" },
  { slug: "wind", name: "Wind", kind: "hover", implemented: false, category: "scatter", feel: "Wind, gust, blowing, drift", technique: "Slowly rotating wind dir + turbulence", specRef: "§49" },
  { slug: "scaleup", name: "Scale Up", kind: "hover", implemented: false, category: "visual", feel: "Magnification, emphasis, zoom in", technique: "Point size scales up to 5x, no displacement", specRef: "§50" },
];

export const ENTRANCE_EFFECTS: Effect[] = [
  // Direction (1-12)
  { slug: "rise-up", name: "Rise up", kind: "entrance", implemented: false, category: "direction", feel: "Particles rise from below into position", technique: "origin.y = target.y - offset, mix with ease", specRef: "#1" },
  { slug: "fall-down", name: "Fall down", kind: "entrance", implemented: false, category: "direction", feel: "Particles fall from above into position", technique: "origin.y = target.y + offset, gravity-like ease", specRef: "#2" },
  { slug: "slide-left", name: "Slide left", kind: "entrance", implemented: false, category: "direction", feel: "Particles slide in from the right edge", technique: "origin.x = target.x + canvasW, linear ease", specRef: "#3" },
  { slug: "slide-right", name: "Slide right", kind: "entrance", implemented: false, category: "direction", feel: "Particles slide in from the left edge", technique: "origin.x = target.x - canvasW", specRef: "#4" },
  { slug: "slide-up", name: "Slide up", kind: "entrance", implemented: false, category: "direction", feel: "Particles slide in from the bottom", technique: "origin.y = target.y - canvasH", specRef: "#5" },
  { slug: "slide-down", name: "Slide down", kind: "entrance", implemented: false, category: "direction", feel: "Particles slide in from the top", technique: "origin.y = target.y + canvasH", specRef: "#6" },
  { slug: "diagonal-tl", name: "Diagonal TL", kind: "entrance", implemented: false, category: "direction", feel: "Particles slide in from top-left corner", technique: "origin.x -= W, origin.y += H", specRef: "#7" },
  { slug: "diagonal-tr", name: "Diagonal TR", kind: "entrance", implemented: false, category: "direction", feel: "Particles slide in from top-right corner", technique: "origin.x += W, origin.y += H", specRef: "#8" },
  { slug: "diagonal-bl", name: "Diagonal BL", kind: "entrance", implemented: false, category: "direction", feel: "Particles slide in from bottom-left", technique: "origin.x -= W, origin.y -= H", specRef: "#9" },
  { slug: "diagonal-br", name: "Diagonal BR", kind: "entrance", implemented: false, category: "direction", feel: "Particles slide in from bottom-right", technique: "origin.x += W, origin.y -= H", specRef: "#10" },
  { slug: "converge", name: "Converge", kind: "entrance", implemented: false, category: "direction", feel: "Particles converge from all screen edges", technique: "origin = edge nearest to target", specRef: "#11" },
  { slug: "diverge", name: "Diverge", kind: "entrance", implemented: false, category: "direction", feel: "Particles start at center, diverge outward to targets", technique: "origin = center, mix to target", specRef: "#12" },
  // Wave (13-24)
  { slug: "wave-right", name: "Wave right", kind: "entrance", implemented: false, category: "wave", feel: "Left-to-right wave reveal", technique: "delay = xNorm * 0.5, smoothstep front", specRef: "#13" },
  { slug: "wave-left", name: "Wave left", kind: "entrance", implemented: false, category: "wave", feel: "Right-to-left wave reveal", technique: "delay = (1.0 - xNorm) * 0.5", specRef: "#14" },
  { slug: "wave-up", name: "Wave up", kind: "entrance", implemented: false, category: "wave", feel: "Bottom-to-top wave reveal", technique: "delay = yNorm * 0.5", specRef: "#15" },
  { slug: "wave-down", name: "Wave down", kind: "entrance", implemented: false, category: "wave", feel: "Top-to-bottom wave reveal", technique: "delay = (1.0 - yNorm) * 0.5", specRef: "#16" },
  { slug: "radial-bloom", name: "Radial bloom", kind: "entrance", implemented: false, category: "wave", feel: "Center-out Gaussian wave expands", technique: "delay = distFromCenter / maxR * 0.5", specRef: "#17" },
  { slug: "radial-implode", name: "Radial implode", kind: "entrance", implemented: false, category: "wave", feel: "Outside-in — wave contracts from edges to center", technique: "delay = (1.0 - dist/maxR) * 0.5", specRef: "#18" },
  { slug: "circular-reveal", name: "Circular reveal", kind: "entrance", implemented: false, category: "wave", feel: "Expanding circle mask from center", technique: "if dist < progress * maxR: show", specRef: "#19" },
  { slug: "diamond-reveal", name: "Diamond reveal", kind: "entrance", implemented: false, category: "wave", feel: "Expanding diamond (Manhattan distance) mask", technique: "if |dx|+|dy| < progress * maxR: show", specRef: "#20" },
  { slug: "diagonal-wave", name: "Diagonal wave", kind: "entrance", implemented: false, category: "wave", feel: "Top-left to bottom-right diagonal sweep", technique: "delay = (xNorm + yNorm) * 0.25", specRef: "#21" },
  { slug: "anti-diagonal-wave", name: "Anti-diagonal wave", kind: "entrance", implemented: false, category: "wave", feel: "Top-right to bottom-left sweep", technique: "delay = ((1-xNorm) + yNorm) * 0.25", specRef: "#22" },
  { slug: "sine-wave", name: "Sine wave", kind: "entrance", implemented: false, category: "wave", feel: "Wavy left-to-right reveal (zigzag front)", technique: "delay = (xNorm + sin(yNorm * 5.0) * 0.1) * 0.5", specRef: "#23" },
  { slug: "spiral-reveal", name: "Spiral reveal", kind: "entrance", implemented: false, category: "wave", feel: "Spiral arm rotates outward from center", technique: "delay = (angle + dist * k) / total", specRef: "#24" },
  // Easing (25-33)
  { slug: "power3-out", name: "Power3 out", kind: "entrance", implemented: false, category: "easing", feel: "Sharp deceleration (current default)", technique: "ease = 1 - (1-t)^3", specRef: "#25" },
  { slug: "power5-out", name: "Power5 out", kind: "entrance", implemented: false, category: "easing", feel: "Even sharper deceleration", technique: "ease = 1 - (1-t)^5", specRef: "#26" },
  { slug: "expo-out", name: "Expo out", kind: "entrance", implemented: false, category: "easing", feel: "Exponential deceleration", technique: "ease = 1 - pow(2, -10 * t)", specRef: "#27" },
  { slug: "sine-out", name: "Sine out", kind: "entrance", implemented: false, category: "easing", feel: "Gentle sine deceleration", technique: "ease = sin(t * PI / 2)", specRef: "#28" },
  { slug: "back-out", name: "Back out", kind: "entrance", implemented: false, category: "easing", feel: "Overshoot then settle back", technique: "ease = 1 + 2.7 * pow(t-1, 3) + 1.7 * pow(t-1, 2)", specRef: "#29" },
  { slug: "elastic-out", name: "Elastic out", kind: "entrance", implemented: false, category: "easing", feel: "Bouncy spring with oscillation", technique: "ease = sin(t * PI * 3) * pow(2, -10*t)", specRef: "#30" },
  { slug: "bounce-out", name: "Bounce out", kind: "entrance", implemented: false, category: "easing", feel: "Multiple bounces", technique: "Piecewise: ease = bounce(t)", specRef: "#31" },
  { slug: "circ-out", name: "Circ out", kind: "entrance", implemented: false, category: "easing", feel: "Circular deceleration", technique: "ease = sqrt(1 - pow(1-t, 2))", specRef: "#32" },
  { slug: "linear", name: "Linear", kind: "entrance", implemented: false, category: "easing", feel: "Constant speed", technique: "ease = t", specRef: "#33" },
  // Morph (34-42)
  { slug: "morph-sphere", name: "Morph sphere", kind: "entrance", implemented: false, category: "morph", feel: "Particles start on a sphere, morph to text", technique: "origin = sphere(angle, phi)", specRef: "#34" },
  { slug: "morph-cube", name: "Morph cube", kind: "entrance", implemented: false, category: "morph", feel: "Particles start on a cube surface", technique: "origin = cubeFace(face, uv)", specRef: "#35" },
  { slug: "morph-grid", name: "Morph grid", kind: "entrance", implemented: false, category: "morph", feel: "Particles start on a grid lattice", technique: "origin = floor(random * grid) * cell", specRef: "#36" },
  { slug: "morph-circle", name: "Morph circle", kind: "entrance", implemented: false, category: "morph", feel: "Particles start on a circle ring", technique: "origin = circle(angle, radius)", specRef: "#37" },
  { slug: "morph-line", name: "Morph line", kind: "entrance", implemented: false, category: "morph", feel: "Particles start on a line", technique: "origin = line(t, axis)", specRef: "#38" },
  { slug: "morph-cloud", name: "Morph cloud", kind: "entrance", implemented: false, category: "morph", feel: "Particles start as a random cloud", technique: "origin = random * spread", specRef: "#39" },
  { slug: "morph-spiral", name: "Morph spiral", kind: "entrance", implemented: false, category: "morph", feel: "Particles start on a spiral", technique: "origin = spiral(angle, r)", specRef: "#40" },
  { slug: "morph-torus", name: "Morph torus", kind: "entrance", implemented: false, category: "morph", feel: "Particles start on a torus", technique: "origin = torus(u, v)", specRef: "#41" },
  { slug: "morph-wave", name: "Morph wave", kind: "entrance", implemented: false, category: "morph", feel: "Particles start on a wave surface", technique: "origin = wave(x, y, t)", specRef: "#42" },
  // Physics (43-49)
  { slug: "gravity-settle", name: "Gravity settle", kind: "entrance", implemented: false, category: "physics", feel: "Particles fall with gravity, bounce, settle", technique: "y -= g*t, bounce on ground", specRef: "#43" },
  { slug: "rain", name: "Rain", kind: "entrance", implemented: false, category: "physics", feel: "Particles fall like rain with slight drift", technique: "y -= fast, x += sin(t + phase) * drift", specRef: "#44" },
  { slug: "snow", name: "Snow", kind: "entrance", implemented: false, category: "physics", feel: "Particles drift down gently with wobble", technique: "y -= slow, x += sin(t + phase) * wobble", specRef: "#45" },
  { slug: "ascend", name: "Ascend", kind: "entrance", implemented: false, category: "physics", feel: "Particles float upward with slight wobble", technique: "y += rise, x += sin(t) * drift", specRef: "#46" },
  { slug: "smoke", name: "Smoke", kind: "entrance", implemented: false, category: "physics", feel: "Particles drift upward with turbulence", technique: "y += slow, x += noise(t, phase) * turbulence", specRef: "#47" },
  { slug: "ember-rise", name: "Ember rise", kind: "entrance", implemented: false, category: "physics", feel: "Particles float up with flickering glow", technique: "y += rise, glow flicker during ascent", specRef: "#48" },
  { slug: "magnetic-snap", name: "Magnetic snap", kind: "entrance", implemented: false, category: "physics", feel: "Particles pulled magnetically to targets with overshoot", technique: "Spring physics: pos += (target - pos) * k", specRef: "#49" },
  // Special (50-75)
  { slug: "explode-inward", name: "Explode inward", kind: "entrance", implemented: false, category: "special", feel: "Particles start scattered, implode to targets", technique: "origin = random * 3W, mix inward", specRef: "#50" },
  { slug: "starburst", name: "Starburst", kind: "entrance", implemented: false, category: "special", feel: "Particles burst from center outward then settle", technique: "origin = center, expand past target, settle", specRef: "#51" },
  { slug: "fireworks", name: "Fireworks", kind: "entrance", implemented: false, category: "special", feel: "Multiple burst points, particles fly to targets", technique: "origin = burstPoint + random * burst", specRef: "#52" },
  { slug: "vortex-in", name: "Vortex in", kind: "entrance", implemented: false, category: "special", feel: "Particles spiral inward from outer ring", technique: "origin = spiral(angle, maxR)", specRef: "#53" },
  { slug: "tornado-in", name: "Tornado in", kind: "entrance", implemented: false, category: "special", feel: "Particles twist down/up into position", technique: "origin = spiral + heightOffset", specRef: "#54" },
  { slug: "orbit-in", name: "Orbit in", kind: "entrance", implemented: false, category: "special", feel: "Particles orbit center, then spiral into targets", technique: "angle = t * speed, r = lerp(maxR, dist, ease)", specRef: "#55" },
  { slug: "scatter-gather", name: "Scatter gather", kind: "entrance", implemented: false, category: "special", feel: "Particles scatter outward then gather back", technique: "Phase 1: expand, Phase 2: contract to target", specRef: "#56" },
  { slug: "teleport", name: "Teleport", kind: "entrance", implemented: false, category: "special", feel: "Particles blink in sequentially at full opacity", technique: "if t > delay: alpha = 1, no movement", specRef: "#57" },
  { slug: "quantum-assemble", name: "Quantum assemble", kind: "entrance", implemented: false, category: "special", feel: "Particles blink in at random quantum times", technique: "delay = random * duration, instant appear", specRef: "#58" },
  { slug: "pixelate", name: "Pixelate in", kind: "entrance", implemented: false, category: "special", feel: "Particles start blocky/quantized, smooth to text", technique: "origin = floor(target / gridSize) * gridSize", specRef: "#59" },
  { slug: "dissolve-in", name: "Dissolve in", kind: "entrance", implemented: false, category: "special", feel: "Particles materialize from noise pattern", technique: "alpha = noise(target.xy, t) > threshold", specRef: "#60" },
  { slug: "materialize", name: "Materialize", kind: "entrance", implemented: false, category: "special", feel: "Particles fade in with slight scatter, then settle", technique: "alpha = ease, pos = target + scatter * (1-ease)", specRef: "#61" },
  { slug: "blur-in", name: "Blur in", kind: "entrance", implemented: false, category: "special", feel: "Particles start with large z-spread, focus to plane", technique: "origin.z = random * spread, mix z to 0", specRef: "#62" },
  { slug: "scale-up", name: "Scale up", kind: "entrance", implemented: false, category: "special", feel: "Particles start at 0 size, grow to full size", technique: "pointSize = uSize * ease, no movement", specRef: "#63" },
  { slug: "scale-down", name: "Scale down", kind: "entrance", implemented: false, category: "special", feel: "Particles start huge, shrink to normal size", technique: "pointSize = uSize * (1 + (1-ease) * 10)", specRef: "#64" },
  { slug: "flip-x", name: "Flip X", kind: "entrance", implemented: false, category: "special", feel: "Particles rotate in on X axis (3D flip)", technique: "angleX = (1-ease) * PI, pos.z = sin(angle) * depth", specRef: "#65" },
  { slug: "flip-y", name: "Flip Y", kind: "entrance", implemented: false, category: "special", feel: "Particles rotate in on Y axis (3D flip)", technique: "angleY = (1-ease) * PI, pos.x += sin(angle) * depth", specRef: "#66" },
  { slug: "cascade", name: "Cascade", kind: "entrance", implemented: false, category: "special", feel: "Particles cascade in like dominoes falling", technique: "delay = i / count * duration, sequential", specRef: "#67" },
  { slug: "liquid-flow", name: "Liquid flow", kind: "entrance", implemented: false, category: "special", feel: "Particles flow in like liquid, viscous motion", technique: "origin = offscreen, pos = origin + flow(t)", specRef: "#68" },
  { slug: "constellation-form", name: "Constellation form", kind: "entrance", implemented: false, category: "special", feel: "Stars twinkle in sequentially, then connect", technique: "delay = random, alpha = twinkle(t, delay)", specRef: "#69" },
  { slug: "typewriter", name: "Typewriter", kind: "entrance", implemented: false, category: "special", feel: "Letter-by-letter reveal", technique: "delay = charIndex * charDelay, per-letter", specRef: "#70" },
  { slug: "curtain-open", name: "Curtain open", kind: "entrance", implemented: false, category: "special", feel: "Particles split from center, open like curtains", technique: "origin.x = target.x ± (W/2 * (1-ease))", specRef: "#71" },
  { slug: "venetian-blinds", name: "Venetian blinds", kind: "entrance", implemented: false, category: "special", feel: "Particles appear in horizontal strips sequentially", technique: "delay = floor(yNorm * strips) / strips", specRef: "#72" },
  { slug: "scanline", name: "Scanline", kind: "entrance", implemented: false, category: "special", feel: "Particles appear following a scanning line", technique: "delay = yNorm, bright scanline at y = progress", specRef: "#73" },
  { slug: "glitch-assemble", name: "Glitch assemble", kind: "entrance", implemented: false, category: "special", feel: "Particles glitch in with random offsets then settle", technique: "origin = target + glitch, glitch decreases with t", specRef: "#74" },
  { slug: "ink-spread", name: "Ink spread", kind: "entrance", implemented: false, category: "special", feel: "Particles spread from a point like ink in water", technique: "origin = point, r = ease * dist, turbulent", specRef: "#75" },
];

export const ALL_EFFECTS: Effect[] = [...HOVER_EFFECTS, ...ENTRANCE_EFFECTS];

export function getEffectBySlug(slug: string): Effect | undefined {
  return ALL_EFFECTS.find((e) => e.slug === slug);
}

export function groupByCategory<T extends Effect>(effects: T[]): Record<string, T[]> {
  return effects.reduce<Record<string, T[]>>((acc, e) => {
    (acc[e.category] ??= []).push(e);
    return acc;
  }, {});
}
