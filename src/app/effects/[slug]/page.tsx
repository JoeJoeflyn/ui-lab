import Link from "next/link";
import { notFound } from "next/navigation";
import { ALL_EFFECTS, getEffectBySlug } from "@/lib/effects";
import { EffectPreview } from "@/components/effect-preview";
import { CodeBlock } from "@/components/code-block";

export function generateStaticParams() {
  return ALL_EFFECTS.map((e) => ({ slug: e.slug }));
}

export default function EffectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return <EffectPageInner params={params} />;
}

async function EffectPageInner({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const effect = getEffectBySlug(slug);
  if (!effect) notFound();

  const codeExample = `<ParticleText
  text="UI Lab"
  hoverMode="${effect.kind === "hover" ? effect.slug : "dissolve"}"${
    effect.kind === "entrance"
      ? `\n  entrance="${effect.slug}"`
      : ""
  }
  particleCount={8000}
  cursorRadius={120}
  falloff="gaussian"
/>`;

  const installCode = `# Install
pnpm add three

# Copy these files to your project:
#   src/lib/particle-sampler.ts
#   src/lib/glsl-effects.ts
#   src/components/particle-text.tsx

# Then import and use:
import { ParticleText } from "@/components/particle-text";`;

  const usageCode = `"use client";
import { ParticleText } from "@/components/particle-text";

export function MyComponent() {
  return (
    <div className="h-64 w-full">
      <ParticleText
        text="Hello World"
        hoverMode="${effect.kind === "hover" ? effect.slug : "dissolve"}"
        particleCount={8000}
        cursorRadius={120}
        color={[0.6, 0.75, 0.9]}
        glowColor={[0.95, 0.75, 0.3]}
        opacity={0.9}
      />
    </div>
  );
}`;

  return (
    <main className="relative min-h-screen brushstroke-bg">
      <div className="pointer-events-none fixed inset-0 swirl-overlay" />
      <div
        className="glow-orb bg-starry-blue"
        style={{ top: "0%", left: "10%", width: "400px", height: "400px" }}
      />

      <div className="relative mx-auto max-w-5xl px-6 py-16">
        {/* Breadcrumb */}
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-2 text-xs text-gold/60 transition-colors hover:text-gold"
        >
          <span>←</span>
          <span className="uppercase tracking-[0.2em]">Back to Gallery</span>
        </Link>

        {/* Header — exhibit plaque */}
        <div className="mb-10">
          <div className="mb-3 flex items-center gap-2">
            <span className="plaque rounded px-2 py-0.5 font-mono text-[10px] uppercase text-gold/60">
              {effect.kind}
            </span>
            <span className="plaque rounded px-2 py-0.5 font-mono text-[10px] text-starry-cyan/60">
              {effect.category}
            </span>
            <span className="plaque rounded px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
              {effect.specRef}
            </span>
          </div>
          <h1
            className="text-4xl font-bold sm:text-5xl"
            style={{ fontFamily: "var(--font-heading), serif" }}
          >
            <span className="gold-shimmer">{effect.name}</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            {effect.feel}
          </p>
        </div>

        {/* Live preview — the exhibit */}
        <section className="mb-12">
          <div className="mb-4 flex items-center gap-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold/60">
              The Exhibit
            </h2>
            <div className="brushstroke-divider flex-1" />
          </div>
          <EffectPreview effect={effect} />
          {!effect.implemented && (
            <p className="mt-3 text-center text-xs text-muted-foreground/60">
              This work has not yet been installed in the gallery
            </p>
          )}
        </section>

        {/* Technique — artist's notes */}
        <section className="mb-12">
          <div className="mb-4 flex items-center gap-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold/60">
              Technique
            </h2>
            <div className="brushstroke-divider flex-1" />
          </div>
          <div className="plaque rounded-lg p-4">
            <p className="font-mono text-xs text-card-foreground/80">
              {effect.technique}
            </p>
          </div>
        </section>

        {/* Code example — the blueprint */}
        <section className="mb-12">
          <div className="mb-4 flex items-center gap-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold/60">
              Blueprint
            </h2>
            <div className="brushstroke-divider flex-1" />
          </div>
          <CodeBlock code={codeExample} language="tsx" />
        </section>

        {/* How to use — installation + usage */}
        <section className="mb-12">
          <div className="mb-4 flex items-center gap-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold/60">
              How to Use
            </h2>
            <div className="brushstroke-divider flex-1" />
          </div>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs text-muted-foreground/60">1. Install dependencies</p>
              <CodeBlock code={installCode} language="bash" />
            </div>
            <div>
              <p className="mb-2 text-xs text-muted-foreground/60">2. Use in your component</p>
              <CodeBlock code={usageCode} language="tsx" />
            </div>
          </div>
        </section>

        {/* Neighbors — more in the collection */}
        <section className="mb-12">
          <div className="mb-4 flex items-center gap-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold/60">
              More in {effect.category}
            </h2>
            <div className="brushstroke-divider flex-1" />
          </div>
          <div className="flex flex-wrap gap-3">
            {ALL_EFFECTS.filter(
              (e) => e.category === effect.category && e.slug !== effect.slug,
            )
              .slice(0, 12)
              .map((e) => (
                <Link
                  key={e.slug}
                  href={`/effects/${e.slug}`}
                  className="plaque rounded-full px-4 py-2 text-xs text-card-foreground/70 transition-colors hover:text-gold"
                >
                  {e.name}
                  {e.implemented && (
                    <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-gold/60" />
                  )}
                </Link>
              ))}
          </div>
        </section>
      </div>
    </main>
  );
}
