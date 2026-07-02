"use client";

import { useRef, useEffect, useState } from "react";
import { generateAntAtlas } from "@/lib/ant-sprite";
import { ARTWORKS, FOOTER_ARTWORKS } from "@/lib/artworks";

/* ──────────────────────────────────────────────────────────────
 * FooterAnts — ant colony that forms artwork images in the footer
 *
 * Reuses the same sprite atlas as AntText — real ant shapes with
 * body, legs, antennae. Each ant is tinted with the color from
 * the painting pixel it's assigned to.
 * ────────────────────────────────────────────────────────────── */

const ANT_COUNT = 10000;
const SPRITE_SIZE = 64;
const FRAMES = 8;
const ANT_DRAW_SIZE = 5; // matches sample step — no overlap blur
const SAMPLE_STEP = 5;
const SAMPLE_WIDTH = 600;

const FEATURED = [
  ...ARTWORKS.filter((a) =>
    ["starry-night", "the-great-wave", "the-kiss", "the-scream", "birth-of-venus"].includes(a.id)
  ),
  ...FOOTER_ARTWORKS,
];

interface Ant {
  x: number;
  y: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;
  angle: number;
  speed: number;
  frame: number;
  frameTimer: number;
  wanderAngle: number;
  stopTimer: number;
  maxSpeed: number;
  r: number;
  g: number;
  b: number;
}

interface Target {
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
}

