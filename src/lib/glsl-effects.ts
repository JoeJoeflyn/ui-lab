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
    vec3 displaced = displace(position);
    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size attenuation by distance, scaled by hover effect
    float size = aSize * uPixelRatio * vHoverScale;
    gl_PointSize = size * (300.0 / -mvPosition.z);

    // Alpha: fade slightly when displaced + per-effect hover fade
    float inf = influence();
    vAlpha = (1.0 - inf * uStrength * 0.3) * vHoverFade;
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
