"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { generateAntAtlas } from "@/lib/ant-sprite";

/* ──────────────────────────────────────────────────────────────
 * AntText — a colony of ants that march into words
 *
 * Pure 2D canvas — no Three.js, no WebGL.
 * - Each ant is a detailed sprite (body, 6 legs, antennae)
 * - Ants move like real ants: wander, stop, turn, explore
 * - Pheromone trails fade behind them
 * - Auto-cycles: form word → hold → scatter → reform new word
 * ────────────────────────────────────────────────────────────── */

const WORDS = [
  "UI LAB",
  "GLSL",
  "SHADERS",
  "GPU",
  "PARTICLES",
  "THREE.JS",
  "REACT",
  "PIXELS",
  "ART",
  "CODE",
];

const ANT_COUNT = 1500;
const SPRITE_SIZE = 64;
const FRAMES = 8;
const ANT_DRAW_SIZE = 14; // visible as ants, small enough to form words

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
  // Natural movement state
  wanderAngle: number;
  stopTimer: number; // when > 0, ant pauses to "investigate"
  maxSpeed: number; // each ant has different speed personality
}

export function AntText() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentWord, setCurrentWord] = useState(WORDS[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const code = `// AntText — ants that form words on 2D canvas
// Requires: ant-sprite.ts (procedural sprite atlas generator)
import { useRef, useEffect, useState } from "react";
import { generateAntAtlas } from "./ant-sprite";

const WORDS = ["HELLO", "WORLD", "ANTS"];
const ANT_COUNT = 800;

export function AntText() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // ... see full source in ant-text.tsx
}`;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

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

    // Initialize ants with personality — each has different speed, wander rate
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
        maxSpeed: 1.8 + Math.random() * 1.0, // slow crawl
      });
    }

    // ── Text sampling ───────────────────────────────────────
    let wordIdx = 0;
    let phase: "forming" | "holding" | "dispersing" = "forming";
    let phaseTimer = 0;

    const sampleWord = (word: string) => {
      const off = document.createElement("canvas");
      const fontSize = Math.min(w / (word.length * 0.65), h * 0.5);
      off.width = w;
      off.height = h;
      const octx = off.getContext("2d");
      if (!octx) return [];

      octx.fillStyle = "white";
      octx.font = `900 ${fontSize}px Georgia, serif`;
      octx.textAlign = "center";
      octx.textBaseline = "middle";
      octx.fillText(word, w / 2, h / 2);

      const imgData = octx.getImageData(0, 0, w, h);
      const data = imgData.data;
      const targets: { x: number; y: number }[] = [];

      for (let py = 0; py < h; py += 5) {
        for (let px = 0; px < w; px += 5) {
          const idx = (py * w + px) * 4;
          if (data[idx + 3] > 128) {
            targets.push({ x: px, y: py });
          }
        }
      }
      return targets;
    };

    let targets = sampleWord(WORDS[0]);

    const assignTargets = () => {
      if (targets.length === 0) return;
      const shuffled = [...targets].sort(() => Math.random() - 0.5);
      for (let i = 0; i < ants.length; i++) {
        const t = shuffled[i % shuffled.length];
        ants[i].tx = t.x + (Math.random() - 0.5) * 8;
        ants[i].ty = t.y + (Math.random() - 0.5) * 8;
      }
    };

    assignTargets();

    const nextWord = () => {
      wordIdx = (wordIdx + 1) % WORDS.length;
      setCurrentWord(WORDS[wordIdx]);
      targets = sampleWord(WORDS[wordIdx]);
      assignTargets();
    };

    // ── Animation loop ──────────────────────────────────────
    let raf = 0;
    let running = true;

    const animate = () => {
      if (!running) return;
      raf = requestAnimationFrame(animate);

      phaseTimer++;

      // Fade trails — semi-transparent fill creates pheromone trail effect
      ctx.fillStyle = "rgba(10, 10, 18, 0.15)";
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < ants.length; i++) {
        const a = ants[i];

        if (phase === "dispersing") {
          // Scatter outward freely
          a.wanderAngle += (Math.random() - 0.5) * 0.4;
          const wanderX = Math.cos(a.wanderAngle) * 0.3;
          const wanderY = Math.sin(a.wanderAngle) * 0.3;
          a.vx += wanderX;
          a.vy += wanderY;
          a.vx *= 0.94;
          a.vy *= 0.94;
        } else {
          // Forming or holding — ants seek target smoothly
          const dx = a.tx - a.x;
          const dy = a.ty - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (a.stopTimer > 0) {
            // Ant paused — only during forming, not holding
            a.stopTimer--;
            a.vx *= 0.5;
            a.vy *= 0.5;
            a.wanderAngle += (Math.random() - 0.5) * 0.2;
          } else {
            // Gentle seek — ants crawl slowly toward target
            if (dist > 2) {
              const seekStrength = phase === "holding" ? 0.15 : 0.1;
              const pull = Math.min(dist / 30, 1) * seekStrength * a.maxSpeed;
              a.vx += (dx / dist) * pull;
              a.vy += (dy / dist) * pull;
            }

            // Natural wander — ants meander
            a.wanderAngle += (Math.random() - 0.5) * 0.15;
            const wanderStrength = dist > 20 ? 0.04 : 0.01;
            a.vx += Math.cos(a.wanderAngle) * wanderStrength;
            a.vy += Math.sin(a.wanderAngle) * wanderStrength;

            // Random stops — ants pause to investigate
            if (phase === "forming" && Math.random() < 0.003) {
              a.stopTimer = 10 + Math.random() * 20;
            }
          }

          // Speed limit
          const sp = Math.sqrt(a.vx * a.vx + a.vy * a.vy);
          if (sp > a.maxSpeed) {
            a.vx = (a.vx / sp) * a.maxSpeed;
            a.vy = (a.vy / sp) * a.maxSpeed;
          }

          // Smooth friction — gentler so movement is fluid, not jerky
          a.vx *= 0.88;
          a.vy *= 0.88;
        }

        a.x += a.vx;
        a.y += a.vy;
        a.speed = Math.sqrt(a.vx * a.vx + a.vy * a.vy);

        // Heading — smoothly rotate to face movement direction
        if (a.speed > 0.15) {
          const targetAngle = Math.atan2(a.vy, a.vx) + Math.PI / 2;
          let diff = targetAngle - a.angle;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          a.angle += diff * 0.06; // slower rotation = smoother turns
        }

        // Leg animation — faster movement = faster legs
        a.frameTimer += a.speed * 0.8;
        if (a.frameTimer > 1.5) {
          a.frame = (a.frame + 1) % FRAMES;
          a.frameTimer = 0;
        }

        // Draw ant sprite
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.angle);
        ctx.drawImage(
          atlas,
          a.frame * SPRITE_SIZE, 0, SPRITE_SIZE, SPRITE_SIZE,
          -ANT_DRAW_SIZE / 2, -ANT_DRAW_SIZE / 2, ANT_DRAW_SIZE, ANT_DRAW_SIZE,
        );
        ctx.restore();
      }

      // Phase transitions — wait until ants have naturally formed the word
      if (phase === "forming") {
        let unsettled = 0;
        for (let i = 0; i < ants.length; i++) {
          const dx = ants[i].tx - ants[i].x;
          const dy = ants[i].ty - ants[i].y;
          if (dx * dx + dy * dy > 64) unsettled++;
        }
        // 99% settled in 90 frames, or 10s max — let ants arrive naturally
        if ((unsettled / ants.length < 0.01 && phaseTimer > 90) || phaseTimer > 600) {
          phase = "holding";
          phaseTimer = 0;
        }
      } else if (phase === "holding" && phaseTimer > 180) {
        phase = "dispersing";
        phaseTimer = 0;
      } else if (phase === "dispersing" && phaseTimer > 60) {
        phase = "forming";
        phaseTimer = 0;
        nextWord();
      }
    };
    animate();

    const onResize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
      targets = sampleWord(WORDS[wordIdx]);
      assignTargets();
    };
    window.addEventListener("resize", onResize);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="terminal-window relative mx-auto max-w-2xl overflow-hidden rounded-lg border border-gold/20 bg-card shadow-2xl">
      <div className="flex items-center gap-2 border-b border-gold/15 bg-muted px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-[oklch(0.55_0.15_25)]" />
          <span className="size-2.5 rounded-full bg-[oklch(0.70_0.15_85)]" />
          <span className="size-2.5 rounded-full bg-[oklch(0.60_0.14_150)]" />
        </div>
        <span className="ml-2 font-mono text-[10px] text-gold/50">
          ui-lab@colony — ant-text
        </span>
        <span className="ml-auto flex items-center gap-3">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-[9px] uppercase tracking-wider transition-all duration-200 ${copied ? "border-gold/40 text-gold" : "border-gold/15 text-gold/50 hover:border-gold/40"}`}
            aria-label="Copy component code"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <span className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-wider text-gold/40">
            <span className="size-1.5 animate-pulse rounded-full bg-gold/60" />
            {ANT_COUNT.toLocaleString()} ants
          </span>
        </span>
      </div>

      <div
        className="relative h-[320px] w-full overflow-hidden"
        style={{ background: "#0a0a12" }}
      >
        <canvas ref={canvasRef} className="block h-full w-full" />
        <div className="pointer-events-none absolute bottom-3 left-4 z-20 font-mono text-[8px] uppercase tracking-[0.15em] text-gold/50">
          <span className="text-gold/70">forming:</span>
          <span className="ml-1.5 text-foreground/60">{currentWord}</span>
        </div>
        <div className="pointer-events-none absolute bottom-3 right-4 z-20 font-mono text-[8px] uppercase tracking-[0.2em] text-gold/40">
          auto-cycling
        </div>
      </div>
    </div>
  );
}
