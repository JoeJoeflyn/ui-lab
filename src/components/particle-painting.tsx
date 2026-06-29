"use client";

import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import type { Artwork } from "@/lib/artworks";

/* ──────────────────────────────────────────────────────────────
 * ParticlePainting — renders an artwork as GPU particles
 *
 * Three.js with a single Points draw call (fast):
 *   - Grid sample image pixels (every 3rd pixel for even coverage)
 *   - Each particle gets position + color from the pixel
 *   - Brightness → particle size
 *   - Mouse repulsion in JS, GPU handles rendering
 * ────────────────────────────────────────────────────────────── */

interface Props {
  artwork: Artwork;
  className?: string;
  particleCount?: number;
  cursorRadius?: number;
  scatterStrength?: number;
}

export function ParticlePainting({
  artwork,
  className = "",
  cursorRadius = 100,
  scatterStrength = 4,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;
    renderer: THREE.WebGLRenderer;
    geometry: THREE.BufferGeometry;
    material: THREE.ShaderMaterial;
    raf: number;
    mouse: { x: number; y: number; active: boolean };
    homePositions: Float32Array;
    currentPositions: Float32Array;
    count: number;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const img = new Image();
    img.src = artwork.imageUrl;

    img.onload = () => {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      const w = rect.width || 300;
      const h = rect.height || 300;

      // Sample image on a grid
      const sampleCanvas = document.createElement("canvas");
      const sampleW = Math.min(img.naturalWidth, 400);
      const sampleH = Math.floor(sampleW * img.naturalHeight / img.naturalWidth);
      sampleCanvas.width = sampleW;
      sampleCanvas.height = sampleH;
      const sctx = sampleCanvas.getContext("2d");
      if (!sctx) return;
      sctx.drawImage(img, 0, 0, sampleW, sampleH);
      const imageData = sctx.getImageData(0, 0, sampleW, sampleH);
      const pixels = imageData.data;

      // Calculate contain scaling
      const imgAspect = sampleW / sampleH;
      const boxAspect = w / h;
      let scaleW: number, scaleH: number, offsetX: number, offsetY: number;
      if (imgAspect > boxAspect) {
        scaleW = w;
        scaleH = w / imgAspect;
        offsetX = 0;
        offsetY = (h - scaleH) / 2;
      } else {
        scaleH = h;
        scaleW = h * imgAspect;
        offsetX = (w - scaleW) / 2;
        offsetY = 0;
      }

      // Grid sample — every STEP pixels
      const STEP = 3;
      const positions: number[] = [];
      const colors: number[] = [];
      const sizes: number[] = [];

      for (let py = 0; py < sampleH; py += STEP) {
        for (let px = 0; px < sampleW; px += STEP) {
          const idx = (py * sampleW + px) * 4;
          const r = pixels[idx];
          const g = pixels[idx + 1];
          const b = pixels[idx + 2];
          const a = pixels[idx + 3];
          if (a < 30) continue;

          const brightness = (r + g + b) / 3;
          const size = 0.8 + (brightness / 255) * 2.5;

          const dx = (px / sampleW) * scaleW + offsetX - w / 2;
          const dy = -(py / sampleH) * scaleH - offsetY + h / 2;

          positions.push(dx, dy, 0);
          colors.push(r / 255, g / 255, b / 255);
          sizes.push(size);
        }
      }

      const count = positions.length / 3;
      const homePositions = new Float32Array(positions);
      const currentPositions = new Float32Array(positions);

      // Build geometry
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(currentPositions, 3));
      geometry.setAttribute("aColor", new THREE.BufferAttribute(new Float32Array(colors), 3));
      geometry.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(sizes), 1));
      geometry.computeBoundingSphere();

      // Shader material — single draw call
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        },
        vertexShader: `
          attribute vec3 aColor;
          attribute float aSize;
          uniform float uPixelRatio;
          varying vec3 vColor;
          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aSize * uPixelRatio * (150.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
            vColor = aColor;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          void main() {
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            if (d > 0.5) discard;
            float alpha = 1.0 - smoothstep(0.3, 0.5, d);
            gl_FragColor = vec4(vColor, alpha * 0.9);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
      });

      // Scene
      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, -500, 500);
      camera.position.z = 100;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
      });
      renderer.setSize(w, h, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const points = new THREE.Points(geometry, material);
      points.frustumCulled = false;
      scene.add(points);

      const ctx = {
        scene,
        camera,
        renderer,
        geometry,
        material,
        raf: 0,
        mouse: { x: 0, y: 0, active: false },
        homePositions,
        currentPositions,
        count,
      };
      sceneRef.current = ctx;
      setLoaded(true);

      // Animation loop — JS physics, GPU render
      const animate = () => {
        ctx.raf = requestAnimationFrame(animate);

        const posAttr = ctx.geometry.attributes.position as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        const home = ctx.homePositions;
        const mx = ctx.mouse.x;
        const my = ctx.mouse.y;
        const active = ctx.mouse.active;
        const radius = cursorRadius;
        const radiusSq = radius * radius;
        const strength = scatterStrength;

        for (let i = 0; i < ctx.count; i++) {
          const i3 = i * 3;
          const hx = home[i3];
          const hy = home[i3 + 1];
          const cx = arr[i3];
          const cy = arr[i3 + 1];

          // Mouse repulsion
          if (active) {
            const dx = cx - mx;
            const dy = cy - my;
            const distSq = dx * dx + dy * dy;
            if (distSq < radiusSq && distSq > 0.01) {
              const dist = Math.sqrt(distSq);
              const force = (1 - dist / radius) * strength;
              const pushX = (dx / dist) * force;
              const pushY = (dy / dist) * force;
              // Apply as velocity offset (spring will pull back)
              arr[i3] = cx + pushX;
              arr[i3 + 1] = cy + pushY;
            }
          }

          // Spring back to home
          arr[i3] += (hx - arr[i3]) * 0.08;
          arr[i3 + 1] += (hy - arr[i3 + 1]) * 0.08;
        }
        posAttr.needsUpdate = true;

        renderer.render(scene, camera);
      };
      animate();
    };

    return () => {
      const ctx = sceneRef.current;
      if (ctx) {
        cancelAnimationFrame(ctx.raf);
        ctx.renderer.dispose();
        ctx.geometry.dispose();
        ctx.material.dispose();
        sceneRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artwork.imageUrl]);

  // Mouse tracking
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onMove = (e: MouseEvent) => {
      const ctx = sceneRef.current;
      if (!ctx) return;
      const rect = container.getBoundingClientRect();
      ctx.mouse.x = e.clientX - rect.left - rect.width / 2;
      ctx.mouse.y = -(e.clientY - rect.top - rect.height / 2);
      ctx.mouse.active = true;
    };

    const onLeave = () => {
      const ctx = sceneRef.current;
      if (ctx) ctx.mouse.active = false;
    };

    const onTouch = (e: TouchEvent) => {
      const ctx = sceneRef.current;
      if (!ctx || e.touches.length === 0) return;
      const rect = container.getBoundingClientRect();
      ctx.mouse.x = e.touches[0].clientX - rect.left - rect.width / 2;
      ctx.mouse.y = -(e.touches[0].clientY - rect.top - rect.height / 2);
      ctx.mouse.active = true;
    };

    const onTouchEnd = () => {
      const ctx = sceneRef.current;
      if (ctx) ctx.mouse.active = false;
    };

    container.addEventListener("mousemove", onMove);
    container.addEventListener("mouseleave", onLeave);
    container.addEventListener("touchmove", onTouch, { passive: true });
    container.addEventListener("touchend", onTouchEnd);
    return () => {
      container.removeEventListener("mousemove", onMove);
      container.removeEventListener("mouseleave", onLeave);
      container.removeEventListener("touchmove", onTouch);
      container.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
    >
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] uppercase tracking-widest text-gold/40">
            Loading...
          </span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
      />
    </div>
  );
}
