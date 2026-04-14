import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://defi-sweeper.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    // Marketing landing
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    // App gateway — renders full dashboard when a wallet is connected
    { url: `${SITE_URL}/app`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    // Legacy /dashboard alias still reachable
    { url: `${SITE_URL}/dashboard`, lastModified: now, changeFrequency: "daily", priority: 0.5 },
  ];
}
