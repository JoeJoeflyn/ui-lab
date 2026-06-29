import type { ReactNode } from "react";
import type { Metadata } from "next";
import { syne, sora, jetbrainsMono } from "@/lib/fonts";
import { getBaseUrl } from "@/lib/url";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = await getBaseUrl();
  return {
    metadataBase: new URL(baseUrl),
    title: "UI Lab — Particle & Animation Gallery",
    description:
      "A gallery of GPU shader-based particle text effects: 50 hover interactions and 75 entrance animations, each with live preview and copy-paste code.",
    openGraph: {
      type: "website",
      siteName: "UI Lab",
      title: "UI Lab — Particle & Animation Gallery",
      description:
        "A gallery of GPU shader-based particle text effects: 50 hover interactions and 75 entrance animations.",
      url: baseUrl,
    },
    twitter: {
      card: "summary_large_image",
      title: "UI Lab — Particle & Animation Gallery",
      description:
        "A gallery of GPU shader-based particle text effects: 50 hover interactions and 75 entrance animations.",
    },
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${syne.variable} ${sora.variable} ${jetbrainsMono.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
