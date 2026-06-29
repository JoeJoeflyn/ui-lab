import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/url";
import { ALL_EFFECTS } from "@/lib/effects";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = await getBaseUrl();
  const now = new Date();
  const effectEntries = ALL_EFFECTS.map((e) => ({
    url: `${baseUrl}/effects/${e.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  return [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...effectEntries,
  ];
}
