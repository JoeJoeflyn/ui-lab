"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import { generateAntAtlas } from "@/lib/ant-sprite";
import { ARTWORKS, FOOTER_ARTWORKS } from "@/lib/artworks";

/* ──────────────────────────────────────────────────────────────
 * FooterAntPainting — ant colony that forms paintings on GPU
 *
 * Three.js InstancedBufferGeometry — single draw call for 50k ants:
 *   - Real ant sprites (atlas texture on GPU)
 *   - Per-instance: position, rotation, frame, color tint
 *   - CPU physics (wander + seek), GPU renders
 *   - Wander → converge → hold 12s → disperse → next
 * ────────────────────────────────────────────────────────────── */

const ANT_COUNT = 80000;
const SPRITE_SIZE = 64;
const FRAMES = 8;
const ANT_DRAW_SIZE = 6;
const SAMPLE_STEP = 3;
const SAMPLE_WIDTH = 600;

const FEATURED = [
  ...ARTWORKS.filter((a) =>
    ["starry-night", "the-great-wave", "the-kiss", "the-scream", "birth-of-venus"].includes(a.id)
  ),
  ...FOOTER_ARTWORKS,
];

interface Ant {
  x: number; y: number; tx: number; ty: number;
  vx: number; vy: number; angle: number; speed: number;
  frame: number; frameTimer: number;
  wanderAngle: number; stopTimer: number; maxSpeed: number;
  r: number; g: number; b: number;       // current color (lerped)
  tr: number; tg: number; tb: number;    // target color
}

interface Target { x: number; y: number; r: number; g: number; b: number; }

