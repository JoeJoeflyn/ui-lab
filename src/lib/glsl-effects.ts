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
 *
 * Adding a new effect:
 *   1. Add an entry to EFFECT_IDS below with a unique int.
 *   2. Add a GLSL branch in the effect shader chunk.
 *   3. Add the slug to the HoverMode type in particle-text.tsx.
 */

export const EFFECT_IDS = {
  dissolve: 0,
  explode: 1,
  vortex: 2,
  magnet: 3,
  wave: 4,
  glitch: 5,
  blackhole: 6,
  ember: 7,
} as const;

export type EffectSlug = keyof typeof EFFECT_IDS;

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

  varying float vAlpha;
  varying float vGlow;

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

  // Main displacement function — dispatches by uEffect
  vec3 displace(vec3 home) {
    vec3 pos = home;
    float inf = influence();
    float t = uTime;
    float r = aRandom;
    float strength = uStrength;

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
    }

    // Effect 7: ember — rise + flicker drift + glow
    else if (uEffect == 7) {
      float rise = inf * strength * (30.0 + r * 50.0);
      float drift = sin(t * 3.0 + r * 6.28) * 15.0 * inf * strength;
      pos.y += rise;
      pos.x += drift;
      pos.z += r * rise * 0.2;
    }

    return pos;
  }

  void main() {
    vec3 displaced = displace(position);
    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size attenuation by distance
    float size = aSize * uPixelRatio;
    gl_PointSize = size * (300.0 / -mvPosition.z);

    // Alpha: fade slightly when displaced
    float inf = influence();
    vAlpha = 1.0 - inf * uStrength * 0.3;
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

  void main() {
    // Circular point — discard outside radius
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    // Soft edge
    float alpha = smoothstep(0.5, 0.2, dist) * uOpacity * vAlpha;

    // Mix base color with glow color based on vGlow
    vec3 color = mix(uColor, uGlowColor, vGlow * 0.6);

    gl_FragColor = vec4(color, alpha);
  }
`;
