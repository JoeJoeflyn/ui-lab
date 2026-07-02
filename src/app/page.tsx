import {
  ALL_EFFECTS,
  ENTRANCE_EFFECTS,
  HOVER_EFFECTS,
  ENTRANCE_CATEGORIES,
  HOVER_CATEGORIES,
  groupByCategory,
  type Effect,
} from "@/lib/effects";
import { EffectMiniCard } from "@/components/effect-cards";
import { ArtworkHero } from "@/components/artwork-hero";
import { ArtworkExhibit } from "@/components/artwork-exhibit";
import { AsciiArt } from "@/components/ascii-art";
import { AntText } from "@/components/ant-text";
import { FooterAntPainting } from "@/components/footer-ant-painting";

function CategorySection({
  title,
  effects,
  startIndex,
}: {
  title: string;
  effects: Effect[];
  startIndex: number;
}) {
  if (effects.length === 0) return null;

  return (
    <div className="mb-10 last:mb-0">
      {/* Category header — small gold label + count + brushstroke divider */}
      <div className="mb-5 flex items-center gap-3">
        <span className="inline-block h-px w-5 bg-gold/40" />
        <h3 className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-gold/65">
          {title}
        </h3>
        <span className="gold-pill text-[8px]">{effects.length} works</span>
        <div className="brushstroke-divider flex-1" />
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {effects.map((e, i) => (
          <EffectMiniCard key={e.slug} effect={e} index={startIndex + i} />
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const hoverGrouped = groupByCategory(HOVER_EFFECTS);
  const entranceGrouped = groupByCategory(ENTRANCE_EFFECTS);

  const hoverCategories = Object.keys(HOVER_CATEGORIES) as Array<
    keyof typeof HOVER_CATEGORIES
  >;
  const entranceCategories = Object.keys(ENTRANCE_CATEGORIES) as Array<
    keyof typeof ENTRANCE_CATEGORIES
  >;

  // Running index for staggered card reveals
  let cardIndex = 0;

  return (
    <main className="relative overflow-clip brushstroke-bg">
      {/* ===== Grain Texture Overlay ===== */}
      <div className="grain-overlay" aria-hidden="true" />

      {/* ===== Swirling Background Orbs ===== */}
      <div className="swirl-orb swirl-orb--cyan" aria-hidden="true" />
      <div className="swirl-orb swirl-orb--gold" aria-hidden="true" />
      <div className="swirl-orb swirl-orb--blue" aria-hidden="true" />
      <div className="swirl-orb swirl-orb--indigo" aria-hidden="true" />

      {/* ===== Content ===== */}
      <div className="relative mx-auto max-w-7xl px-6 py-16 sm:py-20">
        {/* ---- Hero / Museum Entrance ---- */}
        <section className="mb-12 text-center sm:mb-16">
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.35em] text-gold/55">
            Gallery of GPU Shader Art
          </p>

          <h1
            className="gold-shimmer text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl"
            style={{ fontFamily: "var(--font-heading), serif" }}
          >
            UI Lab
          </h1>

          <div className="mx-auto mt-6 mb-6 h-px w-28 brushstroke-divider" />

          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            An exhibition of{" "}
            <span className="text-gold">
              {HOVER_EFFECTS.length} interactive
            </span>{" "}
            and{" "}
            <span className="text-starry-cyan">
              {ENTRANCE_EFFECTS.length} cinematic
            </span>{" "}
            particle text effects — each rendered in real-time with GLSL shaders.
            Hover to interact. Click to enter.
          </p>
        </section>

        {/* ---- Centerpiece Exhibit ---- */}
        <ArtworkHero />

        {/* ================================================================
            WEST WING — Interactive Effects (Hover)
            ================================================================ */}
        <section id="west-wing" className="mb-28">
          {/* Wing header */}
          <div className="mb-12">
            <div className="mb-4 flex items-center gap-4">
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.3em] text-gold/40">
                West Wing
              </span>
              <div className="brushstroke-divider flex-1" />
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h2
                  className="text-3xl font-bold text-card-foreground sm:text-4xl"
                  style={{ fontFamily: "var(--font-heading), serif" }}
                >
                  Interactive Effects
                </h2>
                <p className="mt-1.5 max-w-lg text-xs leading-relaxed text-muted-foreground/80">
                  Move your cursor over each painting to reveal the particle effect.
                  Each piece responds to your touch like a living canvas.
                </p>
              </div>
              <span className="gold-pill text-[9px]">
                {HOVER_EFFECTS.length} works
              </span>
            </div>
          </div>

          {/* Category groups */}
          {hoverCategories.map((cat) => {
            const start = cardIndex;
            const effects = hoverGrouped[cat] ?? [];
            cardIndex += effects.length;
            return (
              <CategorySection
                key={cat}
                title={HOVER_CATEGORIES[cat]}
                effects={effects}
                startIndex={start}
              />
            );
          })}
        </section>

        {/* ================================================================
            EAST WING — Cinematic Animations (Entrance)
            ================================================================ */}
        <section id="east-wing" className="mb-28">
          {/* Wing header */}
          <div className="mb-12">
            <div className="mb-4 flex items-center gap-4">
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.3em] text-starry-cyan/50">
                East Wing
              </span>
              <div className="brushstroke-divider flex-1" />
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h2
                  className="text-3xl font-bold text-card-foreground sm:text-4xl"
                  style={{ fontFamily: "var(--font-heading), serif" }}
                >
                  Cinematic Animations
                </h2>
                <p className="mt-1.5 max-w-lg text-xs leading-relaxed text-muted-foreground/80">
                  Watch particles assemble into text through carefully choreographed
                    entrance animations. Each transition tells a story.
                </p>
              </div>
              <span className="gold-pill text-[9px]">
                {ENTRANCE_EFFECTS.length} works
              </span>
            </div>
          </div>

          {/* Category groups */}
          {entranceCategories.map((cat) => {
            const effects = entranceGrouped[cat] ?? [];
            const start = cardIndex;
            cardIndex += effects.length;
            return (
              <CategorySection
                key={cat}
                title={ENTRANCE_CATEGORIES[cat]}
                effects={effects}
                startIndex={start}
              />
            );
          })}
        </section>

        {/* ================================================================
            SALON — Particle Paintings
            ================================================================ */}
        <div id="salon" className="mb-28">
          {/* Section header */}
          <div className="mb-12">
            <div className="mb-4 flex items-center gap-4">
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.3em] text-gold/40">
                Salon
              </span>
              <div className="brushstroke-divider flex-1" />
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h2
                  className="text-3xl font-bold text-card-foreground sm:text-4xl"
                  style={{ fontFamily: "var(--font-heading), serif" }}
                >
                  Particle Paintings
                </h2>
                <p className="mt-1.5 max-w-lg text-xs leading-relaxed text-muted-foreground/80">
                  Masterworks rendered as thousands of GPU particles.
                  Hover to scatter — watch them reform into the painting.
                </p>
              </div>
            </div>
          </div>
          <ArtworkExhibit />
        </div>

        {/* ================================================================
            TERMINAL — ASCII Art Animation
            ================================================================ */}
        <section id="ascii" className="mb-28 scroll-mt-8">
          {/* Section header */}
          <div className="mb-12">
            <div className="mb-4 flex items-center gap-4">
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.3em] text-gold/40">
                Terminal
              </span>
              <div className="brushstroke-divider flex-1" />
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h2
                  className="text-3xl font-bold text-card-foreground sm:text-4xl"
                  style={{ fontFamily: "var(--font-heading), serif" }}
                >
                  ASCII Animation
                </h2>
                <p className="mt-1.5 max-w-lg text-xs leading-relaxed text-muted-foreground/80">
                  Figlet-rendered text art cycling through the gallery's core themes.
                  Animated with character dissolve transitions and CRT scanline effects.
                </p>
              </div>
            </div>
          </div>

          {/* ASCII art terminal component */}
          <AsciiArt />
        </section>

        {/* ================================================================
            ANT COLONY — AntText swarm
            ================================================================ */}
        <section id="colony" className="mb-28 scroll-mt-8">
          {/* Section header */}
          <div className="mb-12">
            <div className="mb-4 flex items-center gap-4">
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.3em] text-gold/40">
                Colony
              </span>
              <div className="brushstroke-divider flex-1" />
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h2
                  className="text-3xl font-bold text-card-foreground sm:text-4xl"
                  style={{ fontFamily: "var(--font-heading), serif" }}
                >
                  Ant Text
                </h2>
                <p className="mt-1.5 max-w-lg text-xs leading-relaxed text-muted-foreground/80">
                  1,500 ants with detailed sprites — body, legs, antennae — crawl across the canvas,
                  wandering and stopping like a real colony. They converge to form words, scatter, and reform.
                </p>
              </div>
              <span className="gold-pill text-[9px]">auto-cycling</span>
            </div>
          </div>

          <AntText />
        </section>

        {/* ================================================================
            FOOTER — Ant colony paintings + museum plaque
            Painting fills the footer, text sits in a compact bar at bottom
            ================================================================ */}
        <footer className="relative mt-8 overflow-hidden rounded-xl border border-gold/25 bg-card">
          {/* GPU particle colony forming paintings — fills footer */}
          <div className="relative h-[360px] w-full bg-black">
            <FooterAntPainting />
          </div>

          {/* Content bar — below painting, solid background, no overlap */}
          <div className="border-t border-gold/20 bg-background px-8 py-8">
            <div className="mx-auto max-w-3xl text-center">
              {/* Logo mark + name */}
              <div className="mx-auto mb-4 flex items-center justify-center gap-3">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-gold">
                  <circle cx="14" cy="14" r="12" stroke="currentColor" strokeWidth="1" opacity="0.4" />
                  <circle cx="14" cy="14" r="7" stroke="currentColor" strokeWidth="1" opacity="0.6" />
                  <circle cx="14" cy="14" r="2.5" fill="currentColor" />
                  <circle cx="14" cy="2" r="1" fill="currentColor" opacity="0.7" />
                  <circle cx="26" cy="14" r="1" fill="currentColor" opacity="0.7" />
                  <circle cx="14" cy="26" r="1" fill="currentColor" opacity="0.7" />
                  <circle cx="2" cy="14" r="1" fill="currentColor" opacity="0.7" />
                </svg>
                <span
                  className="text-lg font-bold tracking-tight text-foreground"
                  style={{ fontFamily: "var(--font-heading), serif" }}
                >
                  UI Lab
                </span>
              </div>

              {/* Collection stats */}
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <span className="text-gold">
                  {HOVER_EFFECTS.filter((e) => e.implemented).length} live exhibits
                </span>
                <span className="mx-2 text-muted-foreground/40">·</span>
                <span className="text-starry-cyan">
                  {ENTRANCE_EFFECTS.filter((e) => e.implemented).length} cinematic
                </span>
                <span className="mx-2 text-muted-foreground/40">·</span>
                <span className="text-foreground">{ALL_EFFECTS.length} works</span>
              </p>

              {/* Tech stack + Links — inline */}
              <div className="flex flex-wrap items-center justify-center gap-4 font-mono text-[10px] uppercase tracking-[0.2em]">
                <span className="text-muted-foreground">GLSL</span>
                <span className="text-muted-foreground/30">·</span>
                <span className="text-muted-foreground">Three.js</span>
                <span className="text-muted-foreground/30">·</span>
                <span className="text-muted-foreground">Next.js</span>
                <span className="mx-2 text-gold/40">|</span>
                <a
                  href="https://github.com/JoeJoeflyn/ui-lab"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground transition-colors hover:text-gold"
                >
                  GitHub
                </a>
                <span className="text-muted-foreground/40">·</span>
                <span className="text-foreground">MIT License</span>
              </div>

              {/* Tagline */}
              <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
                Crafted with GPU particles & GLSL shaders
              </p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
