"use client";

import { useState, useRef, useEffect } from "react";
import { ARTWORKS } from "@/lib/artworks";
import { ParticlePainting } from "@/components/particle-painting";

/* ──────────────────────────────────────────────────────────────
 * ArtworkExhibit — particle painting gallery
 *
 * A dedicated section with a responsive grid of artwork cards.
 * Each card renders the painting as colored particles that
 * scatter on hover and reform when the cursor leaves.
 * ────────────────────────────────────────────────────────────── */

const LOOKUP = new Map(ARTWORKS.map((a) => [a.id, a]));

const DISPLAY_IDS = [
  "starry-night",
  "creation-of-adam",
  "the-great-wave",
  "mona-lisa",
  "birth-of-venus",
  "girl-with-a-pearl-earring",
];

export function ArtworkExhibit() {
  return (
    <section className="mb-20 mt-12">
      {/* Section header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-4">
          <span
            className="font-mono text-[10px] font-medium uppercase tracking-[0.3em]"
            style={{ color: "oklch(0.82 0.16 85 / 40%)" }}
          >
            Salon
          </span>
          <div className="brushstroke-divider flex-1" />
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2
              className="text-2xl font-bold sm:text-3xl"
              style={{
                fontFamily: "var(--font-heading), serif",
                color: "oklch(0.92 0.015 85)",
              }}
            >
              Particle Paintings
            </h2>
            <p
              className="mt-1.5 max-w-lg text-xs leading-relaxed"
              style={{ color: "oklch(0.55 0.03 260 / 80%)" }}
            >
              Masterworks rendered as thousands of GPU particles.
              Hover to scatter — watch them reform into the painting.
            </p>
          </div>
          <span className="gold-pill text-[9px]">{DISPLAY_IDS.length} works</span>
        </div>
      </div>

      {/* Gallery grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {DISPLAY_IDS.map((id, i) => {
          const artwork = LOOKUP.get(id);
          if (!artwork) return null;
          return <ArtworkCard key={artwork.id} artwork={artwork} index={i} />;
        })}
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────
 * ArtworkCard — gold-framed particle painting + plaque
 * ────────────────────────────────────────────────────────────── */
function ArtworkCard({
  artwork,
  index = 0,
}: {
  artwork: (typeof ARTWORKS)[number];
  index?: number;
}) {
  const [visible, setVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), (index % 6) * 60);
          observer.disconnect();
        }
      },
      { threshold: 0.05 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [index]);

  const delayClass = `reveal-delay-${(index % 6) + 1}`;

  return (
    <div
      ref={cardRef}
      className={`group painting-frame ${visible ? "reveal visible" : `reveal ${delayClass}`}`}
    >
      {/* Glow */}
      <div className="painting-glow" />

      {/* Canvas area — image rendered as particles */}
      <div className="relative h-56 overflow-hidden sm:h-64" style={{ zIndex: 2, background: "oklch(0.04 0.02 260)" }}>
        <ParticlePainting
          artwork={artwork}
          className="h-full w-full"
          cursorRadius={90}
          scatterStrength={4}
        />
      </div>

      {/* Plaque */}
      <div className="relative border-t border-gold/10 px-4 py-3" style={{ zIndex: 2 }}>
        <h3
          className="truncate text-sm font-semibold"
          style={{
            fontFamily: "var(--font-heading), serif",
            color: "oklch(0.92 0.015 85)",
          }}
        >
          {artwork.title}
        </h3>
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground/70">
          {artwork.artist}, {artwork.year}
        </p>
      </div>
    </div>
  );
}