export function FooterAntPainting() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<{ title: string; artist: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const code = `// FooterAntPainting — ant colony that forms paintings (GPU instanced)
// Requires: three, ant-sprite.ts, artworks.ts
import { useRef, useEffect } from "react";
import * as THREE from "three";
import { generateAntAtlas } from "./ant-sprite";
import { ARTWORKS, FOOTER_ARTWORKS } from "./artworks";

// 50k ants rendered in a single GPU draw call
// See full source in footer-ant-painting.tsx`;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create canvas imperatively for clean cleanup
    const canvas = document.createElement("canvas");
    canvas.className = "block h-full w-full";
    container.append(canvas);

    let w = container.clientWidth;
    let h = container.clientHeight;
    const dpr = Math.min(window.devicePixelRatio, 2);

    // ── Renderer ────────────────────────────────────────────
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    } catch {
      return;
    }
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);

    // ── Scene + camera (orthographic = pixel space) ─────────
    const scene = new THREE.Scene();
    let camera = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, -500, 500);
    camera.position.z = 100;

    // ── Ant atlas texture ───────────────────────────────────
    const atlasCanvas = generateAntAtlas();
    const atlasTexture = new THREE.CanvasTexture(atlasCanvas);
    atlasTexture.minFilter = THREE.LinearFilter;
    atlasTexture.magFilter = THREE.LinearFilter;
    atlasTexture.needsUpdate = true;

    // ── Instanced geometry ──────────────────────────────────
    // Base: a single quad (2 triangles)
    const baseGeo = new THREE.PlaneGeometry(1, 1);
    const instGeo = new THREE.InstancedBufferGeometry();
    instGeo.index = baseGeo.index;
    instGeo.attributes.position = baseGeo.attributes.position;
    instGeo.attributes.uv = baseGeo.attributes.uv;

    // Per-instance attributes
    const aPos = new Float32Array(ANT_COUNT * 2);     // x, y
    const aAngle = new Float32Array(ANT_COUNT);        // rotation
    const aFrame = new Float32Array(ANT_COUNT);        // atlas frame index
    const aColor = new Float32Array(ANT_COUNT * 3);    // r, g, b tint

    instGeo.setAttribute("aInstancePos", new THREE.InstancedBufferAttribute(aPos, 2));
    instGeo.setAttribute("aInstanceAngle", new THREE.InstancedBufferAttribute(aAngle, 1));
    instGeo.setAttribute("aInstanceFrame", new THREE.InstancedBufferAttribute(aFrame, 1));
    instGeo.setAttribute("aInstanceColor", new THREE.InstancedBufferAttribute(aColor, 3));
    instGeo.instanceCount = ANT_COUNT;

    // ── Shader material ─────────────────────────────────────
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uAtlas: { value: atlasTexture },
        uAntSize: { value: ANT_DRAW_SIZE },
        uFrames: { value: FRAMES },
        uSpriteSize: { value: SPRITE_SIZE },
        uDpr: { value: dpr },
        uResolution: { value: new THREE.Vector2(w, h) },
      },
      vertexShader: `
        attribute vec2 aInstancePos;
        attribute float aInstanceAngle;
        attribute float aInstanceFrame;
        attribute vec3 aInstanceColor;
        uniform float uAntSize;
        uniform float uFrames;
        uniform float uDpr;
        uniform vec2 uResolution;
        varying vec2 vUv;
        varying float vFrame;
        varying vec3 vColor;

        void main() {
          // Base quad vertex (-0.5 to 0.5) → scale to ant size
          vec2 corner = position.xy * uAntSize;
          // Rotate by instance angle
          float c = cos(aInstanceAngle);
          float s = sin(aInstanceAngle);
          vec2 rotated = vec2(corner.x * c - corner.y * s, corner.x * s + corner.y * c);
          // Translate to instance position (pixel space → NDC)
          vec2 worldPos = rotated + aInstancePos;
          // Convert pixel coords to NDC: pixel center = (0,0), y up
          vec2 ndc = worldPos / vec2(uResolution * 0.5);
          gl_Position = vec4(ndc, 0.0, 1.0);
          vUv = uv;
          vFrame = aInstanceFrame;
          vColor = aInstanceColor;
        }
      `,
      fragmentShader: `
        uniform sampler2D uAtlas;
        uniform float uFrames;
        uniform float uSpriteSize;
        varying vec2 vUv;
        varying float vFrame;
        varying vec3 vColor;

        void main() {
          // Sample from atlas: frame determines X offset
          float frameW = 1.0 / uFrames;
          vec2 atlasUv = vec2(vUv.x * frameW + vFrame * frameW, vUv.y);
          vec4 texColor = texture2D(uAtlas, atlasUv);
          if (texColor.a < 0.01) discard;
          // Tint: replace ant color with painting color, keep ant shape (alpha)
          gl_FragColor = vec4(vColor, texColor.a);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });

    const mesh = new THREE.Mesh(instGeo, material);
    mesh.frustumCulled = false;
    scene.add(mesh);

    // ── Ant state (CPU physics) ─────────────────────────────
    const ants: Ant[] = [];
    for (let i = 0; i < ANT_COUNT; i++) {
      ants.push({
        x: Math.random() * w - w / 2, y: Math.random() * h - h / 2,
        tx: 0, ty: 0, vx: 0, vy: 0,
        angle: Math.random() * Math.PI * 2, speed: 0,
        frame: Math.floor(Math.random() * FRAMES), frameTimer: 0,
        wanderAngle: Math.random() * Math.PI * 2,
        stopTimer: 0, maxSpeed: 2.0 + Math.random() * 1.5,
        r: 0.8, g: 0.6, b: 0.15,
        tr: 0.8, tg: 0.6, tb: 0.15,
      });
    }

    let artIdx = 0;
    let phase: "free" | "holding" | "dispersing" = "free";
    let phaseTimer = 0;
    let seekBlend = 0;
    let targets: Target[] = [];

    const sampleArtwork = (imageUrl: string): Promise<void> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = imageUrl;
        img.onload = () => {
          const sampleW = Math.min(img.naturalWidth, SAMPLE_WIDTH);
          const sampleH = Math.floor(sampleW * img.naturalHeight / img.naturalWidth);
          const off = document.createElement("canvas");
          off.width = sampleW; off.height = sampleH;
          const octx = off.getContext("2d");
          if (!octx) return resolve();
          octx.drawImage(img, 0, 0, sampleW, sampleH);
          const data = octx.getImageData(0, 0, sampleW, sampleH).data;

          const imgAspect = sampleW / sampleH;
          const boxAspect = w / h;
          let scaleW: number, scaleH: number, offsetX: number, offsetY: number;
          if (imgAspect > boxAspect) {
            scaleW = w * 0.82; scaleH = scaleW / imgAspect;
          } else {
            scaleH = h * 0.82; scaleW = scaleH * imgAspect;
          }
          offsetX = (w - scaleW) / 2;
          offsetY = (h - scaleH) / 2;

          const pts: Target[] = [];
          for (let py = 0; py < sampleH; py += SAMPLE_STEP) {
            for (let px = 0; px < sampleW; px += SAMPLE_STEP) {
              const idx = (py * sampleW + px) * 4;
              const r = data[idx], g = data[idx + 1], b = data[idx + 2];
              const brightness = (r + g + b) / 3;
              if (brightness > 25) {
                // Convert to centered pixel space (y up)
                pts.push({
                  x: offsetX + (px / sampleW) * scaleW - w / 2,
                  y: -(offsetY + (py / sampleH) * scaleH - h / 2),
                  r: Math.max(r, 50) / 255,
                  g: Math.max(g, 40) / 255,
                  b: Math.max(b, 30) / 255,
                });
              }
            }
          }
          targets = pts;
          resolve();
        };
        img.onerror = () => resolve();
      });
    };

    const assignTargets = () => {
      if (targets.length === 0) return;
      const shuffled = [...targets].sort(() => Math.random() - 0.5);
      for (let i = 0; i < ants.length; i++) {
        const t = shuffled[i % shuffled.length];
        ants[i].tx = t.x + (Math.random() - 0.5) * 4;
        ants[i].ty = t.y + (Math.random() - 0.5) * 4;
        // Set target color — current color lerps toward it smoothly
        ants[i].tr = t.r; ants[i].tg = t.g; ants[i].tb = t.b;
      }
    };

    const nextArtwork = async () => {
      artIdx = (artIdx + 1) % FEATURED.length;
      const art = FEATURED[artIdx];
      setLabel({ title: art.title, artist: art.artist });
      await sampleArtwork(art.imageUrl);
      assignTargets();
    };

    const init = async () => {
      const art = FEATURED[0];
      setLabel({ title: art.title, artist: art.artist });
      await sampleArtwork(art.imageUrl);
      assignTargets();
    };
    init();

    // ── Animation loop ──────────────────────────────────────
    let raf = 0;
    let running = true;

    const animate = () => {
      if (!running) return;
      raf = requestAnimationFrame(animate);
      phaseTimer++;

      for (let i = 0; i < ants.length; i++) {
        const a = ants[i];

        if (phase === "dispersing") {
          a.wanderAngle += (Math.random() - 0.5) * 0.4;
          a.vx += Math.cos(a.wanderAngle) * 0.3;
          a.vy += Math.sin(a.wanderAngle) * 0.3;
          a.vx *= 0.94; a.vy *= 0.94;
        } else {
          // Wander — kill it completely during holding so painting is sharp
          a.wanderAngle += (Math.random() - 0.5) * 0.2;
          const wanderAmt = phase === "holding" ? 0 : 0.06 * (1 - seekBlend * 0.85);
          a.vx += Math.cos(a.wanderAngle) * wanderAmt;
          a.vy += Math.sin(a.wanderAngle) * wanderAmt;

          // Seek target — very strong lock during holding
          const dx = a.tx - a.x;
          const dy = a.ty - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const seekStrength = phase === "holding" ? 0.6 : 0.22 * seekBlend;
          const pull = Math.min(dist / 10, 1) * seekStrength * a.maxSpeed;
          a.vx += (dx / (dist + 0.1)) * pull;
          a.vy += (dy / (dist + 0.1)) * pull;

          // Random stops — only in free phase, not holding
          if (phase === "free" && seekBlend > 0.5 && Math.random() < 0.002) {
            a.stopTimer = 8 + Math.random() * 12;
          }
          if (a.stopTimer > 0) {
            a.stopTimer--;
            a.vx *= 0.5; a.vy *= 0.5;
          }

          // Bounce off edges — but not during holding (let ants reach edge targets)
          if (phase !== "holding") {
            if (a.x < -w / 2 || a.x > w / 2) { a.vx *= -0.5; a.x = Math.max(-w / 2, Math.min(w / 2, a.x)); }
            if (a.y < -h / 2 || a.y > h / 2) { a.vy *= -0.5; a.y = Math.max(-h / 2, Math.min(h / 2, a.y)); }
          }

          const sp = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
          if (sp > a.maxSpeed) { a.vx = (a.vx / sp) * a.maxSpeed; a.vy = (a.vy / sp) * a.maxSpeed; }
          // During holding, snap to target if very close — no drift
          if (phase === "holding" && dist < 1.5) {
            a.x = a.tx; a.y = a.ty;
            a.vx *= 0.1; a.vy *= 0.1;
          } else {
            a.vx *= 0.9; a.vy *= 0.9;
          }
        }

        a.x += a.vx; a.y += a.vy;
        a.speed = Math.sqrt(a.vx * a.vx + a.vy * a.vy);

        // Heading
        if (a.speed > 0.1) {
          const targetAngle = Math.atan2(a.vy, a.vx) + Math.PI / 2;
          let diff = targetAngle - a.angle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          a.angle += diff * 0.05;
        }

        // Leg animation
        a.frameTimer += a.speed * 0.8;
        if (a.frameTimer > 1.5) { a.frame = (a.frame + 1) % FRAMES; a.frameTimer = 0; }

        // Smooth color transition — lerp current toward target
        a.r += (a.tr - a.r) * 0.04;
        a.g += (a.tg - a.g) * 0.04;
        a.b += (a.tb - a.b) * 0.04;

        // Write to GPU buffers
        const i2 = i * 2;
        const i3 = i * 3;
        aPos[i2] = a.x;
        aPos[i2 + 1] = a.y;
        aAngle[i] = a.angle;
        aFrame[i] = a.frame;
        aColor[i3] = a.r;
        aColor[i3 + 1] = a.g;
        aColor[i3 + 2] = a.b;
      }

      // Mark buffers for GPU upload
      (instGeo.attributes.aInstancePos as THREE.InstancedBufferAttribute).needsUpdate = true;
      (instGeo.attributes.aInstanceAngle as THREE.InstancedBufferAttribute).needsUpdate = true;
      (instGeo.attributes.aInstanceFrame as THREE.InstancedBufferAttribute).needsUpdate = true;
      (instGeo.attributes.aInstanceColor as THREE.InstancedBufferAttribute).needsUpdate = true;

      // Phase transitions
      if (phase === "free") {
        seekBlend = Math.min(phaseTimer / 45, 1);
        let unsettled = 0;
        for (let i = 0; i < ants.length; i++) {
          const dx = ants[i].tx - ants[i].x;
          const dy = ants[i].ty - ants[i].y;
          if (dx * dx + dy * dy > 4) unsettled++;
        }
        // 99.5% settled, or 6s max — don't transition until nearly all ants are in place
        if ((unsettled / ants.length < 0.005 && seekBlend >= 1) || phaseTimer > 360) {
          phase = "holding"; phaseTimer = 0;
        }
      } else if (phase === "holding" && phaseTimer > 720) {
        phase = "dispersing"; phaseTimer = 0; seekBlend = 0;
      } else if (phase === "dispersing" && phaseTimer > 80) {
        phase = "free"; phaseTimer = 0; seekBlend = 0;
        nextArtwork();
      }

      renderer.render(scene, camera);
    };
    animate();

    // ── Resize ──────────────────────────────────────────────
    const onResize = () => {
      if (!container) return;
      w = container.clientWidth; h = container.clientHeight;
      renderer.setSize(w, h, false);
      camera = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, -500, 500);
      camera.position.z = 100;
      (material.uniforms.uResolution.value as THREE.Vector2).set(w, h);
      if (FEATURED[artIdx]) {
        sampleArtwork(FEATURED[artIdx].imageUrl).then(() => assignTargets());
      }
    };
    window.addEventListener("resize", onResize);

    // ── Cleanup ─────────────────────────────────────────────
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
      raf = 0;
    });

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      atlasTexture.dispose();
      material.dispose();
      instGeo.dispose();
      baseGeo.dispose();
      renderer.dispose();
      if (canvas.parentNode) canvas.remove();
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 h-full w-full">
      {/* Copy button */}
      <button
        onClick={handleCopy}
        className={`pointer-events-auto absolute right-3 top-3 z-30 flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-wider transition-all duration-200 ${copied ? "border-gold/40 bg-gold/10 text-gold" : "border-gold/20 bg-background/60 text-gold/50 hover:border-gold/40 hover:text-gold"}`}
        aria-label="Copy component code"
      >
        {copied ? "Copied!" : "Copy"}
      </button>

      {/* Painting label */}
      {label && (
        <div
          className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-md border border-gold/30 bg-black/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] backdrop-blur-sm"
        >
          <span className="text-gold">{label.title}</span>
          <span className="mx-1.5 text-white/40">·</span>
          <span className="text-white/70">{label.artist}</span>
        </div>
      )}
    </div>
  );
}
