"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
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

const DISPLAY_IDS = ARTWORKS.map((a) => a.id);

export function ArtworkExhibit() {
  return (
    <section className="mb-16">
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
  const [copied, setCopied] = useState(false);
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

  const handleCopy = useCallback(() => {
    const code = `<ParticlePainting
  artwork={artwork}
  className="h-full w-full"
  cursorRadius={90}
  scatterStrength={4}
/>`;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  return (
    <div
      ref={cardRef}
      className={`group painting-frame ${visible ? "reveal visible" : `reveal ${delayClass}`}`}
    >
      {/* Glow */}
      <div className="painting-glow" />

        {/* Canvas area — particles behind image overlay, crossfade on hover */}
        <div className="relative h-56 overflow-hidden sm:h-64" style={{ zIndex: 2, background: "#0a0a12" }}>
          {/* Particles — mount only after entrance animation to stagger WebGL context creation */}
          {visible && (
            <ParticlePainting
              artwork={artwork}
              className="h-full w-full"
              cursorRadius={90}
              scatterStrength={4}
            />
          )}
        {/* Image overlay — fades on hover, pointer-events so particles get mouse */}
        <div className="absolute inset-0 pointer-events-none transition-opacity duration-700 group-hover:opacity-0">
          <Image
            src={artwork.imageUrl}
            alt={`${artwork.title} by ${artwork.artist}`}
            fill
            className="object-contain opacity-70"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      </div>

      {/* Plaque */}
      <div className="relative border-t border-gold/10 px-4 py-3" style={{ zIndex: 2 }}>
        <div className="flex items-start justify-between gap-2">
          <h3
            className="truncate text-sm font-semibold text-card-foreground"
            style={{ fontFamily: "var(--font-heading), serif" }}
          >
            {artwork.title}
          </h3>
          <button
            onClick={handleCopy}
            className={`flex flex-shrink-0 items-center gap-1 rounded-md border px-2 py-1 font-mono text-[9px] uppercase tracking-wider transition-all duration-200 ${copied ? "border-gold/40 text-gold" : "border-gold/15 text-gold/50 hover:border-gold/40"}`}
            aria-label="Copy component code"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground/70">
          {artwork.artist}, {artwork.year}
        </p>
      </div>
    </div>
  );
}
