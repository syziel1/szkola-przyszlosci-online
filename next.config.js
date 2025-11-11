// next.config.js (CommonJS)

// Pobieramy URL Supabase ze zmiennych środowiskowych
// Musimy wyodrębnić samą nazwę hosta (np. "abcdef.supabase.co")
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseHost = supabaseUrl.replace('https://', '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ----- Podstawowa konfiguracja (sugerowana) -----
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false, // Wyłączamy mapy źródłowe na produkcji

  // ----- 1) Wymuszamy ESLint podczas budowania -----
  eslint: {
    ignoreDuringBuilds: false,
  },

  // ----- 2) Wymuszamy błędy TypeScript (już to masz) -----
  typescript: {
    ignoreBuildErrors: false,
  },

  // ----- 3) Optymalizacja importów (dostosowana) -----
  // Używamy tylko pakietów, które masz w package.json
  experimental: {
    optimizePackageImports: [
      '@supabase/supabase-js',
      'lucide-react', // popularna biblioteka ikon
    ],
  },

  // ----- 4) Dozwolone zewnętrzne obrazy (dla next/image) -----
  images: {
    remotePatterns: [
      // Supabase
      { protocol: 'https', hostname: supabaseHost },
      // Popularne serwisy awatarów
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'gravatar.com' },
      { protocol: 'https', hostname: '*.gravatar.com' },
      // Obrazki z app/page.tsx
      { protocol: 'https', hostname: 'image.thum.io' },
      { protocol: 'https', hostname: 'www.google.com' },
    ],
  },

  // ----- 5) Nagłówki bezpieczeństwa (z poprawkami CSP) -----
  async headers() {
    // Definicja polityki bezpieczeństwa treści (CSP)
    const csp = [
      "default-src 'self'",
      // 'unsafe-inline' jest często potrzebne dla styli, 'unsafe-eval' dla niektórych bibliotek
      // Docelowo warto dążyć do eliminacji 'unsafe-*' przez użycie 'nonce'
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      // hosty dla obrazów (Supabase, avatary, thum.io, google favicons)
      `img-src 'self' https: data: blob: https://${supabaseHost} https://image.thum.io https://www.google.com`,
      `font-src 'self' https: data:`,
      // Łączenie z Supabase (API i WebSockets)
      `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}`,
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '0' }, // Wyłączone na rzecz CSP
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // HSTS: Wymusza HTTPS na 2 lata, w tym subdomeny
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy', value: csp.replace(/\s{2,}/g, ' ').trim() },
        ],
      },
    ];
  },
};

module.exports = nextConfig;