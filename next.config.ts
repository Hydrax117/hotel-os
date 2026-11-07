import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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

  // ── Image remote patterns ──────────────────────────────────────────────────
  // Allow next/image to optimise images from the Hotel OS API backend and
  // Supabase storage. Add additional hostnames here as needed.
  images: {
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
    ],
  },
};

export default nextConfig;
