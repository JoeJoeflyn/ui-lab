import Link from "next/link";
import { notFound } from "next/navigation";
import { ALL_EFFECTS, getEffectBySlug } from "@/lib/effects";

export function generateStaticParams() {
  return ALL_EFFECTS.map((e) => ({ slug: e.slug }));
}

export default function EffectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Next 15+ async params — but generateStaticParams makes this synchronous-safe.
  // We resolve synchronously via the lookup since slugs are pre-rendered.
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

  return (
    <main className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 dot-grid opacity-40" />

      <div className="relative mx-auto max-w-5xl px-6 py-12">
        {/* Breadcrumb */}
        <Link
          href="/"
          className="mb-8 inline-block text-xs text-muted-foreground hover:text-accent-foreground"
        >
          ← Back to gallery
        </Link>

        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
                {effect.kind}
              </span>
              <span className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                {effect.category}
              </span>
              <span className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                {effect.specRef}
              </span>
            </div>
            <h1
              className="text-3xl font-bold sm:text-4xl"
              style={{ fontFamily: "var(--font-heading), sans-serif" }}
            >
              {effect.name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              {effect.feel}
            </p>
          </div>
        </div>

        {/* Live preview placeholder */}
        <section className="mb-10">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Live preview
          </h2>
          <div className="flex h-64 items-center justify-center rounded-lg border border-border bg-card">
            <p className="text-sm text-muted-foreground">
              Particle canvas mounts here — implementation pending.
            </p>
          </div>
        </section>

        {/* Technique */}
        <section className="mb-10">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Key technique
          </h2>
          <p className="font-mono text-xs text-card-foreground">
            {effect.technique}
          </p>
        </section>

        {/* Code example */}
        <section className="mb-10">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Usage
          </h2>
          <pre className="overflow-x-auto rounded-lg border border-border bg-card p-4 font-mono text-xs text-card-foreground">
            <code>{codeExample}</code>
          </pre>
        </section>

        {/* Neighbors */}
        <section className="mb-10">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            More in {effect.category}
          </h2>
          <div className="flex flex-wrap gap-2">
            {ALL_EFFECTS.filter(
              (e) => e.category === effect.category && e.slug !== effect.slug,
            )
              .slice(0, 8)
              .map((e) => (
                <Link
                  key={e.slug}
                  href={`/effects/${e.slug}`}
                  className="rounded-full border border-border bg-card px-3 py-1 text-xs text-card-foreground transition-colors hover:border-accent-foreground/40 hover:text-accent-foreground"
                >
                  {e.name}
                </Link>
              ))}
          </div>
        </section>
      </div>
    </main>
  );
}
