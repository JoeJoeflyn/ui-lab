import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0c0f1a",
          borderRadius: "6px",
        }}
      >
        <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="12" stroke="#c9a227" strokeWidth="1.5" opacity="0.4" />
          <circle cx="14" cy="14" r="7" stroke="#c9a227" strokeWidth="1.5" opacity="0.6" />
          <circle cx="14" cy="14" r="3" fill="#c9a227" />
          <circle cx="14" cy="2" r="1.2" fill="#c9a227" opacity="0.7" />
          <circle cx="26" cy="14" r="1.2" fill="#c9a227" opacity="0.7" />
          <circle cx="14" cy="26" r="1.2" fill="#c9a227" opacity="0.7" />
          <circle cx="2" cy="14" r="1.2" fill="#c9a227" opacity="0.7" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
