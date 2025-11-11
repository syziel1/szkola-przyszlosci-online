// next.config.js (CommonJS)

// --- Supabase Host Setup ---
// 1. Throw an error at build time if the URL is not set.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
  throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
}
// 2. Robustly parse the hostname using the URL API.
const supabaseHost = new URL(supabaseUrl).hostname;
// --- End of Supabase Host Setup ---

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ----- Base Configuration -----
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false, // Disable source maps in production

  // ----- Enforce TypeScript errors -----
  typescript: {
    ignoreBuildErrors: false,
  },

  // ----- Optimize Package Imports -----
  experimental: {
    optimizePackageImports: [
      '@supabase/supabase-js',
      'lucide-react', // Optimize popular icon library
    ],
  },

  // ----- Allowed Remote Images (for next/image) -----
  images: {
    remotePatterns: [
      // Supabase:
      { protocol: 'https', hostname: supabaseHost },
      // Common avatar services:
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'gravatar.com' },
      { protocol: 'https', hostname: '*.gravatar.com' },
      // Image providers from app/page.tsx:
      { protocol: 'https', hostname: 'image.thum.io' },
      { protocol: 'https', hostname: 'www.google.com', pathname: '/s2/favicons' },
    ],
  },
};

module.exports = nextConfig;