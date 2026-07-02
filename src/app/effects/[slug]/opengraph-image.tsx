import { ImageResponse } from "next/og";
import { getEffectBySlug, ALL_EFFECTS } from "@/lib/effects";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export async function generateStaticParams() {
  return ALL_EFFECTS.map((e) => ({ slug: e.slug }));
}

export default async function EffectOGImage({
  params,
}: {
  params: { slug: string };
}) {
  const effect = getEffectBySlug(params.slug);
  if (!effect) {
    return new ImageResponse(<div>Not found</div>, { ...size });
  }

  const kindLabel = effect.kind === "hover" ? "HOVER EFFECT" : "ENTRANCE ANIMATION";
  const statusLabel = effect.implemented ? "LIVE" : "COMING SOON";
  const statusColor = effect.implemented ? "#c9a227" : "#5a6a8a";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(ellipse 80% 50% at 50% 100%, rgba(30,25,60,0.6), transparent), radial-gradient(ellipse 60% 40% at 85% 20%, rgba(100,160,220,0.12), transparent), #0a0c14",
          fontFamily: "Georgia, serif",
          position: "relative",
        }}
      >
        {/* Kind label — top */}
        <div
          style={{
            position: "absolute",
            top: 60,
            fontSize: 14,
            fontFamily: "monospace",
            color: "#6a7a9a",
            textTransform: "uppercase",
            letterSpacing: "0.3em",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ color: statusColor, fontSize: 12, border: `1px solid ${statusColor}`, padding: "2px 10px", borderRadius: 4 }}>
            {statusLabel}
          </span>
          <span>{kindLabel}</span>
        </div>

        {/* Logo mark */}
        <svg width="44" height="44" viewBox="0 0 28 28" fill="none" style={{ marginBottom: 16, opacity: 0.6 }}>
          <circle cx="14" cy="14" r="12" stroke="#c9a227" strokeWidth="1" opacity="0.3" />
          <circle cx="14" cy="14" r="7" stroke="#c9a227" strokeWidth="1" opacity="0.5" />
          <circle cx="14" cy="14" r="2.5" fill="#c9a227" />
        </svg>

        {/* Effect name — large */}
        <div
          style={{
            fontSize: 88,
            fontWeight: 900,
            color: "#e8c44a",
            letterSpacing: "-0.03em",
            marginBottom: 16,
            display: "flex",
          }}
        >
          {effect.name}
        </div>

        {/* Feel description */}
        <div
          style={{
            fontSize: 24,
            color: "#8a9ab8",
            fontFamily: "Georgia, serif",
            fontStyle: "italic",
            marginBottom: 24,
            maxWidth: 800,
            textAlign: "center",
          }}
        >
          {effect.feel}
        </div>

        {/* Technique */}
        <div
          style={{
            fontSize: 16,
            color: "#5a6a8a",
            fontFamily: "monospace",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            marginBottom: 40,
          }}
        >
          {effect.technique}
        </div>

        {/* Brand footer */}
        <div
          style={{
            position: "absolute",
            bottom: 50,
            fontSize: 18,
            fontFamily: "monospace",
            color: "#6a7a9a",
            textTransform: "uppercase",
            letterSpacing: "0.25em",
            display: "flex",
            gap: 12,
          }}
        >
          <span style={{ color: "#c9a227", fontWeight: 700 }}>UI Lab</span>
          <span style={{ color: "#3a4a7a" }}>·</span>
          <span>GLSL · Three.js · WebGL</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
