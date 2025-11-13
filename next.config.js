// next.config.js (CommonJS)

// 1. Securely get Supabase host
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
  throw new Error("CRITICAL_ERROR: Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
}
const supabaseHost = new URL(supabaseUrl).hostname;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ----- Base Configuration -----
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,

  // ----- Enforce TypeScript errors -----
  typescript: {
    ignoreBuildErrors: false,
  },

  // ----- Optimize Package Imports -----
  experimental: {
    optimizePackageImports: [
      '@supabase/supabase-js',
      'lucide-react',
    ],
  },

  // ----- Allowed Remote Images (Aligned with middleware) -----
  images: {
    remotePatterns: [
      // Supabase:
      { protocol: 'https', hostname: supabaseHost },
      // Common avatar services (FIXED per review):
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'gravatar.com' },
      { protocol: 'https', hostname: '*.gravatar.com' },
      // Image providers from app/page.tsx:
      { protocol: 'https', hostname: 'image.thum.io' },
      { protocol: 'https', hostname: 'www.google.com', pathname: '/s2/favicons/**' }, // (Aligned)
    ],
  },

  // Security Headers are handled by middleware.ts
};

module.exports = nextConfig;
