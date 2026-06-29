"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { sampleTextToParticles } from "@/lib/particle-sampler";
import {
  VERTEX_SHADER,
  FRAGMENT_SHADER,
  EFFECT_IDS,
  ENTRANCE_EFFECT_IDS,
  type EffectSlug,
} from "@/lib/glsl-effects";

/**
 * ParticleText — GPU shader-based particle text effect.
 *
 * Composite architecture:
 *   1. Text-to-particle sampler (canvas 2D → pixel sampling → Float32Array)
 *   2. GLSL effect registry (one vertex shader, uEffect dispatch)
 *   3. Cursor tracking with smoothed strength
 *   4. Three.js Points + ShaderMaterial
 *
 * Spec: PARTICLE_EFFECTS.md (repo root).
 */

export type HoverMode = EffectSlug;
export type EntranceMode = keyof typeof ENTRANCE_EFFECT_IDS;

export type Falloff = "gaussian" | "linear" | "smoothstep" | "manhattan" | "chebyshev";

export interface ParticleTextProps {
  text: string;
  /** Particle count — higher = denser text. Default 8000. */
  particleCount?: number;
  /** Font size for sampling (px on the offscreen canvas). Default 120. */
  fontSize?: number;
  /** Font weight. Default "bold". */
  weight?: number | string;
  /** Base particle color [r, g, b] 0..1. Default [0.45, 0.7, 0.84] (soft blue). */
  color?: [number, number, number];
  /** Glow color when hovered. Default [1.0, 0.3, 0.6] (magenta). */
  glowColor?: [number, number, number];
  /** Which hover effect to use. */
  hoverMode: HoverMode;
  /** Which entrance effect to play on mount. */
  entranceMode?: EntranceMode;
  /** Enable the entrance animation. Default true. */
  entrance?: boolean;
  /** Entrance duration in ms. Default 1500. */
  entranceDuration?: number;
  /** Loop the entrance animation (gallery cards). Default false. */
  entranceLoop?: boolean;
  /** Cursor influence radius in world units. Default 120. */
  cursorRadius?: number;
  /** Falloff curve (currently unused in shader — reserved for future). */
  falloff?: Falloff;
  /** Opacity 0..1. Default 0.85. */
  opacity?: number;
  /** Fill parent container height. Default true. */
  fillContainer?: boolean;
  /** Auto-rotate / idle animation when not hovered. Default false. */
  idleAnimation?: boolean;
  /** Compact mode — smaller particles, fewer count. For mini cards. */
  compact?: boolean;
  /** Pause the animation loop without destroying WebGL context. Default false. */
  paused?: boolean;
}

