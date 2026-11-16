import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://lodgen.com.ng';
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/hotels/', '/search'],
        disallow: [
          '/admin/',
          '/dashboard/',
          '/checkout',
          '/bookings',
          '/profile',
          '/auth/',
          '/payment/',
          '/booking/confirmation',
          '/api/',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
