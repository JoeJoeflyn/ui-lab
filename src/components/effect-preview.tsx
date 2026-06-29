"use client";

import { ParticleText } from "@/components/particle-text";
import type { Effect } from "@/lib/effects";

/**
 * EffectPreview — client-side live preview for the detail page.
 * Renders the real ParticleText for implemented effects,
 * or a placeholder for effects not yet built.
 */
export function EffectPreview({ effect }: { effect: Effect }) {
  if (!effect.implemented) {
    return (
      <div className="painting-frame flex h-72 items-center justify-center rounded-xl bg-card">
        <div className="text-center">
          <p
            className="text-3xl font-bold text-muted-foreground/30"
            style={{ fontFamily: "var(--font-heading), serif" }}
          >
            {effect.name}
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-gold/40">
            Coming to the gallery
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="painting-frame h-72 overflow-hidden rounded-xl bg-card sm:h-80">
      <ParticleText
        text="UI Lab"
        hoverMode={(effect.kind === "entrance" ? "dissolve" : effect.slug) as never}
        entranceMode={effect.kind === "entrance" ? (effect.slug as never) : undefined}
        entranceLoop={effect.kind === "entrance"}
        particleCount={12000}
        cursorRadius={160}
        color={[0.6, 0.75, 0.9]}
        glowColor={[0.95, 0.75, 0.3]}
        opacity={0.9}
        idleAnimation={effect.kind === "hover"}
      />
    </div>
  );
}
