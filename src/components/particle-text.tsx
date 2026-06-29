"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * ParticleText — GPU shader-based particle text effect.
 *
 * Spec: PARTICLE_EFFECTS.md (repo root).
 * Status: STUB. The component mounts a three.js scene with the correct
 * camera/renderer/resize plumbing, but the GLSL shaders and per-effect
 * branching are not yet implemented. Each effect page links here once wired.
 */

export type HoverMode =
  | "dissolve" | "magnet" | "ripple" | "vanish" | "vortex"
  | "explode" | "shake" | "blackhole" | "wave" | "shatter"
  | "inflate" | "gravity" | "lightning" | "liquid" | "glitch"
  | "bokeh" | "pulse" | "spiral" | "echo" | "tornado"
  | "ember" | "matrix" | "constellation" | "lens" | "drain"
  | "confetti" | "assemble" | "stretch" | "breathing" | "quantum"
  | "magnetize" | "orbit" | "spiralout" | "hueshift" | "parallax"
  | "bounce" | "morph" | "static" | "cloak" | "slice"
  | "mirror" | "sand" | "bubbles" | "pinch" | "twist"
  | "comet" | "flatten" | "ink" | "wind" | "scaleup";

export type EntranceMode =
  | "rise-up" | "fall-down" | "slide-left" | "slide-right"
  | "slide-up" | "slide-down" | "diagonal-tl" | "diagonal-tr"
  | "diagonal-bl" | "diagonal-br" | "converge" | "diverge"
  | "wave-right" | "wave-left" | "wave-up" | "wave-down"
  | "radial-bloom" | "radial-implode" | "circular-reveal"
  | "diamond-reveal" | "diagonal-wave" | "anti-diagonal-wave"
  | "sine-wave" | "spiral-reveal"
  | "power3-out" | "power5-out" | "expo-out" | "sine-out"
  | "back-out" | "elastic-out" | "bounce-out" | "circ-out"
  | "linear"
  | "morph-sphere" | "morph-cube" | "morph-grid" | "morph-circle"
  | "morph-line" | "morph-cloud" | "morph-spiral" | "morph-torus"
  | "morph-wave"
  | "gravity-settle" | "rain" | "snow" | "ascend" | "smoke"
  | "ember-rise" | "magnetic-snap"
  | "explode-inward" | "starburst" | "fireworks" | "vortex-in"
  | "tornado-in" | "orbit-in" | "scatter-gather" | "teleport"
  | "quantum-assemble" | "pixelate" | "dissolve-in" | "materialize"
  | "blur-in" | "scale-up" | "scale-down" | "flip-x" | "flip-y"
  | "cascade" | "liquid-flow" | "constellation-form"
  | "typewriter" | "curtain-open" | "venetian-blinds" | "scanline"
  | "glitch-assemble" | "ink-spread";

export type Falloff = "gaussian" | "linear" | "smoothstep" | "manhattan" | "chebyshev";

export interface ParticleTextProps {
  text: string;
  gradientPart?: string;
  particleCount?: number;
  fontSize?: number;
  weight?: number;
  color?: [number, number, number];
  gradientFrom?: [number, number, number];
  gradientTo?: [number, number, number];
  hoverMode: HoverMode;
  cursorRadius?: number;
  falloff?: Falloff;
  entrance?: EntranceMode;
  entranceDuration?: number;
  triggerOnScroll?: boolean;
  fillContainer?: boolean;
  verticalAlign?: "top" | "center";
}

export function ParticleText({
  text,
  particleCount = 8000,
  hoverMode = "dissolve",
  cursorRadius = 120,
  falloff = "gaussian",
  fillContainer = true,
}: ParticleTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 400;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 400;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Placeholder geometry — a simple point cloud.
    // Real implementation samples text glyph coverage into aTarget.
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * width;
      positions[i * 3 + 1] = (Math.random() - 0.5) * height;
      positions[i * 3 + 2] = 0;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      size: 2,
      color: 0x72b4d6,
      transparent: true,
      opacity: 0.6,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      points.rotation.z += 0.001;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 400;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [text, particleCount, hoverMode, cursorRadius, falloff, fillContainer]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: fillContainer ? "100%" : 400 }}
      data-hover-mode={hoverMode}
      data-cursor-radius={cursorRadius}
      data-falloff={falloff}
    />
  );
}
