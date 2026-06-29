"use client";

import { useState } from "react";
import Link from "next/link";
import { ParticleText } from "@/components/particle-text";
import type { Effect } from "@/lib/effects";

/**
 * EffectMiniCard — gallery painting card with live particle canvas.
 * Styled as a museum painting frame with spotlight on hover.
 */
export function EffectMiniCard({ effect }: { effect: Effect }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/effects/${effect.slug}`}
      className="group gallery-spotlight painting-frame block overflow-hidden rounded-lg"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Canvas — the "painting" */}
      <div className="relative h-32 overflow-hidden bg-card">
        {effect.implemented ? (
          <ParticleText
            text={effect.name}
            hoverMode={effect.slug as never}
            compact
            particleCount={2500}
            cursorRadius={80}
            color={[0.55, 0.65, 0.85]}
            glowColor={[0.95, 0.75, 0.3]}
            opacity={hovered ? 0.9 : 0.55}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span
              className="text-2xl font-bold text-muted-foreground/30"
              style={{ fontFamily: "var(--font-heading), serif" }}
            >
              {effect.name}
            </span>
          </div>
        )}
        {!effect.implemented && (
          <span className="absolute right-2 top-2 rounded plaque px-1.5 py-0.5 font-mono text-[9px] text-gold/60">
            coming soon
          </span>
        )}
      </div>

      {/* Plaque — museum label */}
      <div className="border-t border-gold/10 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-card-foreground group-hover:text-gold transition-colors">
            {effect.name}
          </h3>
          <span className="shrink-0 rounded plaque px-1.5 py-0.5 font-mono text-[10px] text-gold/50">
            {effect.specRef}
          </span>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          {effect.feel}
        </p>
        {effect.implemented && (
          <p className="mt-2 font-mono text-[10px] text-starry-cyan/50">
            {effect.technique}
          </p>
        )}
      </div>
    </Link>
  );
}

/**
 * EffectHero — the centerpiece of the gallery.
 * Large canvas with effect switcher, styled as a featured exhibit.
 */
export function EffectHero({ effects }: { effects: Effect[] }) {
  const implemented = effects.filter((e) => e.implemented);
  const [idx, setIdx] = useState(0);
  const current = implemented[idx] ?? implemented[0];

  return (
    <section className="mb-20">
      <div className="painting-frame relative h-72 overflow-hidden rounded-xl bg-card sm:h-96">
        {current && (
          <ParticleText
            text="UI Lab"
            hoverMode={current.slug as never}
            particleCount={12000}
            cursorRadius={160}
            color={[0.6, 0.75, 0.9]}
            glowColor={[0.95, 0.75, 0.3]}
            opacity={0.9}
            idleAnimation
          />
        )}

        {/* Featured exhibit label */}
        <div className="pointer-events-none absolute bottom-5 left-5 flex items-center gap-3">
          <div className="plaque rounded px-3 py-2">
            <p className="text-[9px] uppercase tracking-[0.2em] text-gold/50">
              Featured Exhibit
            </p>
            <p className="mt-0.5 text-sm font-medium text-gold">
              {current?.name}
            </p>
          </div>
        </div>

        {/* Effect switcher — gallery navigation dots */}
        <div className="pointer-events-auto absolute bottom-5 right-5 flex gap-2">
          {implemented.map((e, i) => (
            <button
              key={e.slug}
              onClick={() => setIdx(i)}
              className={`h-2.5 w-2.5 rounded-full transition-all ${
                i === idx
                  ? "bg-gold scale-110"
                  : "bg-muted-foreground/20 hover:bg-gold/40"
              }`}
              aria-label={`Show ${e.name}`}
            />
          ))}
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground/60">
        Move your cursor across the canvas to interact · Tap dots to switch exhibits
      </p>
    </section>
  );
}
