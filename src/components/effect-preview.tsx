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
      <div className="flex h-64 items-center justify-center rounded-lg border border-border bg-card">
        <div className="text-center">
          <p className="text-2xl font-bold text-muted-foreground/40" style={{ fontFamily: "var(--font-heading), sans-serif" }}>
            {effect.name}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            GLSL shader not yet implemented — coming soon
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 overflow-hidden rounded-lg border border-border bg-card">
      <ParticleText
        text="UI Lab"
        hoverMode={effect.slug as never}
        particleCount={10000}
        cursorRadius={150}
        color={[0.5, 0.75, 0.9]}
        glowColor={[1.0, 0.4, 0.7]}
        opacity={0.9}
        idleAnimation
      />
    </div>
  );
}
