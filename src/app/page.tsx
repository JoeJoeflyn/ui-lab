import Link from "next/link";
import {
  ALL_EFFECTS,
  ENTRANCE_EFFECTS,
  HOVER_EFFECTS,
  ENTRANCE_CATEGORIES,
  HOVER_CATEGORIES,
  groupByCategory,
  type Effect,
} from "@/lib/effects";

function EffectCard({ effect }: { effect: Effect }) {
  return (
    <Link
      href={`/effects/${effect.slug}`}
      className="group block rounded-lg border border-border bg-card p-4 transition-colors hover:border-accent-foreground/40 hover:bg-muted/40"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-card-foreground group-hover:text-accent-foreground">
          {effect.name}
        </h3>
        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {effect.specRef}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {effect.feel}
      </p>
      <p className="mt-2 font-mono text-[10px] text-muted-foreground/70">
        {effect.technique}
      </p>
    </Link>
  );
}

function CategorySection({
  title,
  effects,
}: {
  title: string;
  effects: Effect[];
}) {
  if (effects.length === 0) return null;
  return (
    <section className="mb-16">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}{" "}
        <span className="ml-1 text-muted-foreground/50">({effects.length})</span>
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {effects.map((e) => (
          <EffectCard key={e.slug} effect={e} />
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  const hoverGrouped = groupByCategory(HOVER_EFFECTS);
  const entranceGrouped = groupByCategory(ENTRANCE_EFFECTS);

  return (
    <main className="relative min-h-screen">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 dot-grid opacity-40" />
      <div
        className="glow-orb bg-accent-foreground"
        style={{ top: "-10%", left: "20%", width: "400px", height: "400px" }}
      />
      <div
        className="glow-orb bg-accent-magenta"
        style={{ bottom: "-10%", right: "10%", width: "500px", height: "500px" }}
      />

      <div className="relative mx-auto max-w-7xl px-6 py-16">
        {/* Hero */}
        <section className="mb-20 text-center">
          <h1
            className="text-4xl font-black tracking-tight sm:text-6xl"
            style={{ fontFamily: "var(--font-heading), sans-serif" }}
          >
            UI<span className="text-accent-foreground">Lab</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            A gallery of GPU shader-based particle text effects.{" "}
            <span className="text-foreground">{HOVER_EFFECTS.length} hover</span>{" "}
            interactions and{" "}
            <span className="text-foreground">
              {ENTRANCE_EFFECTS.length} entrance
            </span>{" "}
            animations — each with a live preview and copy-paste code.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-xs">
            <a
              href="#hover"
              className="rounded-full border border-border bg-card px-4 py-2 text-card-foreground transition-colors hover:border-accent-foreground/40"
            >
              Hover effects
            </a>
            <a
              href="#entrance"
              className="rounded-full border border-border bg-card px-4 py-2 text-card-foreground transition-colors hover:border-accent-foreground/40"
            >
              Entrance animations
            </a>
            <a
              href="/PARTICLE_EFFECTS.md"
              className="rounded-full border border-border bg-card px-4 py-2 text-card-foreground transition-colors hover:border-accent-foreground/40"
            >
              Design spec
            </a>
          </div>
        </section>

        {/* Hover effects */}
        <section id="hover" className="mb-24">
          <div className="mb-8 flex items-baseline justify-between">
            <h2
              className="text-2xl font-bold sm:text-3xl"
              style={{ fontFamily: "var(--font-heading), sans-serif" }}
            >
              Hover / Interaction
            </h2>
            <span className="text-sm text-muted-foreground">
              {HOVER_EFFECTS.length} effects
            </span>
          </div>
          {(Object.keys(HOVER_CATEGORIES) as Array<keyof typeof HOVER_CATEGORIES>).map(
            (cat) => (
              <CategorySection
                key={cat}
                title={HOVER_CATEGORIES[cat]}
                effects={hoverGrouped[cat] ?? []}
              />
            ),
          )}
        </section>

        {/* Entrance effects */}
        <section id="entrance" className="mb-24">
          <div className="mb-8 flex items-baseline justify-between">
            <h2
              className="text-2xl font-bold sm:text-3xl"
              style={{ fontFamily: "var(--font-heading), sans-serif" }}
            >
              Entrance Animations
            </h2>
            <span className="text-sm text-muted-foreground">
              {ENTRANCE_EFFECTS.length} effects
            </span>
          </div>
          {(
            Object.keys(ENTRANCE_CATEGORIES) as Array<
              keyof typeof ENTRANCE_CATEGORIES
            >
          ).map((cat) => (
            <CategorySection
              key={cat}
              title={ENTRANCE_CATEGORIES[cat]}
              effects={entranceGrouped[cat] ?? []}
            />
          ))}
        </section>

        {/* Footer */}
        <footer className="border-t border-border pt-8 text-center text-xs text-muted-foreground">
          <p>
            {ALL_EFFECTS.length} effects total · Spec at{" "}
            <Link
              href="/PARTICLE_EFFECTS.md"
              className="text-accent-foreground hover:underline"
            >
              PARTICLE_EFFECTS.md
            </Link>
          </p>
        </footer>
      </div>
    </main>
  );
}
