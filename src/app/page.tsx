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
    <section className="mb-20">
      <div className="mb-6 flex items-center gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-gold/80">
          {title}
        </h2>
        <span className="text-xs text-muted-foreground/60">
          {effects.length} works
        </span>
        <div className="brushstroke-divider flex-1" />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
    <main className="relative min-h-screen brushstroke-bg">
      {/* Swirling overlay */}
      <div className="pointer-events-none fixed inset-0 swirl-overlay" />

      {/* Ambient glow orbs — Starry Night colors */}
      <div
        className="glow-orb bg-starry-blue"
        style={{ top: "-5%", left: "15%", width: "500px", height: "500px" }}
      />
      <div
        className="glow-orb bg-gold"
        style={{ top: "30%", right: "5%", width: "400px", height: "400px" }}
      />
      <div
        className="glow-orb bg-starry-cyan"
        style={{ bottom: "10%", left: "40%", width: "450px", height: "450px" }}
      />

      <div className="relative mx-auto max-w-7xl px-6 py-20">
        {/* Hero — museum entrance */}
        <section className="mb-16 text-center">
          <p className="mb-4 text-xs uppercase tracking-[0.3em] text-gold/60">
            Gallery of GPU Shader Art
          </p>
          <h1
            className="text-5xl font-black tracking-tight sm:text-7xl"
            style={{ fontFamily: "var(--font-heading), serif" }}
          >
            <span className="gold-shimmer">UI Lab</span>
          </h1>
          <div className="mx-auto mt-6 mb-8 h-px w-32 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            An exhibition of{" "}
            <span className="text-gold">{HOVER_EFFECTS.length} interactive</span>{" "}
            and{" "}
            <span className="text-starry-cyan">
              {ENTRANCE_EFFECTS.length} cinematic
            </span>{" "}
            particle text effects — each rendered in real-time with GLSL shaders.
            Hover to interact. Click to enter.
          </p>
        </section>

        {/* Live hero canvas — the centerpiece */}
        <EffectHero effects={HOVER_EFFECTS} />

        {/* Gallery navigation */}
        <div className="mb-16 flex flex-wrap justify-center gap-4 text-xs">
          <a
            href="#hover"
            className="plaque rounded-full px-5 py-2 text-gold/80 transition-colors hover:text-gold"
          >
            Interactive Gallery
          </a>
          <a
            href="#entrance"
            className="plaque rounded-full px-5 py-2 text-starry-cyan/80 transition-colors hover:text-starry-cyan"
          >
            Cinematic Collection
          </a>
        </div>

        {/* Hover effects — West Wing */}
        <section id="hover" className="mb-28">
          <div className="mb-10 flex items-baseline justify-between">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-gold/50">
                West Wing
              </p>
              <h2
                className="text-3xl font-bold sm:text-4xl"
                style={{ fontFamily: "var(--font-heading), serif" }}
              >
                Interactive Effects
              </h2>
            </div>
            <span className="text-sm text-muted-foreground">
              {HOVER_EFFECTS.length} works on display
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

        {/* Entrance effects — East Wing */}
        <section id="entrance" className="mb-28">
          <div className="mb-10 flex items-baseline justify-between">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-starry-cyan/50">
                East Wing
              </p>
              <h2
                className="text-3xl font-bold sm:text-4xl"
                style={{ fontFamily: "var(--font-heading), serif" }}
              >
                Cinematic Animations
              </h2>
            </div>
            <span className="text-sm text-muted-foreground">
              {ENTRANCE_EFFECTS.length} works on display
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

        {/* Footer — museum plaque */}
        <footer className="border-t border-gold/10 pt-10 text-center">
          <div className="mx-auto mb-4 h-px w-24 bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          <p className="text-xs text-muted-foreground">
            {ALL_EFFECTS.length} works in the collection ·{" "}
            <span className="text-gold">
              {HOVER_EFFECTS.filter((e) => e.implemented).length} live exhibits
            </span>
          </p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50">
            Curated with GLSL · Powered by Three.js
          </p>
        </footer>
      </div>
    </main>
  );
}
