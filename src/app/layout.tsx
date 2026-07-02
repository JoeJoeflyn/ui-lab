import type { ReactNode } from "react";
import type { Metadata } from "next";
import { playfair, cormorant, jetbrainsMono } from "@/lib/fonts";
import { getBaseUrl } from "@/lib/url";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NavRail } from "@/components/nav-rail";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = await getBaseUrl();
  const title = "UI Lab — Gallery of 125+ GPU Shader Particle Effects";
  const description =
    "Interactive gallery of GPU shader-based particle effects: 50 hover interactions, 75 entrance animations, and particle paintings of famous artworks. Each effect has a live preview and copy-paste React + GLSL code. Built with Three.js and WebGL.";
  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: title,
      template: "%s | UI Lab",
    },
    description,
    keywords: [
      "particle effects",
      "GLSL shaders",
      "Three.js",
      "GPU text effects",
      "WebGL",
      "hover animations",
      "entrance animations",
      "particle painting",
      "ant colony animation",
      "React components",
      "TypeScript",
      "UI library",
      "shader art",
      "creative coding",
      "web animation",
    ],
    authors: [{ name: "UI Lab" }],
    creator: "UI Lab",
    publisher: "UI Lab",
    alternates: {
      canonical: baseUrl,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: "UI Lab",
      title,
      description,
      url: baseUrl,
      images: [
        {
          url: "/api/og",
          width: 1200,
          height: 630,
          alt: "UI Lab — Gallery of GPU Shader Particle Effects",
          type: "image/gif",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: "@uilab",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    category: "technology",
    applicationName: "UI Lab",
  };
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "UI Lab — Gallery of GPU Shader Particle Effects",
  description:
    "Interactive gallery of 125+ GPU shader-based particle effects: 50 hover interactions, 75 entrance animations, and particle paintings of famous artworks.",
  applicationCategory: "DesignApplication",
  operatingSystem: "Web",
  browserRequirements: "Requires WebGL support",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  author: {
    "@type": "Organization",
    name: "UI Lab",
  },
  featureList: [
    "50 hover particle effects",
    "75 entrance animations",
    "5 particle paintings of famous artworks",
    "Ant colony painting formation",
    "GLSL shader-based rendering",
    "Copy-paste React components",
    "Live interactive previews",
    "Dark and light theme support",
  ],
  keywords: "particle effects, GLSL, Three.js, WebGL, GPU shaders, text animation",
  url: "https://ui-lab.vercel.app",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${cormorant.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#0c0f1a" />
        {/* Prevent theme flash — set dark/light before hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme")||"dark";document.documentElement.classList.add(t)}catch(e){document.documentElement.classList.add("dark")}})()`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <TooltipProvider delayDuration={300}>
          <NavRail />
          {/* Theme toggle — fixed top-right */}
          <div className="fixed top-4 right-4 z-50">
            <ThemeToggle />
          </div>
          <div className="pt-14 md:pt-0 md:pl-6">{children}</div>
        </TooltipProvider>
      </body>
    </html>
  );
}