export function FooterAnts() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [label, setLabel] = useState<{ title: string; artist: string } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = canvas.clientWidth;
    let h = canvas.clientHeight;
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const atlas = generateAntAtlas();

    const ants: Ant[] = [];
    for (let i = 0; i < ANT_COUNT; i++) {
      ants.push({
        x: Math.random() * w,
        y: Math.random() * h,
        tx: w / 2,
        ty: h / 2,
        vx: 0,
        vy: 0,
        angle: Math.random() * Math.PI * 2,
        speed: 0,
        frame: Math.floor(Math.random() * FRAMES),
        frameTimer: 0,
        wanderAngle: Math.random() * Math.PI * 2,
        stopTimer: 0,
        maxSpeed: 4.0 + Math.random() * 3.0,
        r: 200, g: 160, b: 40,
      });
    }

    let artIdx = 0;
    let phase: "forming" | "holding" | "dispersing" = "forming";
    let phaseTimer = 0;
    let targets: Target[] = [];

    const sampleArtwork = (imageUrl: string): Promise<Target[]> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = imageUrl;
        img.onload = () => {
          const sampleW = Math.min(img.naturalWidth, SAMPLE_WIDTH);
          const sampleH = Math.floor(sampleW * img.naturalHeight / img.naturalWidth);

          const off = document.createElement("canvas");
          off.width = sampleW;
          off.height = sampleH;
          const octx = off.getContext("2d");
          if (!octx) return resolve([]);

          octx.drawImage(img, 0, 0, sampleW, sampleH);
          const imgData = octx.getImageData(0, 0, sampleW, sampleH);
          const data = imgData.data;

          const imgAspect = sampleW / sampleH;
          const boxAspect = w / h;
          let scaleW: number, scaleH: number, offsetX: number, offsetY: number;
          if (imgAspect > boxAspect) {
            scaleW = w * 0.9;
            scaleH = scaleW / imgAspect;
          } else {
            scaleH = h * 0.9;
            scaleW = scaleH * imgAspect;
          }
          offsetX = (w - scaleW) / 2;
          offsetY = (h - scaleH) / 2;

          const pts: Target[] = [];
          for (let py = 0; py < sampleH; py += SAMPLE_STEP) {
            for (let px = 0; px < sampleW; px += SAMPLE_STEP) {
              const idx = (py * sampleW + px) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              const brightness = (r + g + b) / 3;
              if (brightness > 20) {
                pts.push({
                  x: offsetX + (px / sampleW) * scaleW,
                  y: offsetY + (py / sampleH) * scaleH,
                  r, g, b,
                });
              }
            }
          }
          resolve(pts);
        };
        img.onerror = () => resolve([]);
      });
    };

    const assignTargets = () => {
      if (targets.length === 0) return;
      const shuffled = [...targets].sort(() => Math.random() - 0.5);
      for (let i = 0; i < ants.length; i++) {
        const t = shuffled[i % shuffled.length];
        ants[i].tx = t.x + (Math.random() - 0.5) * 4;
        ants[i].ty = t.y + (Math.random() - 0.5) * 4;
        // Use actual pixel color but with a brightness floor so ants are visible
        ants[i].r = Math.max(t.r, 60);
        ants[i].g = Math.max(t.g, 50);
        ants[i].b = Math.max(t.b, 40);
      }
    };

    const nextArtwork = async () => {
      artIdx = (artIdx + 1) % FEATURED.length;
      const art = FEATURED[artIdx];
      setLabel({ title: art.title, artist: art.artist });
      targets = await sampleArtwork(art.imageUrl);
      assignTargets();
    };

    const init = async () => {
      const art = FEATURED[0];
      setLabel({ title: art.title, artist: art.artist });
      targets = await sampleArtwork(art.imageUrl);
      assignTargets();
    };
    init();

    let raf = 0;
    let running = true;

    const animate = () => {
      if (!running) return;
      raf = requestAnimationFrame(animate);

      phaseTimer++;

      // Clear each frame — no trails
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < ants.length; i++) {
        const a = ants[i];

        if (phase === "dispersing") {
          a.wanderAngle += (Math.random() - 0.5) * 0.4;
          a.vx += Math.cos(a.wanderAngle) * 0.3;
          a.vy += Math.sin(a.wanderAngle) * 0.3;
          a.vx *= 0.94;
          a.vy *= 0.94;
        } else {
          const dx = a.tx - a.x;
          const dy = a.ty - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (a.stopTimer > 0) {
            a.stopTimer--;
            a.vx *= 0.5;
            a.vy *= 0.5;
            a.wanderAngle += (Math.random() - 0.5) * 0.2;
          } else {
            if (dist > 2) {
              const seekStrength = phase === "holding" ? 0.4 : 0.3;
              const pull = Math.min(dist / 20, 1) * seekStrength * a.maxSpeed;
              a.vx += (dx / dist) * pull;
              a.vy += (dy / dist) * pull;
            }

            a.wanderAngle += (Math.random() - 0.5) * 0.1;
            const wanderStrength = dist > 20 ? 0.02 : 0.005;
            a.vx += Math.cos(a.wanderAngle) * wanderStrength;
            a.vy += Math.sin(a.wanderAngle) * wanderStrength;
          }

          const sp = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
          if (sp > a.maxSpeed) {
            a.vx = (a.vx / sp) * a.maxSpeed;
            a.vy = (a.vy / sp) * a.maxSpeed;
          }

          a.vx *= 0.88;
          a.vy *= 0.88;
        }

        a.x += a.vx;
        a.y += a.vy;
        a.speed = Math.sqrt(a.vx * a.vx + a.vy * a.vy);

        if (a.speed > 0.15) {
          const targetAngle = Math.atan2(a.vy, a.vx) + Math.PI / 2;
          let diff = targetAngle - a.angle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          a.angle += diff * 0.06;
        }

        a.frameTimer += a.speed * 0.8;
        if (a.frameTimer > 1.5) {
          a.frame = (a.frame + 1) % FRAMES;
          a.frameTimer = 0;
        }

        // Draw ant sprite with color tint — just ants, no circles/squares
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.angle);
        ctx.drawImage(
          atlas,
          a.frame * SPRITE_SIZE, 0, SPRITE_SIZE, SPRITE_SIZE,
          -ANT_DRAW_SIZE / 2, -ANT_DRAW_SIZE / 2, ANT_DRAW_SIZE, ANT_DRAW_SIZE,
        );
        ctx.globalCompositeOperation = "source-atop";
        ctx.fillStyle = `rgb(${a.r}, ${a.g}, ${a.b})`;
        ctx.fillRect(-ANT_DRAW_SIZE / 2, -ANT_DRAW_SIZE / 2, ANT_DRAW_SIZE, ANT_DRAW_SIZE);
        ctx.globalCompositeOperation = "source-over";
        ctx.restore();
      }

      // Wait until 99% of ants have settled
      if (phase === "forming") {
        let unsettled = 0;
        for (let i = 0; i < ants.length; i++) {
          const dx = ants[i].tx - ants[i].x;
          const dy = ants[i].ty - ants[i].y;
          if (dx * dx + dy * dy > 64) unsettled++;
        }
        if ((unsettled / ants.length < 0.05 && phaseTimer > 30) || phaseTimer > 300) {
          phase = "holding";
          phaseTimer = 0;
        }
      } else if (phase === "holding" && phaseTimer > 180) {
        phase = "dispersing";
        phaseTimer = 0;
      } else if (phase === "dispersing" && phaseTimer > 40) {
        phase = "forming";
        phaseTimer = 0;
        nextArtwork();
      }
    };
    animate();

    const onResize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
      if (FEATURED[artIdx]) {
        sampleArtwork(FEATURED[artIdx].imageUrl).then((pts) => {
          targets = pts;
          assignTargets();
        });
      }
    };
    window.addEventListener("resize", onResize);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 block h-full w-full"
      />
      {label && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 font-mono text-[8px] uppercase tracking-[0.15em] text-gold/40">
          <span className="text-gold/60">{label.title}</span>
          <span className="mx-1.5 text-muted-foreground/40">·</span>
          <span className="text-muted-foreground/50">{label.artist}</span>
        </div>
      )}
    </>
  );
}
