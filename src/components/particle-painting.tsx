"use client";

import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import type { Artwork } from "@/lib/artworks";

/* ──────────────────────────────────────────────────────────────
 * createGLRenderer — create a THREE WebGLRenderer on a canvas.
 *
 * THREE.js registers webglcontextrestored on the canvas during
 * construction. If the constructor throws (context limit), the
 * listener is orphaned. By creating the canvas imperatively and
 * removing it in cleanup, the element + its listeners are GC'd.
 * ────────────────────────────────────────────────────────────── */
// ponytail: createGLRenderer was unused — inline try/catch in useEffect instead

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
  sampleWidth?: number;
  sampleStep?: number;
}

export function ParticlePainting({
  artwork,
  className = "",
  cursorRadius = 100,
  scatterStrength = 4,
  sampleWidth = 600,
  sampleStep = 2,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;
    renderer: THREE.WebGLRenderer;
    geometry: THREE.BufferGeometry;
    material: THREE.ShaderMaterial;
    raf: number;
    mouse: { x: number; y: number; active: boolean };
    mouseStrength: number;
    bursts: { x: number; y: number; strength: number; radius: number }[];
    homePositions: Float32Array;
    currentPositions: Float32Array;
    count: number;
  } | null>(null);

  // Two-way IntersectionObserver — create scene when in view, dispose when out
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const o = new IntersectionObserver(
      ([entry]) => {
        if (timer) clearTimeout(timer);
        // Debounce: wait 300ms after last scroll event to avoid rapid create/dispose
        timer = setTimeout(() => setInView(entry.isIntersecting), 300);
      },
      { threshold: 0.01, rootMargin: "100px 0px" },
    );
    o.observe(el);
    return () => {
      o.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !inView) return;

    // Create canvas imperatively so cleanup can fully remove it (GC takes orphaned THREE.js listeners)
    const canvas = document.createElement("canvas");
    canvas.className = "block h-full w-full";
    canvasRef.current = canvas;
    container.append(canvas);

    const img = new Image();
    img.src = artwork.imageUrl;

    img.onload = () => {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      const w = rect.width || 300;
      const h = rect.height || 300;

      // Sample image on a grid
      const sampleCanvas = document.createElement("canvas");
      const sampleW = Math.min(img.naturalWidth, sampleWidth);
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

      // Grid sample
      const STEP = sampleStep;
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
          const size = 0.6 + (brightness / 255) * 2.2;

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
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 2.5) },
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
            gl_FragColor = vec4(vColor, alpha * 1.0);
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

      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: false,
          antialias: false,
        });
      } catch {
        setLoaded(true);
        return;
      }
      renderer.setSize(w, h, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
      // Always render on a dark "gallery wall" — paintings look best on dark background
      renderer.setClearColor(0x0a0a12, 1);

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
        mouseStrength: 0,
        bursts: [] as { x: number; y: number; strength: number; radius: number }[],
        homePositions,
        currentPositions,
        count,
      };
      sceneRef.current = ctx;
      setLoaded(true);

      // ponytail: stop animation loop on context loss — component will remount on scroll
      canvas.addEventListener("webglcontextlost", (e) => {
        e.preventDefault();
        cancelAnimationFrame(ctx.raf);
        ctx.raf = 0;
      });

      // Animation loop — JS physics, GPU render
      const animate = () => {
        ctx.raf = requestAnimationFrame(animate);

        const posAttr = ctx.geometry.attributes.position as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;
        const home = ctx.homePositions;
        const mx = ctx.mouse.x;
        const my = ctx.mouse.y;
        const target = ctx.mouse.active ? 1 : 0;
        ctx.mouseStrength += (target - ctx.mouseStrength) * 0.06;
        const radius = cursorRadius;
        const radiusSq = radius * radius;
        const strength = scatterStrength * ctx.mouseStrength;

        // Update bursts — expand radius and fade strength
        ctx.bursts = ctx.bursts.filter((b) => b.strength > 0.01);
        for (const b of ctx.bursts) {
          b.radius += 8;
          b.strength *= 0.92;
        }

        for (let i = 0; i < ctx.count; i++) {
          const i3 = i * 3;
          const hx = home[i3];
          const hy = home[i3 + 1];
          const cx = arr[i3];
          const cy = arr[i3 + 1];

          // Mouse repulsion
          if (strength > 0.01) {
            const dx = cx - mx;
            const dy = cy - my;
            const distSq = dx * dx + dy * dy;
            if (distSq < radiusSq && distSq > 0.01) {
              const dist = Math.sqrt(distSq);
              const force = (1 - dist / radius) * strength;
              const pushX = (dx / dist) * force;
              const pushY = (dy / dist) * force;
              arr[i3] = cx + pushX;
              arr[i3 + 1] = cy + pushY;
            }
          }

          // Click burst — expanding ring push
          for (const b of ctx.bursts) {
            const bdx = cx - b.x;
            const bdy = cy - b.y;
            const bdist = Math.sqrt(bdx * bdx + bdy * bdy);
            if (Math.abs(bdist - b.radius) < 40 && bdist > 0.1) {
              const force = b.strength * 8;
              arr[i3] += (bdx / bdist) * force;
              arr[i3 + 1] += (bdy / bdist) * force;
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
      if (canvas.parentNode) canvas.remove();
      canvasRef.current = null;
    };
  }, [artwork.imageUrl, inView]);

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

    const onClick = (e: MouseEvent) => {
      const ctx = sceneRef.current;
      if (!ctx) return;
      const rect = container.getBoundingClientRect();
      ctx.bursts.push({
        x: e.clientX - rect.left - rect.width / 2,
        y: -(e.clientY - rect.top - rect.height / 2),
        strength: 1,
        radius: 0,
      });
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
    container.addEventListener("click", onClick);
    container.addEventListener("touchmove", onTouch, { passive: true });
    container.addEventListener("touchend", onTouchEnd);
    return () => {
      container.removeEventListener("mousemove", onMove);
      container.removeEventListener("mouseleave", onLeave);
      container.removeEventListener("click", onClick);
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
    </div>
  );
}
