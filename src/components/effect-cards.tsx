"use client";

import { useState } from "react";
import Link from "next/link";
import { ParticleText } from "@/components/particle-text";
import type { Effect } from "@/lib/effects";

/**
 * EffectMiniCard — card with a small live particle canvas.
 * The canvas plays the effect on hover. Compact mode (3000 particles).
 */
export function EffectMiniCard({ effect }: { effect: Effect }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/effects/${effect.slug}`}
      className="group relative block overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-accent-foreground/40"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Mini canvas — only mount when hovered or implemented (for hero rotation) */}
      <div className="relative h-28 overflow-hidden">
        {effect.implemented ? (
          <ParticleText
            text={effect.name}
            hoverMode={effect.slug as never}
            compact
            particleCount={2500}
            cursorRadius={80}
            color={[0.45, 0.7, 0.84]}
            glowColor={[1.0, 0.3, 0.6]}
            opacity={hovered ? 0.9 : 0.5}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-2xl font-bold text-muted-foreground/40" style={{ fontFamily: "var(--font-heading), sans-serif" }}>
              {effect.name}
            </span>
          </div>
        )}
        {!effect.implemented && (
          <span className="absolute right-2 top-2 rounded bg-muted/80 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
            soon
          </span>
        )}
      </div>

      {/* Info bar */}
      <div className="border-t border-border p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-card-foreground group-hover:text-accent-foreground">
            {effect.name}
          </h3>
          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {effect.specRef}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {effect.feel}
        </p>
      </div>
    </Link>
  );
}

/**
 * EffectHero — large featured canvas at the top of the page.
 * Cycles through implemented effects on an interval.
 */
export function EffectHero({ effects }: { effects: Effect[] }) {
  const implemented = effects.filter((e) => e.implemented);
  const [idx, setIdx] = useState(0);
  const current = implemented[idx] ?? implemented[0];

  return (
    <section className="mb-20">
      <div className="relative h-64 overflow-hidden rounded-xl border border-border bg-card sm:h-80">
        {current && (
          <ParticleText
            text="UI Lab"
            hoverMode={current.slug as never}
            particleCount={10000}
            cursorRadius={150}
            color={[0.5, 0.75, 0.9]}
            glowColor={[1.0, 0.4, 0.7]}
            opacity={0.9}
            idleAnimation
          />
        )}
        {/* Effect label overlay */}
        <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2">
          <span className="rounded bg-background/80 px-2 py-1 font-mono text-[10px] uppercase text-muted-foreground backdrop-blur">
            {current?.kind}
          </span>
          <span className="rounded bg-background/80 px-2 py-1 text-xs font-medium text-card-foreground backdrop-blur">
            {current?.name}
          </span>
        </div>
        {/* Effect switcher dots */}
        <div className="pointer-events-auto absolute bottom-4 right-4 flex gap-1.5">
          {implemented.map((e, i) => (
            <button
              key={e.slug}
              onClick={() => setIdx(i)}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === idx ? "bg-accent-foreground" : "bg-muted-foreground/30 hover:bg-muted-foreground/60"
              }`}
              aria-label={`Show ${e.name}`}
            />
          ))}
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Hover the canvas to interact · Click dots to switch effects
      </p>
    </section>
  );
}
