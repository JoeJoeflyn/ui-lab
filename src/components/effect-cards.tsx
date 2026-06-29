"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { ParticleText } from "@/components/particle-text";
import type { Effect } from "@/lib/effects";

/**
 * EffectMiniCard — museum painting card with gold frame.
 *
 * Structure:
 *   ┌──────────────────────────┐  ← gold double border
 *   │  ┌────────────────────┐  │     painting canvas (128px)
 *   │  │  particle effect   │  │     or placeholder text
 *   │  └────────────────────┘  │
 *   │  Effect Name       §1    │  ← museum plaque metadata
 *   │  One-line feel desc      │
 *   │  GLSL technique          │
 *   └──────────────────────────┘
 */
export function EffectMiniCard({ effect, index = 0 }: { effect: Effect; index?: number }) {
  const [hovered, setHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Small staggered delay based on index
          setTimeout(() => setVisible(true), (index % 8) * 40);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [index]);

  const delayClass = `reveal-delay-${(index % 6) + 1}`;

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const isEntrance = effect.kind === "entrance";
      const code = `<ParticleText
  text="Your Text"
  hoverMode="${isEntrance ? "dissolve" : effect.slug}"${isEntrance ? `\n  entranceMode="${effect.slug}"` : ""}
  particleCount={8000}
  cursorRadius={120}
  color={[0.6, 0.75, 0.9]}
  glowColor={[0.95, 0.75, 0.3]}
  opacity={0.9}
/>`;
      navigator.clipboard.writeText(code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    },
    [effect.slug, effect.kind],
  );

  return (
    <Link
      ref={cardRef}
      href={`/effects/${effect.slug}`}
      className={`group painting-frame block cursor-pointer ${visible ? "reveal visible" : `reveal ${delayClass}`}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Painting glow — overhead spotlight */}
      <div className="painting-glow" />

      {/* Canvas area — the "painting" itself */}
      <div className="relative h-32 overflow-hidden" style={{ zIndex: 2 }}>
        {/* Canvas surface texture */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='c'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23c)' opacity='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: '100px 100px',
          }}
        />

        {effect.implemented ? (
          <ParticleText
            text={effect.name}
            hoverMode={(effect.kind === "entrance" ? "dissolve" : effect.slug) as never}
            entranceMode={effect.kind === "entrance" ? (effect.slug as never) : undefined}
            entranceLoop={effect.kind === "entrance"}
            compact
            particleCount={2500}
            cursorRadius={80}
            color={[0.55, 0.65, 0.85]}
            glowColor={[0.95, 0.75, 0.3]}
            opacity={hovered ? 0.95 : 0.5}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span
              className="select-none text-2xl font-bold tracking-wide"
              style={{
                fontFamily: "var(--font-heading), serif",
                color: oklch(0.55, 0.03, 260, 0.25),
              }}
            >
              {effect.name}
            </span>
          </div>
        )}

        {/* Coming-soon badge */}
        {!effect.implemented && (
          <span className="gold-pill absolute right-2 top-2 z-10">
            coming soon
          </span>
        )}

        {/* Spec ref — top-left */}
        {effect.specRef && (
          <span className="absolute left-2 top-2 z-10 font-mono text-[9px] text-muted-foreground/30">
            {effect.specRef}
          </span>
        )}
      </div>

      {/* Museum plaque label */}
      <div className="relative border-t border-gold/10 px-4 py-3" style={{ zIndex: 2 }}>
        <div className="flex items-start justify-between gap-2">
          <h3
            className="text-sm font-semibold transition-colors duration-300"
            style={{
              fontFamily: "var(--font-heading), serif",
              color: hovered ? "oklch(0.82 0.16 85)" : "oklch(0.92 0.015 85)",
            }}
          >
            {effect.name}
          </h3>
          {effect.implemented && (
            <button
              onClick={handleCopy}
              className="flex flex-shrink-0 items-center gap-1 rounded-md border border-gold/15 px-2 py-1 font-mono text-[9px] uppercase tracking-wider transition-all duration-200 hover:border-gold/40"
              style={{ color: copied ? "oklch(0.82 0.16 85)" : "oklch(0.82 0.16 85 / 50%)" }}
              aria-label="Copy component code"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          )}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground/70">
          {effect.feel}
        </p>
        {effect.implemented && (
          <p className="mt-1.5 font-mono text-[10px] leading-relaxed text-starry-cyan/40">
            {effect.technique}
          </p>
        )}
      </div>
    </Link>
  );
}

// oklch CSS string builder for inline styles
function oklch(l: number, c: number, h: number, a = 1) {
  return `oklch(${l} ${c} ${h} / ${a})`;
}

/**
 * EffectHero — centerpiece exhibit with placard and dot navigation.
 */
export function EffectHero({ effects }: { effects: Effect[] }) {
  const implemented = effects.filter((e) => e.implemented);
  const [idx, setIdx] = useState(0);
  const current = implemented[idx] ?? implemented[0];

  const next = useCallback(() => {
    setIdx((i) => (i + 1) % implemented.length);
  }, [implemented.length]);

  const prev = useCallback(() => {
    setIdx((i) => (i - 1 + implemented.length) % implemented.length);
  }, [implemented.length]);

  return (
    <section className="hero-enter relative mb-24">
      {/* Decorative top brushstroke */}
      <div className="mx-auto mb-6 w-24 brushstroke-divider" />

      <div className="painting-frame relative h-80 overflow-hidden sm:h-[420px] lg:h-[500px]">
        {/* Hero spotlight — stronger radial glow */}
        <div className="painting-glow !opacity-100"
          style={{
            background: `radial-gradient(ellipse 70% 50% at 50% 0%, ${oklch(0.82, 0.16, 85, 0.08)}, transparent 70%)`,
          }}
        />

        {/* Particle canvas */}
        <div className="absolute inset-0" style={{ zIndex: 2 }}>
          {current && (
            <ParticleText
              text="UI Lab"
              hoverMode={(current.kind === "entrance" ? "dissolve" : current.slug) as never}
              entranceMode={current.kind === "entrance" ? (current.slug as never) : undefined}
              entranceLoop={current.kind === "entrance"}
              particleCount={12000}
              cursorRadius={160}
              color={[0.6, 0.75, 0.9]}
              glowColor={[0.95, 0.75, 0.3]}
              opacity={0.9}
              idleAnimation={current.kind === "hover"}
            />
          )}
        </div>

        {/* Museum placard — bottom-left */}
        <div
          className="pointer-events-none absolute bottom-5 left-5 z-10"
          style={{ zIndex: 5 }}
        >
          <div className="plaque-gold rounded px-4 py-2.5">
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-gold/50">
              Featured Exhibit
            </p>
            <p
              className="mt-0.5 text-sm font-semibold text-gold sm:text-base"
              style={{ fontFamily: "var(--font-heading), serif" }}
            >
              {current?.name ?? "UI Lab"}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground/60">
              {current?.feel ?? ""}
            </p>
          </div>
        </div>

        {/* Dot navigation — bottom-right */}
        <div
          className="pointer-events-auto absolute bottom-5 right-5 z-10 flex items-center gap-3"
          style={{ zIndex: 5 }}
        >
          {/* Prev arrow */}
          <button
            onClick={prev}
            className="flex h-6 w-6 items-center justify-center rounded-full text-gold/40 transition-colors hover:text-gold/80"
            aria-label="Previous exhibit"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M7 1L3 5L7 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Dots */}
          {implemented.map((e, i) => (
            <button
              key={e.slug}
              onClick={() => setIdx(i)}
              className={`rounded-full transition-all duration-300 ${
                i === idx
                  ? "bg-gold w-3 h-3 shadow-[0_0_8px_oklch(0.82_0.16_85/0.4)]"
                  : "bg-gold/20 hover:bg-gold/40 w-2 h-2"
              }`}
              aria-label={`Show ${e.name}`}
            />
          ))}

          {/* Next arrow */}
          <button
            onClick={next}
            className="flex h-6 w-6 items-center justify-center rounded-full text-gold/40 transition-colors hover:text-gold/80"
            aria-label="Next exhibit"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M3 1L7 5L3 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Bottom fade */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-24"
          style={{
            background: "linear-gradient(to top, oklch(0.10 0.025 260) 0%, transparent 100%)",
            zIndex: 3,
          }}
        />
      </div>

      {/* Interaction hint */}
      <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/40">
        Move cursor across canvas · Navigate with dots
      </p>
    </section>
  );
}
