"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ARTWORKS } from "@/lib/artworks";
import { ParticlePainting } from "@/components/particle-painting";

const FEATURED = ARTWORKS.slice(0, 5);
const AUTO_INTERVAL = 5000;

export function ArtworkHero() {
  const [idx, setIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const artwork = FEATURED[idx];

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setIdx((i) => (i + 1) % FEATURED.length);
    }, AUTO_INTERVAL);
  }, [stopTimer]);

  useEffect(() => {
    if (!isHovered) startTimer();
    else stopTimer();
    return stopTimer;
  }, [isHovered, startTimer, stopTimer]);

  const goTo = (i: number) => {
    setIdx(i);
    startTimer();
  };

  const next = () => goTo((idx + 1) % FEATURED.length);
  const prev = () => goTo((idx - 1 + FEATURED.length) % FEATURED.length);

  return (
    <section
      className="relative mb-24"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Decorative top brushstroke */}
      <div className="mx-auto mb-6 w-24 brushstroke-divider" />

      <div className="painting-frame relative h-80 overflow-hidden sm:h-[420px] lg:h-[500px]">
        {/* Hero spotlight */}
        <div
          className="painting-glow !opacity-100"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 0%, color-mix(in oklch, var(--gold) 8%, transparent), transparent 70%)",
          }}
        />

        {/* Particle canvas — no key, React updates props; cleanup disposes old WebGL before new init */}
        <div className="absolute inset-0" style={{ zIndex: 2 }}>
          <ParticlePainting
            artwork={artwork}
            className="h-full w-full"
          />
        </div>

        {/* Museum placard — bottom-left */}
        <div className="pointer-events-none absolute bottom-5 left-5 z-10">
          <div className="plaque-gold rounded px-4 py-2.5">
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-gold/50">
              Featured Artwork
            </p>
            <p
              className="mt-0.5 text-sm font-semibold text-gold sm:text-base"
              style={{ fontFamily: "var(--font-heading), serif" }}
            >
              {artwork.title}
            </p>
            <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground/60">
              {artwork.artist} &middot; {artwork.year}
            </p>
            <p className="text-[9px] text-muted-foreground/40">
              {artwork.period}
            </p>
          </div>
        </div>

        {/* Navigation — bottom-right */}
        <div className="pointer-events-auto absolute bottom-5 right-5 z-10 flex items-center gap-2">
          <button
            onClick={prev}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/15 text-gold/50 transition-all hover:border-gold/40 hover:text-gold"
            aria-label="Previous artwork"
          >
            <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
              <path
                d="M7 1L3 5L7 9"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <span className="px-2 font-mono text-[10px] tabular-nums text-gold/60">
            {idx + 1} / {FEATURED.length}
          </span>

          <button
            onClick={next}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/15 text-gold/50 transition-all hover:border-gold/40 hover:text-gold"
            aria-label="Next artwork"
          >
            <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
              <path
                d="M3 1L7 5L3 9"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Bottom fade */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-24"
          style={{
            background:
              "linear-gradient(to top, #0a0a12 0%, transparent 100%)",
            zIndex: 3,
          }}
        />
      </div>

      {/* Index dots */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {FEATURED.map((a, i) => (
          <button
            key={a.id}
            onClick={() => goTo(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === idx
                ? "w-6 bg-gold"
                : "w-1.5 bg-gold/20 hover:bg-gold/40"
            }`}
            aria-label={`Go to ${a.title}`}
          />
        ))}
      </div>

      {/* Interaction hint */}
      <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/40">
        Move cursor across canvas &middot; Auto-rotating through the collection
      </p>
    </section>
  );
}
