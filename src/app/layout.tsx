import type { ReactNode } from "react";
import type { Metadata } from "next";
import { playfair, cormorant, jetbrainsMono } from "@/lib/fonts";
import { getBaseUrl } from "@/lib/url";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = await getBaseUrl();
  const title = "UI Lab — Particle Text Gallery | 125+ GPU Shader Effects";
  const description =
    "A gallery of GPU shader-based particle text effects: 50 hover interactions and 75 entrance animations, each with live preview and copy-paste code. Built with Three.js and GLSL.";
  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    keywords: [
      "particle effects",
      "GLSL shaders",
      "Three.js",
      "GPU text effects",
      "webgl",
      "hover animations",
      "entrance animations",
      "react components",
      "typescript",
      "ui library",
    ],
    authors: [{ name: "UI Lab" }],
    creator: "UI Lab",
    alternates: {
      canonical: baseUrl,
    },
    openGraph: {
      type: "website",
      siteName: "UI Lab",
      title,
      description,
      url: baseUrl,
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: "UI Lab — Particle Text Gallery",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "UI Lab — Particle Text Gallery",
  description:
    "A gallery of GPU shader-based particle text effects: 50 hover interactions and 75 entrance animations.",
  applicationCategory: "DesignApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "50 hover particle effects",
    "75 entrance animations",
    "GLSL shader-based rendering",
    "Copy-paste React components",
    "Live interactive previews",
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${playfair.variable} ${cormorant.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <meta name="theme-color" content="#0c0f1a" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
