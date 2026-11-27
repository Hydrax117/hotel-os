import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control",    value: "on" },
  { key: "X-Frame-Options",           value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options",    value: "nosniff" },
  { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    // Allow Paystack, Google Fonts and Supabase; keep everything else self-only.
    // 'unsafe-inline' required for inline <style> and next/font CSS injection.
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.paystack.co",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' blob: data: https://hotel-os-api-52qe.onrender.com https://*.supabase.co https://*.arenax.com.ng https://images.unsplash.com",
      "connect-src 'self' https://hotel-os-api-52qe.onrender.com https://*.supabase.co wss://*.supabase.co",
      "frame-src https://js.paystack.co https://checkout.paystack.com",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  compress: true,

  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  // ── Security headers ───────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  // ── Image remote patterns ──────────────────────────────────────────────────
  // Allow next/image to optimise images from the Hotel OS API backend and
  // Supabase storage. Add additional hostnames here as needed.
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400, // 24 hours
    remotePatterns: [
      {
        // Hotel OS REST API (production on Render)
        protocol: "https",
        hostname: "hotel-os-api-52qe.onrender.com",
        pathname: "/**",
      },
      {
        // Supabase storage bucket
        protocol: "https",
        hostname: "yniqtyaaodnrphhgczis.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // Any *.supabase.co subdomain (future-proof for project migrations)
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        // Production custom domain images (arenax.com.ng CDN or similar)
        protocol: "https",
        hostname: "*.arenax.com.ng",
        pathname: "/**",
      },
      {
        // Unsplash CDN — used for destination card fallback images
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
