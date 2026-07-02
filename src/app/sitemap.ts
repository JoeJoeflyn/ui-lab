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
    priority: e.implemented ? 0.8 : 0.5,
  }));

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}#west-wing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}#east-wing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}#salon`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}#colony`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...effectEntries,
  ];
}
