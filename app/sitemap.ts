import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const SITE_URL = "https://nei-aauav.github.io/deti-plus-26";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/registration/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];
}
