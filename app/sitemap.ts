import type { MetadataRoute } from 'next';

/**
 * Static sitemap — covers the public traveler-facing pages.
 * Hotel detail pages (/hotels/[id]) are dynamically added by fetching
 * the hotels list from the API. If the API is unavailable at build time,
 * we fall back to the static routes only.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://lodgen.com.ng';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/search`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  ];

  // Try to fetch hotel IDs for dynamic pages
  try {
    const res = await fetch(`${apiUrl}/api/v1/search/hotels?limit=200`, {
      next: { revalidate: 3600 }, // re-fetch hourly
    });
    if (res.ok) {
      type Hotel = { id: string; updatedAt?: string };
      const data = await res.json() as { hotels?: Hotel[] } | Hotel[];
      const hotels: Hotel[] = Array.isArray(data) ? data : (data.hotels ?? []);
      const hotelRoutes: MetadataRoute.Sitemap = hotels.map(h => ({
        url: `${base}/hotels/${h.id}`,
        lastModified: h.updatedAt ? new Date(h.updatedAt) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
      return [...staticRoutes, ...hotelRoutes];
    }
  } catch {
    // Non-fatal — return static routes
  }

  return staticRoutes;
}
