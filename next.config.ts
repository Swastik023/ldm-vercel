import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // Controls how long the App Router's client-side router cache holds pages.
    // dynamic = pages with cookies/headers/searchParams → revalidate every 30s.
    // static  = truly static pages → hold for 5 minutes in memory.
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },

  // Tie the Next.js Data Cache scope to the git commit SHA.
  // On Vercel, each deployment gets a unique VERCEL_GIT_COMMIT_SHA,
  // which ensures cached fetch() results never bleed across deployments.
  generateBuildId: async () => {
    return process.env.VERCEL_GIT_COMMIT_SHA ?? `local-${Date.now()}`;
  },

  async headers() {
    return [
      // ─── Static Assets ──────────────────────────────────────────────────────
      // Next.js names these files with a content hash (e.g. _next/static/chunks/abc123.js).
      // They are safe to cache forever — when content changes the hash changes.
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },

      // ─── Optimised Images ───────────────────────────────────────────────────
      // Images from /_next/image are not content-hashed, so cap at 24h.
      {
        source: '/_next/image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=3600',
          },
        ],
      },

      // ─── Static Public Files ─────────────────────────────────────────────────
      // e.g. /favicon.ico, /robots.txt, /home/Home-about.jpeg uploaded to /public
      // These don't carry content hashes, so cap at 1 hour with background revalidation.
      {
        source: '/(:path*).(ico|png|jpg|jpeg|svg|gif|webp|woff2|woff|ttf|pdf)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },

      // ─── All HTML Pages ──────────────────────────────────────────────────────
      // `no-cache` ≠ `no-store`.
      // `no-cache` = cache the response, but ALWAYS revalidate before using it.
      // Browser sends If-None-Match → server returns 304 Not Modified (near-zero cost)
      //   if the page hasn't changed, or a fresh 200 with new HTML when a deployment happened.
      // `must-revalidate` enforces this even on slow/offline mobile connections.
      // This is the KEY fix: new deployment → Vercel serves new HTML → browser picks it up
      // on the very next visit with zero user action.
      {
        source: '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:ico|png|jpg|jpeg|svg|gif|webp|woff2|woff|ttf|pdf)).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, no-cache, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
