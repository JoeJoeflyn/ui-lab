"use client";

import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import type { Artwork } from "@/lib/artworks";

/* ──────────────────────────────────────────────────────────────
 * ParticlePainting — renders an artwork as colored particles
 *   - Samples image pixels to particle positions + colors
 *   - Hover: particles scatter away from cursor
 *   - Idle:   gentle floating wobble
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
  particleCount = 10000,
  cursorRadius = 120,
  scatterStrength = 15,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;
    renderer: THREE.WebGLRenderer;
    points: THREE.Points;
    geometry: THREE.BufferGeometry;
    material: THREE.ShaderMaterial;
    raf: number;
    mouse: { x: number; y: number };
    homePositions: Float32Array;
    currentPositions: Float32Array;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const img = new Image();
    img.src = artwork.imageUrl;

    img.onload = () => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const w = rect.width || 300;
      const h = rect.height || 400;

      // Sample image to particles
      const { positions, colors, sizes, randoms } = sampleImage(img, particleCount, w, h);

      // Build geometry
      const geometry = new THREE.BufferGeometry();
      const posAttr = new THREE.BufferAttribute(new Float32Array(positions), 3);
      geometry.setAttribute("position", posAttr);
      geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
      geometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));

      // Shader material
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
          uOpacity: { value: 1 },
        },
        vertexShader: `
          attribute vec3 aColor;
          attribute float aSize;
          attribute float aRandom;
          uniform float uPixelRatio;
          uniform float uOpacity;
          uniform float uTime;
          varying vec3 vColor;
          varying float vRandom;
          void main() {
            vec3 pos = position;
            float wobbleX = sin(uTime * 0.8 + aRandom * 6.28) * 1.5;
            float wobbleY = cos(uTime * 0.6 + aRandom * 3.14) * 1.5;
            pos.x += wobbleX;
            pos.y += wobbleY;
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = aSize * uPixelRatio * (120.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
            vColor = aColor;
            vRandom = aRandom;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          uniform float uOpacity;
          void main() {
            vec2 center = gl_PointCoord - 0.5;
            float dist = length(center);
            if (dist > 0.5) discard;
            float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
            alpha *= alpha;
            gl_FragColor = vec4(vColor, alpha * uOpacity);
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
        canvas: canvasRef.current!,
        alpha: true,
        antialias: false,
      });
      renderer.setSize(w, h, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const points = new THREE.Points(geometry, material);
      scene.add(points);

      const homePositions = new Float32Array(positions);
      const currentPositions = new Float32Array(positions);

      const ctx: NonNullable<typeof sceneRef.current> = {
        scene,
        camera,
        renderer,
        points,
        geometry,
        material,
        raf: 0,
        mouse: { x: 0, y: 0 },
        homePositions,
        currentPositions,
      };
      sceneRef.current = ctx;
      setLoaded(true);

      // Animation loop
      const animate = () => {
        ctx.raf = requestAnimationFrame(animate);
        ctx.material.uniforms.uTime.value += 0.016;

        const current = ctx.currentPositions;
        const home = ctx.homePositions;
        const posAttr = ctx.geometry.attributes.position as THREE.BufferAttribute;
        const arr = posAttr.array as Float32Array;

        const mx = ctx.mouse.x;
        const my = ctx.mouse.y;

        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          const hx = home[i3];
          const hy = home[i3 + 1];

          // Cursor scatter
          const dx = current[i3] - mx;
          const dy = current[i3 + 1] - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const influence = Math.max(0, 1 - dist / cursorRadius);
          const push = influence * scatterStrength;

          let tx = hx;
          let ty = hy;
          if (dist > 0.01 && influence > 0) {
            tx = hx + (dx / dist) * push;
            ty = hy + (dy / dist) * push;
          }

          current[i3] += (tx - current[i3]) * 0.1;
          current[i3 + 1] += (ty - current[i3 + 1]) * 0.1;

          arr[i3] = current[i3];
          arr[i3 + 1] = current[i3 + 1];
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
  }, [artwork.imageUrl, particleCount]);

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
    };
    const onLeave = () => {
      const ctx = sceneRef.current;
      if (ctx) {
        ctx.mouse.x = 9999;
        ctx.mouse.y = 9999;
      }
    };
    container.addEventListener("mousemove", onMove);
    container.addEventListener("mouseleave", onLeave);
    return () => {
      container.removeEventListener("mousemove", onMove);
      container.removeEventListener("mouseleave", onLeave);
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
        className="pointer-events-none block h-full w-full"
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Sample image pixels → particle data
 * ────────────────────────────────────────────────────────────── */
function sampleImage(
  img: HTMLImageElement,
  count: number,
  displayW: number,
  displayH: number,
) {
  const cvs = document.createElement("canvas");
  cvs.width = img.naturalWidth;
  cvs.height = img.naturalHeight;
  const ctx = cvs.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, cvs.width, cvs.height);
  const pixels = imageData.data;
  const iw = cvs.width;
  const ih = cvs.height;

  const imgAspect = iw / ih;
  const boxAspect = displayW / displayH;

  let scaleW: number, scaleH: number;
  if (imgAspect > boxAspect) {
    scaleH = displayH / ih;
    scaleW = iw * scaleH;
  } else {
    scaleW = displayW / iw;
    scaleH = ih * scaleW;
  }

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const randoms = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const px = Math.floor(Math.random() * iw);
    const py = Math.floor(Math.random() * ih);
    const idx = (py * iw + px) * 4;
    const r = pixels[idx] / 255;
    const g = pixels[idx + 1] / 255;
    const b = pixels[idx + 2] / 255;

    positions[i * 3] = px * (scaleW / iw) - scaleW / 2;
    positions[i * 3 + 1] = -(py * (scaleH / ih) - scaleH / 2);
    positions[i * 3 + 2] = 0;

    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;

    sizes[i] = 1.2 + Math.random() * 1.8;
    randoms[i] = Math.random();
  }

  return { positions, colors, sizes, randoms };
}