export function ParticleText({
  text,
  particleCount,
  fontSize = 120,
  weight = "bold",
  color = [0.45, 0.7, 0.84],
  glowColor = [1.0, 0.3, 0.6],
  hoverMode = "dissolve",
  entranceMode,
  entrance = true,
  entranceDuration = 1500,
  entranceLoop = false,
  cursorRadius = 120,
  falloff = "gaussian",
  opacity = 0.85,
  fillContainer = true,
  idleAnimation = false,
  compact = false,
  paused = false,
}: ParticleTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const count = particleCount ?? (compact ? 3000 : 8000);
    const baseSize = compact ? 1.5 : 2.5;

    const width = container.clientWidth;
    const height = container.clientHeight || (compact ? 120 : 400);
    if (width === 0 || height === 0) return;

    // --- 1. Sample text to particles ---
    const { positions } = sampleTextToParticles({
      text,
      count,
      fontSize: compact ? fontSize * 0.6 : fontSize,
      weight,
      width,
      height,
    });

    // --- 2. Build geometry ---
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    // Per-particle random (stable, 0..1)
    const randoms = new Float32Array(count);
    for (let i = 0; i < count; i++) randoms[i] = Math.random();
    geometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));

    // Per-particle size
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      sizes[i] = baseSize + Math.random() * baseSize;
    }
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

    // Per-particle random offscreen origin (scatter source for entrance)
    const origins = new Float32Array(count * 3);
    const originSpread = (width + height) * 0.8;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = originSpread * (0.6 + Math.random() * 0.8);
      origins[i * 3] = Math.cos(a) * d;
      origins[i * 3 + 1] = Math.sin(a) * d;
      origins[i * 3 + 2] = (Math.random() - 0.5) * 200;
    }
    geometry.setAttribute("aOrigin", new THREE.BufferAttribute(origins, 3));

    // Per-particle normalized index 0..1 (for staggered entrance effects)
    const indices = new Float32Array(count);
    for (let i = 0; i < count; i++) indices[i] = i / count;
    geometry.setAttribute("aIndex", new THREE.BufferAttribute(indices, 1));

    // Text bounding-box half-extents (for entrance origin math)
    let maxX = 0;
    let maxY = 0;
    for (let i = 0; i < count; i++) {
      maxX = Math.max(maxX, Math.abs(positions[i * 3]));
      maxY = Math.max(maxY, Math.abs(positions[i * 3 + 1]));
    }
    const boundsX = maxX || width / 2;
    const boundsY = maxY || height / 2;

    // Entrance config
    const entranceEnabled = entrance && entranceMode != null;
    const entranceId = entranceEnabled
      ? (ENTRANCE_EFFECT_IDS[entranceMode] ?? -1)
      : -1;

    // --- 3. Shader material ---
    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uCursor: { value: new THREE.Vector2(9999, 9999) },
        uCursorRadius: { value: cursorRadius },
        uStrength: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uEffect: { value: EFFECT_IDS[hoverMode] ?? 0 },
        uEntranceMode: { value: entranceId },
        uProgress: { value: entranceEnabled ? 0 : 1 },
        uBounds: { value: new THREE.Vector2(boundsX, boundsY) },
        uColor: { value: new THREE.Color(...color) },
        uGlowColor: { value: new THREE.Color(...glowColor) },
        uOpacity: { value: opacity },
      },
    });

    // Compute bounding sphere so three.js doesn't skip rendering
    geometry.computeBoundingSphere();

    // --- 4. Scene setup ---
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(
      -width / 2,
      width / 2,
      height / 2,
      -height / 2,
      0.1,
      1000,
    );
    camera.position.z = 100;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false; // prevent culling when particles displace
    scene.add(points);

    // --- 5. Cursor tracking + smoothed strength ---
    const cursor = new THREE.Vector2(9999, 9999);
    let targetStrength = 0;
    let currentStrength = 0;

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Convert to world space (centered origin, y-up)
      cursor.x = x - width / 2;
      cursor.y = -(y - height / 2);
      targetStrength = 1;
    };

    const onPointerLeave = () => {
      cursor.set(9999, 9999);
      targetStrength = 0;
    };

    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerleave", onPointerLeave);

    // --- 6. Animation loop ---
    let frameId = 0;
    const timer = new THREE.Timer();
    const entranceStartRef = { value: performance.now() };
    const entranceHoldMs = 1200;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (pausedRef.current) return; // pause without destroying context
      timer.update();
      const elapsed = timer.getElapsed();

      // Smooth strength toward target
      currentStrength += (targetStrength - currentStrength) * 0.08;

      // Entrance progress (linear 0..1; per-effect easing happens in shader)
      if (entranceEnabled) {
        const e = performance.now() - entranceStartRef.value;
        const prog = Math.min(e / entranceDuration, 1);
        material.uniforms.uProgress.value = prog;
        if (entranceLoop && e > entranceDuration + entranceHoldMs) {
          entranceStartRef.value = performance.now();
        }
      }

      material.uniforms.uTime.value = elapsed;
      material.uniforms.uCursor.value.copy(cursor);
      material.uniforms.uStrength.value = currentStrength;

      // Idle animation — slow drift when not hovered
      if (idleAnimation && currentStrength < 0.01) {
        points.rotation.y = Math.sin(elapsed * 0.3) * 0.1;
        points.position.x = Math.sin(elapsed * 0.5) * 5;
      } else {
        points.rotation.y *= 0.9; // ease back to zero
        points.position.x *= 0.9;
      }

      renderer.render(scene, camera);
    };
    animate();

    // --- 7. Resize handling ---
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || (compact ? 120 : 400);
      if (w === 0 || h === 0) return;
      camera.left = -w / 2;
      camera.right = w / 2;
      camera.top = h / 2;
      camera.bottom = -h / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    // --- 8. Cleanup ---
    return () => {
      cancelAnimationFrame(frameId);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [
    text,
    particleCount,
    fontSize,
    weight,
    hoverMode,
    entranceMode,
    entrance,
    entranceDuration,
    entranceLoop,
    cursorRadius,
    falloff,
    opacity,
    fillContainer,
    idleAnimation,
    compact,
  ]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: fillContainer ? "100%" : compact ? 120 : 400 }}
      data-hover-mode={hoverMode}
      data-entrance-mode={entranceMode ?? ""}
      data-cursor-radius={cursorRadius}
      data-falloff={falloff}
    />
  );
}
