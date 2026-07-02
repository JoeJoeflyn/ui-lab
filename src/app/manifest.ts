import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/url";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const baseUrl = await getBaseUrl();
  return {
    name: "UI Lab — Gallery of GPU Shader Particle Effects",
    short_name: "UI Lab",
    description:
      "Interactive gallery of 125+ GPU shader-based particle effects with live previews and copy-paste code.",
    start_url: baseUrl,
    display: "standalone",
    background_color: "#0a0c14",
    theme_color: "#0c0f1a",
    orientation: "portrait-primary",
    categories: ["design", "developer", "graphics"],
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
