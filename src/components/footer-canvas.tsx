"use client";

import { useState, useEffect } from "react";
import { ARTWORKS, FOOTER_ARTWORKS } from "@/lib/artworks";
import { ParticlePainting } from "@/components/particle-painting";

const FEATURED = [
  ...ARTWORKS.filter((a) =>
    ["starry-night", "the-great-wave", "the-kiss", "the-scream", "last-supper", "declaration-independence"].includes(a.id)
  ),
  ...FOOTER_ARTWORKS,
];

export function FooterCanvas() {
  const [artIdx, setArtIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setArtIdx((i) => (i + 1) % FEATURED.length);
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  const artwork = FEATURED[artIdx % FEATURED.length];
  if (!artwork) return null;

  return (
    <div className="absolute inset-0 z-0">
      <ParticlePainting
        artwork={artwork}
        className="h-full w-full"
        cursorRadius={120}
        scatterStrength={5}
        sampleWidth={800}
        sampleStep={1}
      />

      {/* Artwork label */}
      <div className="pointer-events-none absolute bottom-3 left-4 z-20 font-mono text-[8px] uppercase tracking-[0.15em] text-gold/60">
        <span className="text-gold/80">{artwork.title}</span>
        <span className="mx-1.5 text-muted-foreground/50">·</span>
        <span className="text-muted-foreground/60">{artwork.artist}</span>
      </div>

      {/* Hint */}
      <div className="pointer-events-none absolute bottom-3 right-4 z-20 font-mono text-[8px] uppercase tracking-[0.2em] text-gold/50">
        move · click to burst
      </div>
    </div>
  );
}
