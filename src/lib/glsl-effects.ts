/**
 * GLSL effect registry.
 *
 * Architecture: ONE vertex shader with a `uEffect` uniform int that dispatches
 * to per-effect displacement logic via a switch-style if-chain. This keeps
 * the shader pipeline simple — one ShaderMaterial, one compile — while
 * supporting many effects incrementally.
 *
 * Each effect receives:
 *   - home position (position) — the text-sampled rest position
 *   - cursor position (uCursor)  — in world space
 *   - uStrength (0..1)           — hover intensity, smoothed
 *   - uTime                      — elapsed seconds
 *   - uCursorRadius              — influence radius
 *
 * Returns displaced position via a function `displace()`.
 * Effects may also set the varyings vHoverFade, vHoverScale, vHoverColor,
 * vUseHoverColor to alter alpha / size / color.
 *
 * Adding a new effect:
 *   1. Add an entry to EFFECT_IDS below with a unique int.
 *   2. Add a GLSL branch in the effect shader chunk.
 *   3. Add the slug to the HoverMode type in particle-text.tsx.
 */

export const EFFECT_IDS = {
  // --- Baseline (already implemented) ---
  dissolve: 0,
  explode: 1,
  vortex: 2,
  magnet: 3,
  wave: 4,
  glitch: 5,
  blackhole: 6,
  ember: 7,
  // --- Scatter family ---
  ripple: 8,
  shatter: 9,
  confetti: 10,
  spiralout: 11,
  wind: 12,
  // --- Attract family ---
  spiral: 13,
  drain: 14,
  assemble: 15,
  magnetize: 16,
  // --- Wave family ---
  pulse: 17,
  echo: 18,
  bounce: 19,
  lightning: 20,
  // --- Transform family ---
  shake: 21,
  inflate: 22,
  gravity: 23,
  liquid: 24,
  bokeh: 25,
  stretch: 26,
  breathing: 27,
  morph: 28,
  parallax: 29,
  twist: 30,
  flatten: 31,
  pinch: 32,
  slice: 33,
  // --- Ambient family ---
  tornado: 34,
  matrix: 35,
  constellation: 36,
  lens: 37,
  orbit: 38,
  quantum: 39,
  static: 40,
  sand: 41,
  bubbles: 42,
  comet: 43,
  ink: 44,
  // --- Visual family ---
  vanish: 45,
  hueshift: 46,
  cloak: 47,
  mirror: 48,
  scaleup: 49,
} as const;

export type EffectSlug = keyof typeof EFFECT_IDS;

// --- Entrance effects (Phase 2) — IDs 0..74 keyed by uEntranceMode ---
export const ENTRANCE_EFFECT_IDS = {
  // Direction (0-11)
  "rise-up": 0,
  "fall-down": 1,
  "slide-left": 2,
  "slide-right": 3,
  "slide-up": 4,
  "slide-down": 5,
  "diagonal-tl": 6,
  "diagonal-tr": 7,
  "diagonal-bl": 8,
  "diagonal-br": 9,
  converge: 10,
  diverge: 11,
  // Wave (12-23)
  "wave-right": 12,
  "wave-left": 13,
  "wave-up": 14,
  "wave-down": 15,
  "radial-bloom": 16,
  "radial-implode": 17,
  "circular-reveal": 18,
  "diamond-reveal": 19,
  "diagonal-wave": 20,
  "anti-diagonal-wave": 21,
  "sine-wave": 22,
  "spiral-reveal": 23,
  // Easing (24-32)
  "power3-out": 24,
  "power5-out": 25,
  "expo-out": 26,
  "sine-out": 27,
  "back-out": 28,
  "elastic-out": 29,
  "bounce-out": 30,
  "circ-out": 31,
  linear: 32,
  // Morph (33-41)
  "morph-sphere": 33,
  "morph-cube": 34,
  "morph-grid": 35,
  "morph-circle": 36,
  "morph-line": 37,
  "morph-cloud": 38,
  "morph-spiral": 39,
  "morph-torus": 40,
  "morph-wave": 41,
  // Physics (42-48)
  "gravity-settle": 42,
  rain: 43,
  snow: 44,
  ascend: 45,
  smoke: 46,
  "ember-rise": 47,
  "magnetic-snap": 48,
  // Special (49-74)
  "explode-inward": 49,
  starburst: 50,
  fireworks: 51,
  "vortex-in": 52,
  "tornado-in": 53,
  "orbit-in": 54,
  "scatter-gather": 55,
  teleport: 56,
  "quantum-assemble": 57,
  pixelate: 58,
  "dissolve-in": 59,
  materialize: 60,
  "blur-in": 61,
  "scale-up": 62,
  "scale-down": 63,
  "flip-x": 64,
  "flip-y": 65,
  cascade: 66,
  "liquid-flow": 67,
  "constellation-form": 68,
  typewriter: 69,
  "curtain-open": 70,
  "venetian-blinds": 71,
  scanline: 72,
  "glitch-assemble": 73,
  "ink-spread": 74,
} as const;

export type EntranceEffectSlug = keyof typeof ENTRANCE_EFFECT_IDS;

