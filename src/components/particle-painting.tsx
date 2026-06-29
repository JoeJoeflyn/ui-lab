"use client";

import { useRef, useEffect, useState } from "react";
import type { Artwork } from "@/lib/artworks";

/* ──────────────────────────────────────────────────────────────
 * ParticlePainting — renders an artwork as interactive particles
 *
 * Based on the proven Canvas 2D technique:
 *   - Sample image on a grid (every Nth pixel) for even coverage
 *   - Each particle has: home position, current position, velocity
 *   - Mouse repels particles within influence radius
 *   - Particles spring back to home with damping + jitter
 *   - Particle size varies with pixel brightness
 * ────────────────────────────────────────────────────────────── */

interface Props {
  artwork: Artwork;
  className?: string;
  particleCount?: number;
  cursorRadius?: number;
  scatterStrength?: number;
}

interface Particle {
  // Home position (where the particle belongs in the image)
  hx: number;
  hy: number;
  // Current position
  x: number;
  y: number;
  // Velocity
  vx: number;
  vy: number;
  // Color
  r: number;
  g: number;
  b: number;
  // Size (varies with brightness)
  size: number;
}

export function ParticlePainting({
  artwork,
  className = "",
  cursorRadius = 100,
  scatterStrength = 3,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const stateRef = useRef<{
    particles: Particle[];
    raf: number;
    mouse: { x: number; y: number; active: boolean };
    canvasW: number;
    canvasH: number;
    dpr: number;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Load image
    const img = new Image();
    img.src = artwork.imageUrl;

    img.onload = () => {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      const displayW = rect.width || 300;
      const displayH = rect.height || 300;

      canvas.width = Math.floor(displayW * dpr);
      canvas.height = Math.floor(displayH * dpr);
      canvas.style.width = `${displayW}px`;
      canvas.style.height = `${displayH}px`;
      ctx.scale(dpr, dpr);

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

      // Calculate scale to fit image in display area (contain)
      const imgAspect = sampleW / sampleH;
      const boxAspect = displayW / displayH;
      let scaleW: number, scaleH: number, offsetX: number, offsetY: number;
      if (imgAspect > boxAspect) {
        // Image wider than box — fit width
        scaleW = displayW;
        scaleH = displayW / imgAspect;
        offsetX = 0;
        offsetY = (displayH - scaleH) / 2;
      } else {
        // Image taller than box — fit height
        scaleH = displayH;
        scaleW = displayH * imgAspect;
        offsetX = (displayW - scaleW) / 2;
        offsetY = 0;
      }

      // Grid sampling — every STEP pixels
      const STEP = 3;
      const particles: Particle[] = [];

      for (let py = 0; py < sampleH; py += STEP) {
        for (let px = 0; px < sampleW; px += STEP) {
          const idx = (py * sampleW + px) * 4;
          const r = pixels[idx];
          const g = pixels[idx + 1];
          const b = pixels[idx + 2];
          const a = pixels[idx + 3];

          // Skip transparent pixels
          if (a < 30) continue;

          // Brightness determines particle size
          const brightness = (r + g + b) / 3;
          const size = 0.8 + (brightness / 255) * 2.2;

          // Map to display coordinates
          const dx = (px / sampleW) * scaleW + offsetX;
          const dy = (py / sampleH) * scaleH + offsetY;

          particles.push({
            hx: dx,
            hy: dy,
            x: dx + (Math.random() - 0.5) * 4,
            y: dy + (Math.random() - 0.5) * 4,
            vx: 0,
            vy: 0,
            r,
            g,
            b,
            size,
          });
        }
      }

      const state = {
        particles,
        raf: 0,
        mouse: { x: 0, y: 0, active: false },
        canvasW: displayW,
        canvasH: displayH,
        dpr,
      };
      stateRef.current = state;
      setLoaded(true);

      // Animation loop
      const animate = () => {
        state.raf = requestAnimationFrame(animate);

        ctx.clearRect(0, 0, displayW, displayH);

        const mx = state.mouse.x;
        const my = state.mouse.y;
        const mouseActive = state.mouse.active;
        const radius = cursorRadius;
        const radiusSq = radius * radius;

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          // Mouse repulsion
          if (mouseActive) {
            const dx = p.x - mx;
            const dy = p.y - my;
            const distSq = dx * dx + dy * dy;
            if (distSq < radiusSq && distSq > 0.01) {
              const dist = Math.sqrt(distSq);
              const force = (1 - dist / radius) * scatterStrength;
              p.vx += (dx / dist) * force;
              p.vy += (dy / dist) * force;
            }
          }

          // Spring back to home
          p.vx += (p.hx - p.x) * 0.04;
          p.vy += (p.hy - p.y) * 0.04;

          // Friction
          p.vx *= 0.88;
          p.vy *= 0.88;

          // Update position
          p.x += p.vx;
          p.y += p.vy;

          // Draw
          ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},0.9)`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      };
      animate();
    };

    return () => {
      const state = stateRef.current;
      if (state) {
        cancelAnimationFrame(state.raf);
        stateRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artwork.imageUrl]);

  // Mouse tracking
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onMove = (e: MouseEvent) => {
      const state = stateRef.current;
      if (!state) return;
      const rect = container.getBoundingClientRect();
      state.mouse.x = e.clientX - rect.left;
      state.mouse.y = e.clientY - rect.top;
      state.mouse.active = true;
    };

    const onLeave = () => {
      const state = stateRef.current;
      if (state) {
        state.mouse.active = false;
      }
    };

    const onTouch = (e: TouchEvent) => {
      const state = stateRef.current;
      if (!state || e.touches.length === 0) return;
      const rect = container.getBoundingClientRect();
      state.mouse.x = e.touches[0].clientX - rect.left;
      state.mouse.y = e.touches[0].clientY - rect.top;
      state.mouse.active = true;
    };

    const onTouchEnd = () => {
      const state = stateRef.current;
      if (state) state.mouse.active = false;
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
