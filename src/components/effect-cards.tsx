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
  const isEntrance = effect.kind === "entrance";
  const [hovered, setHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [revealed, setRevealed] = useState(false);
  // Entrance cards: mount WebGL when in view, unmount when scrolled away.
  // Hover cards: only mount WebGL on hover.
  const [mounted, setMounted] = useState(false);
  const [inView, setInView] = useState(false);
  const shouldRender = isEntrance ? inView && mounted : hovered;
  const paused = isEntrance ? !inView : !hovered;

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!revealed) {
            setTimeout(() => setRevealed(true), (index % 8) * 40);
          }
          if (isEntrance && !mounted) setMounted(true);
          setInView(true);
        } else {
          setInView(false);
          // Reset so entrance re-triggers on scroll-back
          if (isEntrance) setMounted(false);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [index, revealed, isEntrance, mounted]);

  const delayClass = `reveal-delay-${(index % 6) + 1}`;

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
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
    [effect.slug, isEntrance],
  );

  return (
    <Link
      ref={cardRef}
      href={`/effects/${effect.slug}`}
      className={`group painting-frame block cursor-pointer ${revealed ? "reveal visible" : `reveal ${delayClass}`}`}
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
          shouldRender ? (
            <ParticleText
              text={effect.name}
              hoverMode={(isEntrance ? "dissolve" : effect.slug) as never}
              entranceMode={isEntrance ? (effect.slug as never) : undefined}
              entranceLoop={isEntrance}
              compact
              paused={paused}
              particleCount={2500}
              cursorRadius={80}
              color={[0.55, 0.65, 0.85]}
              glowColor={[0.95, 0.75, 0.3]}
              opacity={0.95}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="select-none text-xl font-bold tracking-wide text-muted-foreground/30 transition-colors duration-300 group-hover:text-muted-foreground/50"
                style={{ fontFamily: "var(--font-heading), serif" }}
              >
                {effect.name}
              </span>
            </div>
          )
        ) : (
          <div className="flex h-full items-center justify-center">
            <span
              className="select-none text-2xl font-bold tracking-wide text-muted-foreground/20"
              style={{ fontFamily: "var(--font-heading), serif" }}
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
            className={`text-sm font-semibold transition-colors duration-300 ${hovered ? "text-gold" : "text-card-foreground"}`}
            style={{ fontFamily: "var(--font-heading), serif" }}
          >
            {effect.name}
          </h3>
          {effect.implemented && (
            <button
              onClick={handleCopy}
              className={`flex flex-shrink-0 items-center gap-1 rounded-md border border-gold/15 px-2 py-1 font-mono text-[9px] uppercase tracking-wider transition-all duration-200 hover:border-gold/40 ${copied ? "text-gold" : "text-gold/50"}`}
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
            background: `radial-gradient(ellipse 70% 50% at 50% 0%, color-mix(in oklch, var(--gold) 8%, transparent), transparent 70%)`,
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
        <div className="pointer-events-none absolute bottom-5 left-5 z-10">
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

        {/* Navigation — bottom-right */}
        <div className="pointer-events-auto absolute bottom-5 right-5 z-10 flex items-center gap-2">
          <button
            onClick={prev}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/15 text-gold/50 transition-all hover:border-gold/40 hover:text-gold"
            aria-label="Previous exhibit"
          >
            <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
              <path d="M7 1L3 5L7 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <span className="px-2 font-mono text-[10px] tabular-nums text-gold/60">
            {idx + 1} / {implemented.length}
          </span>

          <button
            onClick={next}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/15 text-gold/50 transition-all hover:border-gold/40 hover:text-gold"
            aria-label="Next exhibit"
          >
            <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
              <path d="M3 1L7 5L3 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Bottom fade */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-24"
          style={{
            background: "linear-gradient(to top, #0a0a12 0%, transparent 100%)",
            zIndex: 3,
          }}
        />
      </div>

      {/* Interaction hint */}
      <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/40">
        Move cursor across canvas · Use arrows to browse exhibits
      </p>
    </section>
  );
}
