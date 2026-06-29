import { ImageResponse } from "next/og";

export const alt = "UI Lab — Particle Text Gallery";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
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
            "radial-gradient(ellipse 90% 40% at 50% 100%, rgba(20,18,40,0.8), transparent), radial-gradient(ellipse 70% 50% at 80% 15%, rgba(100,160,220,0.15), transparent), radial-gradient(ellipse 50% 40% at 25% 50%, rgba(200,160,60,0.08), transparent), #0c0f1a",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Logo mark */}
        <svg width="64" height="64" viewBox="0 0 28 28" fill="none" style={{ marginBottom: 24 }}>
          <circle cx="14" cy="14" r="12" stroke="#c9a227" strokeWidth="1" opacity="0.3" />
          <circle cx="14" cy="14" r="7" stroke="#c9a227" strokeWidth="1" opacity="0.5" />
          <circle cx="14" cy="14" r="2.5" fill="#c9a227" />
          <circle cx="14" cy="2" r="1" fill="#c9a227" opacity="0.6" />
          <circle cx="26" cy="14" r="1" fill="#c9a227" opacity="0.6" />
          <circle cx="14" cy="26" r="1" fill="#c9a227" opacity="0.6" />
          <circle cx="2" cy="14" r="1" fill="#c9a227" opacity="0.6" />
        </svg>

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: "#e8c44a",
            letterSpacing: "-0.02em",
            marginBottom: 12,
            display: "flex",
          }}
        >
          UI Lab
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 20,
            color: "#8a9ab8",
            fontFamily: "monospace",
            textTransform: "uppercase",
            letterSpacing: "0.3em",
            marginBottom: 32,
          }}
        >
          Gallery of GPU Shader Art
        </div>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            gap: 40,
            fontSize: 28,
            color: "#e8c44a",
            fontFamily: "Georgia, serif",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: 48, fontWeight: 700 }}>50</div>
            <div style={{ fontSize: 14, fontFamily: "monospace", opacity: 0.6, letterSpacing: "0.1em" }}>
              HOVER EFFECTS
            </div>
          </div>
          <div style={{ color: "#3a4a7a", fontSize: 48 }}>·</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: 48, fontWeight: 700 }}>75</div>
            <div style={{ fontSize: 14, fontFamily: "monospace", opacity: 0.6, letterSpacing: "0.1em" }}>
              ENTRANCE ANIMATIONS
            </div>
          </div>
        </div>

        {/* Bottom tag */}
        <div
          style={{
            marginTop: 40,
            fontSize: 14,
            fontFamily: "monospace",
            color: "#6a7a9a",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
          }}
        >
          GLSL · Three.js · Next.js
        </div>
      </div>
    ),
    { ...size },
  );
}
