import {
  ALL_EFFECTS,
  ENTRANCE_EFFECTS,
  HOVER_EFFECTS,
  ENTRANCE_CATEGORIES,
  HOVER_CATEGORIES,
  groupByCategory,
  type Effect,
} from "@/lib/effects";
import { EffectHero, EffectMiniCard } from "@/components/effect-cards";

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
          <EffectMiniCard key={e.slug} effect={e} />
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
        {/* Hero text */}
        <section className="mb-12 text-center">
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
        </section>

        {/* Live hero canvas */}
        <EffectHero effects={HOVER_EFFECTS} />

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
            {ALL_EFFECTS.length} effects total · {HOVER_EFFECTS.filter((e) => e.implemented).length} live demos
          </p>
        </footer>
      </div>
    </main>
  );
}