/** Vertex shader — shared preamble + effect dispatch. */
export const VERTEX_SHADER = /* glsl */ `
  // position is provided by Three.js via geometry.setAttribute("position", …)
  attribute float aSize;       // per-particle base size
  attribute float aRandom;     // per-particle random 0..1 (stable)

  uniform float uTime;
  uniform vec2  uCursor;       // cursor in world space (same coord system as position)
  uniform float uCursorRadius;
  uniform float uStrength;     // 0 = idle, 1 = fully hovered
  uniform float uPixelRatio;
  uniform int   uEffect;       // effect dispatch key (see EFFECT_IDS)

  // --- Entrance animation (Phase 2) ---
  uniform int   uEntranceMode; // entrance dispatch key (see ENTRANCE_EFFECT_IDS), -1 = none
  uniform float uProgress;     // 0..1 entrance progress (linear; per-effect eases it)
  uniform vec2  uBounds;       // half-extents of text bounding box (x, y)

  attribute vec3  aOrigin;     // per-particle random offscreen origin (scatter source)
  attribute float aIndex;      // per-particle normalized index 0..1 (for staggered effects)

  // Entrance state (written by applyEntrance, read in main — not passed to fragment)
  float vEntranceAlpha;
  float vEntranceScale;

  varying float vAlpha;
  varying float vGlow;
  varying float vHoverFade;    // 1.0 default; <1.0 fades particle
  varying float vHoverScale;   // 1.0 default; scales point size
  varying vec3  vHoverColor;   // color override when vUseHoverColor > 0.5
  varying float vUseHoverColor;

  // Distance from cursor with falloff
  float cursorDist() {
    return distance(position.xy, uCursor);
  }

  // Normalized influence 0..1 within cursor radius
  float influence() {
    float d = cursorDist();
    return 1.0 - smoothstep(0.0, uCursorRadius, d);
  }

  // Hash function for pseudo-random per-particle values
  float hash(float n) {
    return fract(sin(n) * 43758.5453123);
  }

  vec2 hash2(float n) {
    return vec2(hash(n), hash(n + 1.7));
  }

  // ---- Easing helpers (entrance) ----
  float easeOutPow(float t, float n) { return 1.0 - pow(1.0 - t, n); }
  float easeExpoOut(float t) { return t >= 1.0 ? 1.0 : 1.0 - pow(2.0, -10.0 * t); }
  float easeSineOut(float t) { return sin(t * 1.5707963); }
  float easeCircOut(float t) { return sqrt(1.0 - pow(1.0 - t, 2.0)); }
  float easeBackOut(float t) {
    float c1 = 1.70158; float c3 = c1 + 1.0;
    return 1.0 + c3 * pow(t - 1.0, 3.0) + c1 * pow(t - 1.0, 2.0);
  }
  float easeElasticOut(float t) {
    if (t <= 0.0) return 0.0; if (t >= 1.0) return 1.0;
    float c4 = 2.0943951;
    return pow(2.0, -10.0 * t) * sin((t * 10.0 - 0.75) * c4) + 1.0;
  }
  float easeBounceOut(float t) {
    float n1 = 7.5625; float d1 = 2.75;
    if (t < 1.0 / d1) return n1 * t * t;
    else if (t < 2.0 / d1) { t -= 1.5 / d1; return n1 * t * t + 0.75; }
    else if (t < 2.5 / d1) { t -= 2.25 / d1; return n1 * t * t + 0.9375; }
    else { t -= 2.625 / d1; return n1 * t * t + 0.984375; }
  }

  // Entrance dispatch — animates particles from an origin to their text target
  // based on uProgress (0..1). Sets vEntranceAlpha (alpha multiplier) and
  // vEntranceScale (point-size multiplier). When uEntranceMode < 0 or progress
  // is 1, returns the target unchanged with full alpha/scale.
  vec3 applyEntrance(vec3 target) {
    vec3 pos = target;
    vEntranceAlpha = 1.0;
    vEntranceScale = 1.0;

    int m = uEntranceMode;
    if (m < 0 || uProgress >= 1.0) return pos;

    float p = uProgress;
    float r = aRandom;
    float W = uBounds.x;
    float H = uBounds.y;
    float maxR = length(uBounds);
    float xNorm = clamp((target.x / max(W, 1.0)) * 0.5 + 0.5, 0.0, 1.0);
    float yNorm = clamp((target.y / max(H, 1.0)) * 0.5 + 0.5, 0.0, 1.0);
    float dist = length(target.xy);
    float ang = atan(target.y, target.x);

    // ===== Direction family (0-11) =====
    if (m == 0) { // rise-up
      float e = easeOutPow(p, 3.0);
      pos = mix(target - vec3(0.0, H * 2.2, 0.0), target, e);
      vEntranceAlpha = smoothstep(0.0, 0.1, p);
    }
    else if (m == 1) { // fall-down
      float e = easeOutPow(p, 3.0);
      pos = mix(target + vec3(0.0, H * 2.2, 0.0), target, e);
      vEntranceAlpha = smoothstep(0.0, 0.1, p);
    }
    else if (m == 2) { // slide-left (enter from right)
      float e = easeOutPow(p, 3.0);
      pos = mix(target + vec3(W * 2.2, 0.0, 0.0), target, e);
      vEntranceAlpha = e;
    }
    else if (m == 3) { // slide-right (enter from left)
      float e = easeOutPow(p, 3.0);
      pos = mix(target - vec3(W * 2.2, 0.0, 0.0), target, e);
      vEntranceAlpha = e;
    }
    else if (m == 4) { // slide-up (enter from bottom)
      float e = p;
      pos = mix(target - vec3(0.0, H * 2.2, 0.0), target, e);
      vEntranceAlpha = e;
    }
    else if (m == 5) { // slide-down (enter from top)
      float e = p;
      pos = mix(target + vec3(0.0, H * 2.2, 0.0), target, e);
      vEntranceAlpha = e;
    }
    else if (m == 6) { // diagonal-tl
      float e = easeOutPow(p, 3.0);
      pos = mix(target + vec3(-W * 2.2, H * 2.2, 0.0), target, e);
      vEntranceAlpha = e;
    }
    else if (m == 7) { // diagonal-tr
      float e = easeOutPow(p, 3.0);
      pos = mix(target + vec3(W * 2.2, H * 2.2, 0.0), target, e);
      vEntranceAlpha = e;
    }
    else if (m == 8) { // diagonal-bl
      float e = easeOutPow(p, 3.0);
      pos = mix(target + vec3(-W * 2.2, -H * 2.2, 0.0), target, e);
      vEntranceAlpha = e;
    }
    else if (m == 9) { // diagonal-br
      float e = easeOutPow(p, 3.0);
      pos = mix(target + vec3(W * 2.2, -H * 2.2, 0.0), target, e);
      vEntranceAlpha = e;
    }
    else if (m == 10) { // converge — from nearest screen edge
      float e = easeOutPow(p, 3.0);
      vec2 d = vec2(target.x >= 0.0 ? W * 2.2 : -W * 2.2, target.y >= 0.0 ? H * 2.2 : -H * 2.2);
      pos = mix(target + vec3(d, 0.0), target, e);
      vEntranceAlpha = e;
    }
    else if (m == 11) { // diverge — from center outward
      float e = easeOutPow(p, 3.0);
      pos = mix(vec3(0.0), target, e);
      vEntranceAlpha = e;
    }

    // ===== Wave family (12-23) =====
    else if (m == 12) { // wave-right
      float delay = xNorm * 0.5;
      float lp = easeOutPow(clamp((p - delay) / 0.5, 0.0, 1.0), 3.0);
      pos = mix(target - vec3(W * 2.2, 0.0, 0.0), target, lp);
      vEntranceAlpha = lp;
    }
    else if (m == 13) { // wave-left
      float delay = (1.0 - xNorm) * 0.5;
      float lp = easeOutPow(clamp((p - delay) / 0.5, 0.0, 1.0), 3.0);
      pos = mix(target + vec3(W * 2.2, 0.0, 0.0), target, lp);
      vEntranceAlpha = lp;
    }
    else if (m == 14) { // wave-up
      float delay = yNorm * 0.5;
      float lp = easeOutPow(clamp((p - delay) / 0.5, 0.0, 1.0), 3.0);
      pos = mix(target - vec3(0.0, H * 2.2, 0.0), target, lp);
      vEntranceAlpha = lp;
    }
    else if (m == 15) { // wave-down
      float delay = (1.0 - yNorm) * 0.5;
      float lp = easeOutPow(clamp((p - delay) / 0.5, 0.0, 1.0), 3.0);
      pos = mix(target + vec3(0.0, H * 2.2, 0.0), target, lp);
      vEntranceAlpha = lp;
    }
    else if (m == 16) { // radial-bloom — center out
      float delay = (dist / maxR) * 0.5;
      float lp = easeOutPow(clamp((p - delay) / 0.5, 0.0, 1.0), 3.0);
      pos = mix(vec3(0.0), target, lp);
      vEntranceAlpha = lp;
    }
    else if (m == 17) { // radial-implode — outside in
      float delay = (1.0 - dist / maxR) * 0.5;
      float lp = easeOutPow(clamp((p - delay) / 0.5, 0.0, 1.0), 3.0);
      vec2 dir = normalize(target.xy + vec2(0.001));
      pos = mix(vec3(dir * maxR * 1.5, 0.0), target, lp);
      vEntranceAlpha = lp;
    }
    else if (m == 18) { // circular-reveal — expanding circle mask
      float reveal = p * maxR * 1.3;
      vEntranceAlpha = 1.0 - smoothstep(reveal - 12.0, reveal + 12.0, dist);
    }
    else if (m == 19) { // diamond-reveal — Manhattan mask
      float manh = abs(target.x) + abs(target.y);
      float reveal = p * maxR * 1.3;
      vEntranceAlpha = 1.0 - smoothstep(reveal - 12.0, reveal + 12.0, manh);
    }
    else if (m == 20) { // diagonal-wave (TL→BR)
      float delay = (xNorm + yNorm) * 0.25;
      float lp = easeOutPow(clamp((p - delay) / 0.5, 0.0, 1.0), 3.0);
      pos = mix(target + vec3(-W * 2.2, H * 2.2, 0.0), target, lp);
      vEntranceAlpha = lp;
    }
    else if (m == 21) { // anti-diagonal-wave (TR→BL)
      float delay = ((1.0 - xNorm) + yNorm) * 0.25;
      float lp = easeOutPow(clamp((p - delay) / 0.5, 0.0, 1.0), 3.0);
      pos = mix(target + vec3(W * 2.2, H * 2.2, 0.0), target, lp);
      vEntranceAlpha = lp;
    }
    else if (m == 22) { // sine-wave — wavy left-to-right front
      float delay = (xNorm + sin(yNorm * 5.0) * 0.1) * 0.5;
      float lp = easeOutPow(clamp((p - delay) / 0.5, 0.0, 1.0), 3.0);
      pos = mix(target - vec3(W * 2.2, 0.0, 0.0), target, lp);
      vEntranceAlpha = lp;
    }
    else if (m == 23) { // spiral-reveal
      float total = 6.28318 + maxR * 0.05;
      float delay = (ang + dist * 0.05) / total * 0.7;
      float lp = easeOutPow(clamp((p - delay) / 0.3, 0.0, 1.0), 3.0);
      float sa = ang + (1.0 - lp) * 6.28318;
      float sr = maxR * 1.4;
      pos = mix(vec3(cos(sa) * sr, sin(sa) * sr, 0.0), target, lp);
      vEntranceAlpha = lp;
    }

    // ===== Easing family (24-32) — rise + fade with named easing =====
    else if (m == 24) { float e = easeOutPow(p, 3.0); pos = mix(target - vec3(0.0, H * 0.5, 0.0), target, e); vEntranceAlpha = e; }
    else if (m == 25) { float e = easeOutPow(p, 5.0); pos = mix(target - vec3(0.0, H * 0.5, 0.0), target, e); vEntranceAlpha = e; }
    else if (m == 26) { float e = easeExpoOut(p); pos = mix(target - vec3(0.0, H * 0.5, 0.0), target, e); vEntranceAlpha = e; }
    else if (m == 27) { float e = easeSineOut(p); pos = mix(target - vec3(0.0, H * 0.5, 0.0), target, e); vEntranceAlpha = e; }
    else if (m == 28) { float e = easeBackOut(p); pos = mix(target - vec3(0.0, H * 0.5, 0.0), target, e); vEntranceAlpha = smoothstep(0.0, 0.1, p); }
    else if (m == 29) { float e = easeElasticOut(p); pos = mix(target - vec3(0.0, H * 0.5, 0.0), target, e); vEntranceAlpha = smoothstep(0.0, 0.1, p); }
    else if (m == 30) { float e = easeBounceOut(p); pos = mix(target - vec3(0.0, H * 0.5, 0.0), target, e); vEntranceAlpha = smoothstep(0.0, 0.1, p); }
    else if (m == 31) { float e = easeCircOut(p); pos = mix(target - vec3(0.0, H * 0.5, 0.0), target, e); vEntranceAlpha = e; }
    else if (m == 32) { float e = p; pos = mix(target - vec3(0.0, H * 0.5, 0.0), target, e); vEntranceAlpha = e; }

    // ===== Morph family (33-41) — start on a shape, morph to text =====
    else if (m == 33) { // morph-sphere
      float e = easeOutPow(p, 3.0);
      float phi = r * 3.14159;
      float theta = r * 6.28318;
      vec3 sph = vec3(cos(theta) * sin(phi), cos(phi), sin(theta) * sin(phi)) * maxR * 0.9;
      pos = mix(sph, target, e); vEntranceAlpha = e;
    }
    else if (m == 34) { // morph-cube
      float e = easeOutPow(p, 3.0);
      float face = floor(r * 6.0);
      vec2 uv = hash2(r * 50.0) * 2.0 - 1.0;
      float s = maxR * 0.8;
      vec3 cube;
      if (face < 1.0) cube = vec3(s, uv.x * s, uv.y * s);
      else if (face < 2.0) cube = vec3(-s, uv.x * s, uv.y * s);
      else if (face < 3.0) cube = vec3(uv.x * s, s, uv.y * s);
      else if (face < 4.0) cube = vec3(uv.x * s, -s, uv.y * s);
      else if (face < 5.0) cube = vec3(uv.x * s, uv.y * s, s);
      else cube = vec3(uv.x * s, uv.y * s, -s);
      pos = mix(cube, target, e); vEntranceAlpha = e;
    }
    else if (m == 35) { // morph-grid
      float e = easeOutPow(p, 3.0);
      float cell = 30.0;
      vec3 grid = vec3(floor(hash(r * 11.0) * 10.0) * cell - 150.0, floor(hash(r * 23.0) * 6.0) * cell - 90.0, 0.0);
      pos = mix(grid, target, e); vEntranceAlpha = e;
    }
    else if (m == 36) { // morph-circle
      float e = easeOutPow(p, 3.0);
      float a = r * 6.28318;
      vec3 circ = vec3(cos(a), sin(a), 0.0) * maxR * 0.9;
      pos = mix(circ, target, e); vEntranceAlpha = e;
    }
    else if (m == 37) { // morph-line
      float e = easeOutPow(p, 3.0);
      vec3 line = vec3((r - 0.5) * W * 2.0, 0.0, 0.0);
      pos = mix(line, target, e); vEntranceAlpha = e;
    }
    else if (m == 38) { // morph-cloud
      float e = easeOutPow(p, 3.0);
      pos = mix(aOrigin, target, e); vEntranceAlpha = e;
    }
    else if (m == 39) { // morph-spiral
      float e = easeOutPow(p, 3.0);
      float a = r * 6.28318 * 3.0;
      float rr = r * maxR;
      vec3 sp = vec3(cos(a) * rr, sin(a) * rr, 0.0);
      pos = mix(sp, target, e); vEntranceAlpha = e;
    }
    else if (m == 40) { // morph-torus
      float e = easeOutPow(p, 3.0);
      float u = r * 6.28318;
      float v = hash(r * 7.0) * 6.28318;
      float R = maxR * 0.7; float rT = maxR * 0.25;
      vec3 tor = vec3((R + rT * cos(v)) * cos(u), (R + rT * cos(v)) * sin(u), rT * sin(v));
      pos = mix(tor, target, e); vEntranceAlpha = e;
    }
    else if (m == 41) { // morph-wave
      float e = easeOutPow(p, 3.0);
      vec3 wv = vec3((r - 0.5) * W * 2.0, sin(r * 10.0) * H * 0.3, cos(r * 8.0) * 60.0);
      pos = mix(wv, target, e); vEntranceAlpha = e;
    }

    // ===== Physics family (42-48) =====
    else if (m == 42) { // gravity-settle
      float e = easeBounceOut(p);
      pos = mix(target + vec3(0.0, H * 2.2, 0.0), target, e);
      vEntranceAlpha = smoothstep(0.0, 0.1, p);
    }
    else if (m == 43) { // rain
      float e = easeOutPow(p, 2.0);
      float startY = H * 2.2 + r * H;
      pos.y = mix(startY, target.y, e);
      pos.x = mix(target.x + sin(r * 20.0) * 40.0, target.x, e);
      vEntranceAlpha = e;
    }
    else if (m == 44) { // snow
      float e = easeOutPow(p, 2.0);
      float startY = H * 2.2 + r * H;
      pos.y = mix(startY, target.y, e);
      pos.x = mix(target.x + sin(p * 6.0 + r * 10.0) * 30.0, target.x, e);
      vEntranceAlpha = e;
    }
    else if (m == 45) { // ascend
      float e = easeOutPow(p, 2.0);
      pos = mix(target - vec3(0.0, H * 2.2, 0.0), target, e);
      pos.x += sin(p * 5.0 + r * 10.0) * 15.0 * (1.0 - e);
      vEntranceAlpha = e;
    }
    else if (m == 46) { // smoke
      float e = easeOutPow(p, 2.0);
      pos = mix(target - vec3(0.0, H * 2.2, 0.0), target, e);
      pos.x += sin(p * 4.0 + r * 20.0) * 25.0 * (1.0 - e);
      pos.z += (1.0 - e) * 40.0;
      vEntranceAlpha = e * 0.85;
    }
    else if (m == 47) { // ember-rise
      float e = easeOutPow(p, 2.0);
      pos = mix(target - vec3(0.0, H * 2.2, 0.0), target, e);
      pos.x += sin(p * 8.0 + r * 15.0) * 12.0 * (1.0 - e);
      vEntranceAlpha = e;
      vEntranceScale = 1.0 + (1.0 - e) * 1.5;
    }
    else if (m == 48) { // magnetic-snap
      float e = easeBackOut(p);
      pos = mix(aOrigin * 0.5, target, e);
      vEntranceAlpha = smoothstep(0.0, 0.15, p);
    }

    // ===== Special family (49-74) =====
    else if (m == 49) { // explode-inward
      float e = easeOutPow(p, 3.0);
      pos = mix(aOrigin * 2.0, target, e);
      vEntranceAlpha = e;
    }
    else if (m == 50) { // starburst — center, overshoot, settle
      float e = easeBackOut(p);
      pos = mix(vec3(0.0), target, e);
      vEntranceAlpha = smoothstep(0.0, 0.1, p);
    }
    else if (m == 51) { // fireworks
      float e = easeOutPow(p, 3.0);
      vec3 burst = aOrigin * 0.8;
      pos = mix(burst, target, e);
      vEntranceAlpha = e * (0.7 + 0.3 * sin(p * 20.0));
    }
    else if (m == 52) { // vortex-in
      float e = easeOutPow(p, 3.0);
      float startR = maxR * 1.5;
      float sa = ang + (1.0 - e) * 12.566;
      pos.x = cos(sa) * mix(startR, dist, e);
      pos.y = sin(sa) * mix(startR, dist, e);
      vEntranceAlpha = e;
    }
    else if (m == 53) { // tornado-in
      float e = easeOutPow(p, 3.0);
      float startR = maxR * 1.5;
      float sa = ang + (1.0 - e) * 18.849;
      pos.x = cos(sa) * mix(startR, dist, e);
      pos.y = sin(sa) * mix(startR, dist, e);
      pos.z = (1.0 - e) * 100.0 * (r - 0.5);
      vEntranceAlpha = e;
    }
    else if (m == 54) { // orbit-in
      float e = easeOutPow(p, 3.0);
      float a = ang + (1.0 - e) * 9.424;
      float rr = mix(maxR * 1.3, dist, e);
      pos.x = cos(a) * rr;
      pos.y = sin(a) * rr;
      vEntranceAlpha = e;
    }
    else if (m == 55) { // scatter-gather — expand past then contract
      vec3 center = vec3(0.0);
      vec3 outPos = mix(center, target, 1.3);
      if (p < 0.5) { pos = mix(center, outPos, p / 0.5); }
      else { pos = mix(outPos, target, (p - 0.5) / 0.5); }
      vEntranceAlpha = smoothstep(0.0, 0.2, p);
    }
    else if (m == 56) { // teleport — sequential blink, no movement
      float delay = aIndex * 0.8;
      vEntranceAlpha = step(delay, p);
    }
    else if (m == 57) { // quantum-assemble — random-time blink
      float delay = r * 0.9;
      vEntranceAlpha = step(delay, p);
    }
    else if (m == 58) { // pixelate — quantized origin smooths to text
      float e = easeOutPow(p, 3.0);
      float g = 24.0;
      vec3 quant = floor(target / g) * g;
      pos = mix(quant, target, e);
      vEntranceAlpha = e;
    }
    else if (m == 59) { // dissolve-in — noise threshold reveal
      float n = hash(r * 100.0 + target.x * 0.1 + target.y * 0.1);
      vEntranceAlpha = step(1.0 - p, n);
    }
    else if (m == 60) { // materialize — fade + settle scatter
      float e = easeOutPow(p, 3.0);
      pos = target + (aOrigin - target) * (1.0 - e) * 0.3;
      vEntranceAlpha = e;
    }
    else if (m == 61) { // blur-in — z-spread focuses to plane
      float e = easeOutPow(p, 3.0);
      pos.z = mix((r - 0.5) * 200.0, 0.0, e);
      vEntranceAlpha = e;
    }
    else if (m == 62) { // scale-up — grow from 0
      vEntranceScale = max(0.001, p);
      vEntranceAlpha = p;
    }
    else if (m == 63) { // scale-down — shrink from huge
      vEntranceScale = 1.0 + (1.0 - p) * 10.0;
      vEntranceAlpha = p;
    }
    else if (m == 64) { // flip-x — 3D flip on X axis
      float e = easeOutPow(p, 3.0);
      float a = (1.0 - e) * 3.14159;
      vEntranceScale = abs(cos(a)) * 0.9 + 0.1;
      pos.z += sin(a) * 80.0;
      vEntranceAlpha = e;
    }
    else if (m == 65) { // flip-y — 3D flip on Y axis
      float e = easeOutPow(p, 3.0);
      float a = (1.0 - e) * 3.14159;
      vEntranceScale = abs(cos(a)) * 0.9 + 0.1;
      pos.x += sin(a) * 40.0;
      vEntranceAlpha = e;
    }
    else if (m == 66) { // cascade — sequential domino fall
      float delay = aIndex * 0.8;
      float lp = clamp((p - delay) / 0.2, 0.0, 1.0);
      pos = mix(target - vec3(0.0, H, 0.0), target, lp);
      vEntranceAlpha = lp;
    }
    else if (m == 67) { // liquid-flow — viscous offscreen flow
      float e = easeOutPow(p, 3.0);
      vec3 off = target + vec3(-W * 2.0, 0.0, 0.0);
      off.y += sin(off.x * 0.02 + p * 5.0) * 30.0;
      pos = mix(off, target, e);
      vEntranceAlpha = e;
    }
    else if (m == 68) { // constellation-form — twinkle in sequentially
      float delay = r * 0.7;
      float lp = clamp((p - delay) / 0.3, 0.0, 1.0);
      vEntranceAlpha = lp * (0.5 + 0.5 * sin(p * 20.0 + r * 30.0));
      vEntranceScale = 1.0 + (1.0 - lp) * 1.5;
    }
    else if (m == 69) { // typewriter — left-to-right letter reveal
      float delay = xNorm * 0.8;
      vEntranceAlpha = step(delay, p);
    }
    else if (m == 70) { // curtain-open — split from center
      float e = easeOutPow(p, 3.0);
      float side = sign(target.x + 0.001);
      pos.x = target.x + side * W * 0.8 * (1.0 - e);
      vEntranceAlpha = e;
    }
    else if (m == 71) { // venetian-blinds — horizontal strips
      float strips = 8.0;
      float band = floor(yNorm * strips) / strips;
      float delay = band * 0.8;
      float lp = clamp((p - delay) / 0.2, 0.0, 1.0);
      pos = mix(target + vec3(0.0, H * 0.3, 0.0), target, lp);
      vEntranceAlpha = lp;
    }
    else if (m == 72) { // scanline — scanning line reveal
      float scanY = mix(-H, H, p);
      vEntranceAlpha = max(smoothstep(40.0, 0.0, abs(target.y - scanY)), step(target.y, scanY));
    }
    else if (m == 73) { // glitch-assemble — random offsets decay
      float e = easeOutPow(p, 3.0);
      vec3 gl = vec3(hash(r * 13.0) - 0.5, hash(r * 27.0) - 0.5, 0.0) * 80.0 * (1.0 - e);
      pos = target + gl;
      vEntranceAlpha = e;
    }
    else if (m == 74) { // ink-spread — spread from center like ink
      float e = easeOutPow(p, 3.0);
      vec2 dir = normalize(target.xy + vec2(0.001));
      float rad = dist * e;
      pos.x = dir.x * rad + sin(p * 10.0 + r * 6.28) * 10.0 * (1.0 - e);
      pos.y = dir.y * rad + cos(p * 10.0 + r * 6.28) * 10.0 * (1.0 - e);
      vEntranceAlpha = e;
    }

    return pos;
  }

  // Main displacement function — dispatches by uEffect.
  // Also sets vHoverFade / vHoverScale / vHoverColor / vUseHoverColor.
  vec3 displace(vec3 home) {
    vec3 pos = home;
    float inf = influence();
    float t = uTime;
    float r = aRandom;
    float strength = uStrength;

    // Defaults for per-effect varyings
    vHoverFade = 1.0;
    vHoverScale = 1.0;
    vUseHoverColor = 0.0;
    vHoverColor = vec3(0.0);

    // Effect 0: dissolve — angular scatter + noise jitter
    if (uEffect == 0) {
      float angle = r * 6.28318;
      float dist = inf * strength * (40.0 + r * 60.0);
      pos.x += cos(angle) * dist;
      pos.y += sin(angle) * dist;
      pos.z += inf * strength * 30.0 * r;
    }

    // Effect 1: explode — strong radial push + glow spike
    else if (uEffect == 1) {
      vec2 dir = normalize(home.xy - uCursor + vec2(0.001));
      float push = inf * strength * (80.0 + r * 120.0);
      pos.x += dir.x * push;
      pos.y += dir.y * push;
      pos.z += r * push * 0.3;
    }

    // Effect 2: vortex — orbit at current distance
    else if (uEffect == 2) {
      vec2 toHome = home.xy - uCursor;
      float dist = length(toHome);
      float angle = atan(toHome.y, toHome.x);
      float orbitSpeed = inf * strength * 3.0;
      float newAngle = angle + orbitSpeed;
      pos.x = uCursor.x + cos(newAngle) * dist;
      pos.y = uCursor.y + sin(newAngle) * dist;
      pos.z += inf * strength * 10.0 * sin(t * 2.0 + r * 6.28);
    }

    // Effect 3: magnet — pull toward cursor + periodic burst
    else if (uEffect == 3) {
      vec2 toCursor = uCursor - home.xy;
      float pull = inf * strength * 0.4;
      float burst = sin(t * 4.0) * 0.5 + 0.5; // 0..1 pulse
      pos.x += toCursor.x * pull * (0.5 + burst * 0.5);
      pos.y += toCursor.y * pull * (0.5 + burst * 0.5);
      pos.z += inf * strength * 20.0 * burst;
    }

    // Effect 4: wave — perpendicular sine displacement
    else if (uEffect == 4) {
      vec2 toHome = home.xy - uCursor;
      float dist = length(toHome);
      float wave = sin(dist * 0.08 - t * 4.0) * inf * strength * 40.0;
      vec2 dir = normalize(toHome + vec2(0.001));
      pos.x += dir.y * wave;
      pos.y -= dir.x * wave;
      pos.z += wave * 0.3;
    }

    // Effect 5: glitch — quantized time steps + teleport offsets
    else if (uEffect == 5) {
      float steps = floor(t * 12.0);
      float glitchSeed = hash(r * 100.0 + steps);
      if (glitchSeed > 0.7) {
        vec2 offset = hash2(r * 50.0 + steps) * 80.0 - 40.0;
        pos.x += offset.x * inf * strength;
        pos.y += offset.y * inf * strength;
      }
      pos.z += glitchSeed * inf * strength * 20.0;
    }

    // Effect 6: blackhole — pull inward + shrink
    else if (uEffect == 6) {
      vec2 toCursor = uCursor - home.xy;
      float pull = inf * strength * 0.6;
      pos.x += toCursor.x * pull;
      pos.y += toCursor.y * pull;
      pos.z -= inf * strength * 50.0; // sink into screen
      vHoverScale = 1.0 - inf * strength * 0.7;
    }

    // Effect 7: ember — rise + flicker drift + glow
    else if (uEffect == 7) {
      float rise = inf * strength * (30.0 + r * 50.0);
      float drift = sin(t * 3.0 + r * 6.28) * 15.0 * inf * strength;
      pos.y += rise;
      pos.x += drift;
      pos.z += r * rise * 0.2;
    }

    // ===== Scatter family =====

    // Effect 8: ripple — concentric outgoing wave, perpendicular displacement
    else if (uEffect == 8) {
      vec2 toHome = home.xy - uCursor;
      float dist = length(toHome);
      float wave = sin(dist * 0.1 - t * 4.0) * inf * strength * 40.0;
      vec2 dir = normalize(toHome + vec2(0.001));
      pos.x += dir.y * wave;
      pos.y -= dir.x * wave;
      pos.z += wave * 0.2;
    }

    // Effect 9: shatter — hash-based random direction per particle
    else if (uEffect == 9) {
      float shatterDir = hash(r * 95.31) * 6.28318;
      float push = inf * strength * (60.0 + r * 100.0);
      pos.x += cos(shatterDir) * push;
      pos.y += sin(shatterDir) * push;
      pos.z += hash(r * 52.77) * push * 0.4;
    }

    // Effect 10: confetti — hash scatter + gravity + random brightness
    else if (uEffect == 10) {
      float scatterX = sin(r * 95.31) * cos(r * 52.77);
      float scatterY = cos(r * 78.23) * sin(r * 31.0);
      float push = inf * strength * 70.0;
      pos.x += scatterX * push;
      pos.y += scatterY * push;
      pos.y -= inf * strength * 60.0 * (1.0 - strength); // gravity after burst
    }

    // Effect 11: spiralout — spiral with growing radius
    else if (uEffect == 11) {
      vec2 toHome = home.xy - uCursor;
      float dist = length(toHome);
      float angle = atan(toHome.y, toHome.x);
      float outR = dist + inf * strength * 90.0;
      float outAngle = angle + t * 2.0;
      pos.x = uCursor.x + cos(outAngle) * outR;
      pos.y = uCursor.y + sin(outAngle) * outR;
    }

    // Effect 12: wind — slowly rotating wind dir + turbulence
    else if (uEffect == 12) {
      float windAngle = sin(t * 0.3) * 0.5;
      vec2 windDir = vec2(cos(windAngle), sin(windAngle));
      float windForce = inf * strength * 80.0;
      float turb = sin(t * 2.0 + r * 20.0) * windForce * 0.15;
      pos.x += windDir.x * windForce + turb;
      pos.y += windDir.y * windForce + turb;
    }

    // ===== Attract family =====

    // Effect 13: spiral — two-arm galactic spiral with distance wrap
    else if (uEffect == 13) {
      vec2 toHome = home.xy - uCursor;
      float dist = length(toHome);
      float angle = atan(toHome.y, toHome.x);
      float armOffset = step(0.5, r) * 3.14159;
      float armAngle = (dist / uCursorRadius) * 3.0 + t * 1.5 + armOffset;
      float spiralR = mix(dist, uCursorRadius * 0.8, inf * strength);
      pos.x = uCursor.x + cos(armAngle) * spiralR;
      pos.y = uCursor.y + sin(armAngle) * spiralR;
    }

    // Effect 14: drain — fast rotation + shrinking radius + sink z
    else if (uEffect == 14) {
      vec2 toHome = home.xy - uCursor;
      float dist = length(toHome);
      float angle = atan(toHome.y, toHome.x) + t * 5.0;
      float drainR = dist * (1.0 - inf * strength * 0.7);
      pos.x = uCursor.x + cos(angle) * drainR;
      pos.y = uCursor.y + sin(angle) * drainR;
      pos.z -= inf * strength * 40.0;
      vHoverFade = 1.0 - inf * strength * 0.4;
    }

    // Effect 15: assemble — converge toward cursor + orbital offset
    else if (uEffect == 15) {
      vec2 toCursor = uCursor - home.xy;
      pos.x += toCursor.x * inf * strength * 0.8;
      pos.y += toCursor.y * inf * strength * 0.8;
      pos.x += cos(r * 6.28) * inf * strength * 12.0;
      pos.y += sin(r * 6.28) * inf * strength * 12.0;
    }

    // Effect 16: magnetize — snap to grid lattice + intersection glow
    else if (uEffect == 16) {
      float gridSize = uCursorRadius * 0.4;
      vec2 snapped = floor((home.xy + uCursor) / gridSize) * gridSize - uCursor;
      pos.x = mix(pos.x, snapped.x, inf * strength * 0.9);
      pos.y = mix(pos.y, snapped.y, inf * strength * 0.9);
    }

    // ===== Wave family =====

    // Effect 17: pulse — sharp heartbeat curve + glow pulse
    else if (uEffect == 17) {
      float beat = sin(t * 4.0) * 0.5 + 0.5;
      float pulse = pow(beat, 3.0);
      vec2 toHome = home.xy - uCursor;
      float dist = length(toHome);
      vec2 dir = normalize(toHome + vec2(0.001));
      pos.x += dir.x * inf * strength * pulse * 50.0;
      pos.y += dir.y * inf * strength * pulse * 50.0;
    }

    // Effect 18: echo — oscillating time-based offsets + ghosting
    else if (uEffect == 18) {
      float echo1 = sin(t * 3.0 + r * 6.28);
      float echo2 = cos(t * 2.0 + r * 6.28);
      pos.x += echo1 * inf * strength * 30.0;
      pos.y += echo2 * inf * strength * 30.0;
      vHoverFade = 1.0 - inf * strength * 0.4;
    }

    // Effect 19: bounce — abs sin bounce + glow at peaks
    else if (uEffect == 19) {
      vec2 toHome = home.xy - uCursor;
      float dist = length(toHome);
      vec2 dir = normalize(toHome + vec2(0.001));
      float bouncePhase = sin(t * 6.0 + r * 10.0);
      float bounce = abs(bouncePhase) * inf * strength * 50.0;
      pos.x += dir.x * bounce;
      pos.y += dir.y * bounce;
    }

    // Effect 20: lightning — multiplied high-freq sines + flicker glow
    else if (uEffect == 20) {
      float jx = sin(t * 20.0 + r * 30.0) * sin(t * 7.0 + r * 15.0);
      float jy = cos(t * 18.0 + r * 25.0) * sin(t * 9.0 + r * 12.0);
      pos.x += jx * inf * strength * 40.0;
      pos.y += jy * inf * strength * 40.0;
    }

    // ===== Transform family =====

    // Effect 21: shake — high-freq sin with per-particle phase
    else if (uEffect == 21) {
      float shake = sin(t * 30.0 + r * 20.0) * inf * strength * 25.0;
      pos.x += shake;
      pos.y += sin(t * 28.0 + r * 24.0) * inf * strength * 25.0;
    }

    // Effect 22: inflate — uniform outward expansion + z-push
    else if (uEffect == 22) {
      vec2 toHome = home.xy - uCursor;
      vec2 dir = normalize(toHome + vec2(0.001));
      pos.x += dir.x * inf * strength * 60.0;
      pos.y += dir.y * inf * strength * 60.0;
      pos.z += inf * strength * 30.0;
    }

    // Effect 23: gravity — fall down + horizontal sway
    else if (uEffect == 23) {
      pos.y -= inf * strength * 80.0;
      pos.x += sin(t * 2.0 + r * 10.0) * inf * strength * 20.0;
    }

    // Effect 24: liquid — tangent flow with side sign
    else if (uEffect == 24) {
      vec2 toHome = home.xy - uCursor;
      vec2 dir = normalize(toHome + vec2(0.001));
      vec2 tangent = vec2(-dir.y, dir.x);
      float side = sign(dir.x);
      float curve = inf * strength * 50.0;
      pos.x += tangent.x * curve * side;
      pos.y += tangent.y * curve * side;
    }

    // Effect 25: bokeh — z-depth push + alpha fade
    else if (uEffect == 25) {
      pos.z += inf * strength * 120.0;
      vHoverFade = 1.0 - inf * strength * 0.5;
    }

    // Effect 26: stretch — pull along home-to-cursor direction
    else if (uEffect == 26) {
      vec2 stretchDir = normalize(uCursor - home.xy + vec2(0.001));
      float stretch = inf * strength * 60.0;
      pos.x += stretchDir.x * stretch;
      pos.y += stretchDir.y * stretch;
      pos.z -= inf * strength * 20.0;
    }

    // Effect 27: breathing — slow 0..1 cycle + outward expansion
    else if (uEffect == 27) {
      float breath = sin(t * 1.5) * 0.5 + 0.5;
      vec2 toHome = home.xy - uCursor;
      pos.x += toHome.x * inf * strength * breath * 0.5;
      pos.y += toHome.y * inf * strength * breath * 0.5;
    }

    // Effect 28: morph — mix to circle positions around cursor
    else if (uEffect == 28) {
      float circleAngle = r * 6.28318;
      vec2 circlePos = uCursor + vec2(cos(circleAngle), sin(circleAngle)) * uCursorRadius * 0.6;
      pos.x = mix(pos.x, circlePos.x, inf * strength * 0.9);
      pos.y = mix(pos.y, circlePos.y, inf * strength * 0.9);
    }

    // Effect 29: parallax — z-depth push + xy shift + fade
    else if (uEffect == 29) {
      vec2 toHome = home.xy - uCursor;
      pos.z += inf * strength * 90.0;
      pos.x += toHome.x * inf * strength * 0.1;
      pos.y += toHome.y * inf * strength * 0.1;
      vHoverFade = 1.0 - inf * strength * 0.3;
    }

    // Effect 30: twist — rotation by height around vertical axis
    else if (uEffect == 30) {
      vec2 rel = home.xy - uCursor;
      float twistAngle = inf * strength * 3.14159 * (home.y - uCursor.y) / uCursorRadius;
      float c = cos(twistAngle);
      float s = sin(twistAngle);
      pos.x = uCursor.x + c * rel.x - s * rel.y;
      pos.y = uCursor.y + s * rel.x + c * rel.y;
    }

    // Effect 31: flatten — compress vertically + expand horizontally + z-push
    else if (uEffect == 31) {
      vec2 toHome = home.xy - uCursor;
      vec2 dir = normalize(toHome + vec2(0.001));
      pos.y = mix(pos.y, uCursor.y, inf * strength * 0.9);
      pos.x += dir.x * inf * strength * 90.0;
      pos.z -= inf * strength * 30.0;
    }

    // Effect 32: pinch — pull to horizontal line + expand outward
    else if (uEffect == 32) {
      vec2 toHome = home.xy - uCursor;
      vec2 dir = normalize(toHome + vec2(0.001));
      pos.y = mix(pos.y, uCursor.y, inf * strength * 0.85);
      pos.x += dir.x * inf * strength * 45.0;
    }

    // Effect 33: slice — top/bottom split + opposite slides + gap glow
    else if (uEffect == 33) {
      float side = step(uCursor.y, home.y);
      float slideDir = side * 2.0 - 1.0;
      pos.x += slideDir * inf * strength * 80.0;
    }

    // ===== Ambient family =====

    // Effect 34: tornado — twist angle by height + shrinking radius
    else if (uEffect == 34) {
      vec2 toHome = home.xy - uCursor;
      float dist = length(toHome);
      float twistAngle = atan(toHome.y, toHome.x) + t * 3.0 + home.y * 0.05;
      float twistR = dist * (1.0 - inf * strength * 0.5);
      pos.x = uCursor.x + cos(twistAngle) * twistR;
      pos.y = uCursor.y + sin(twistAngle) * twistR;
      pos.z += inf * strength * 40.0;
    }

    // Effect 35: matrix — quantized columns + cyclic fall + leading edge
    else if (uEffect == 35) {
      float colWidth = 20.0;
      float colX = floor(home.x / colWidth) * colWidth;
      float speed = 2.0 + sin(colX * 0.1) * 1.0;
      float range = 300.0;
      float fall = mod(t * speed * 60.0 + r * range, range);
      pos.y -= fall * inf * strength * 0.5;
    }

    // Effect 36: constellation — twinkle sines + glow pulse, no displacement
    else if (uEffect == 36) {
      float twinkle = sin(t * 2.0 + r * 25.0) * 0.5 + 0.5;
      vHoverScale = 1.0 + inf * strength * twinkle * 1.5;
    }

    // Effect 37: lens — magnify inside ring + edge glow
    else if (uEffect == 37) {
      vec2 toHome = home.xy - uCursor;
      float dist = length(toHome);
      float lensR = uCursorRadius * 0.7;
      if (dist < lensR) {
        vec2 dir = normalize(toHome + vec2(0.001));
        pos.x = uCursor.x + dir.x * dist * (1.0 + inf * strength * 2.0);
        pos.y = uCursor.y + dir.y * dist * (1.0 + inf * strength * 2.0);
      }
    }

    // Effect 38: orbit — stable circular orbit at current distance
    else if (uEffect == 38) {
      vec2 toHome = home.xy - uCursor;
      float dist = length(toHome);
      float orbitSpeed = 1.5 + r * 1.0;
      float orbitAngle = atan(toHome.y, toHome.x) + t * orbitSpeed;
      pos.x = uCursor.x + cos(orbitAngle) * dist;
      pos.y = uCursor.y + sin(orbitAngle) * dist;
    }

    // Effect 39: quantum — discrete time steps + random teleport + mask
    else if (uEffect == 39) {
      float qSeed = floor(t * 3.0 + r * 7.0);
      float qRand = hash(qSeed * 12.9898 + r * 78.233);
      if (qRand > 0.7) {
        vec2 qOffset = hash2(qSeed + r * 100.0) * 80.0 - 40.0;
        pos.x += qOffset.x * inf * strength;
        pos.y += qOffset.y * inf * strength;
      }
    }

    // Effect 40: static — hash-based random on all 3 axes
    else if (uEffect == 40) {
      float seed = t * 60.0 + r * 1000.0;
      pos.x += (hash(seed) - 0.5) * inf * strength * 50.0;
      pos.y += (hash(seed + 1.3) - 0.5) * inf * strength * 50.0;
      pos.z += (hash(seed + 2.7) - 0.5) * inf * strength * 50.0;
    }

    // Effect 41: sand — accelerated fall + horizontal pile spread
    else if (uEffect == 41) {
      float fall = inf * strength * 100.0;
      pos.y -= fall;
      float pileY = -uCursorRadius * 0.8;
      if (home.y - fall < pileY) {
        pos.y = pileY + sin(r * 31.0) * uCursorRadius * 0.3;
        pos.x += sin(r * 17.0) * uCursorRadius * 0.4;
      }
    }

    // Effect 42: bubbles — rise + wobble + soft pulse glow
    else if (uEffect == 42) {
      float rise = inf * strength * (40.0 + r * 40.0);
      pos.y += rise;
      pos.x += sin(t * 3.0 + r * 20.0) * rise * 0.4;
    }

    // Effect 43: comet — trail behind cursor velocity + head glow
    else if (uEffect == 43) {
      vec2 trail = vec2(sin(t) , cos(t)) * uCursorRadius;
      float trailFactor = inf * strength * (0.3 + r * 0.7);
      pos.x += trail.x * trailFactor * 0.5;
      pos.y += trail.y * trailFactor * 0.5;
    }

    // Effect 44: ink — slow turbulent flow + dark intense glow
    else if (uEffect == 44) {
      float inkSpeed = t * 0.8 + r * 3.0;
      float inkX = sin(inkSpeed) * cos(inkSpeed * 1.3 + r * 5.0);
      float inkY = cos(inkSpeed * 1.1) * sin(inkSpeed * 0.9 + r * 4.0);
      pos.x += inkX * inf * strength * 50.0;
      pos.y += inkY * inf * strength * 50.0;
    }

    // ===== Visual family =====

    // Effect 45: vanish — alpha fade only, no displacement
    else if (uEffect == 45) {
      vHoverFade = 1.0 - inf * strength;
    }

    // Effect 46: hueshift — RGB sine cycle mixed by strength
    else if (uEffect == 46) {
      vec2 toHome = home.xy - uCursor;
      float dist = length(toHome);
      float hue = dist * 0.02 - t * 0.5 + r;
      vHoverColor = vec3(
        sin(hue * 6.28318) * 0.5 + 0.5,
        sin(hue * 6.28318 + 2.094) * 0.5 + 0.5,
        sin(hue * 6.28318 + 4.188) * 0.5 + 0.5
      );
      vUseHoverColor = inf * strength;
    }

    // Effect 47: cloak — full alpha fade + slight scatter, no glow
    else if (uEffect == 47) {
      vHoverFade = 1.0 - inf * strength;
      pos.x += (hash(r * 13.0) - 0.5) * inf * strength * 15.0;
      pos.y += (hash(r * 27.0) - 0.5) * inf * strength * 15.0;
    }

    // Effect 48: mirror — reflect offset through cursor
    else if (uEffect == 48) {
      vec2 toCursor = uCursor - home.xy;
      vec2 mirrored = uCursor - toCursor;
      pos.x = mix(pos.x, mirrored.x, inf * strength * 0.9);
      pos.y = mix(pos.y, mirrored.y, inf * strength * 0.9);
    }

    // Effect 49: scaleup — point size scales up to 5x, no displacement
    else if (uEffect == 49) {
      vHoverScale = 1.0 + inf * strength * 4.0;
    }

    return pos;
  }

  void main() {
    vec3 entrancePos = applyEntrance(position);
    vec3 displaced = displace(entrancePos);
    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size attenuation by distance, scaled by hover + entrance effects
    float size = aSize * uPixelRatio * vHoverScale * vEntranceScale;
    gl_PointSize = size * (300.0 / -mvPosition.z);

    // Alpha: fade slightly when displaced + per-effect hover/entrance fade
    float inf = influence();
    vAlpha = (1.0 - inf * uStrength * 0.3) * vHoverFade * vEntranceAlpha;
    vGlow = inf * uStrength;
  }
`;

/** Fragment shader — circular point with glow. */
export const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3  uColor;
  uniform vec3  uGlowColor;
  uniform float uOpacity;

  varying float vAlpha;
  varying float vGlow;
  varying vec3  vHoverColor;
  varying float vUseHoverColor;

  void main() {
    // Circular point — discard outside radius
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    // Soft edge
    float alpha = smoothstep(0.5, 0.2, dist) * uOpacity * vAlpha;

    // Base color, optionally overridden by hover color (hue shift)
    vec3 baseColor = mix(uColor, vHoverColor, clamp(vUseHoverColor, 0.0, 1.0));

    // Mix base color with glow color based on vGlow
    vec3 color = mix(baseColor, uGlowColor, vGlow * 0.6);

    gl_FragColor = vec4(color, alpha);
  }
`;
