import { NextResponse, type NextRequest } from 'next/server';

// 1. Securely get Supabase host
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
  throw new Error('CRITICAL_ERROR: Missing NEXT_PUBLIC_SUPABASE_URL');
}
const supabaseHost = new URL(supabaseUrl).hostname;

// --- START: CSP Hashes ---
// Hashes for inline styles (from production build console errors)
const INLINE_STYLE_HASHES = [
  // Hashes from previous error log (image_74d219.png)
  "'sha256-JPaZlExsTJxSLfX8sCI8mAblg8g3hHjpjkEKePwjV9s='",
  "'sha256-agfYelximJJGSn2N9kYlYfsn7sP16k4QpooPzssiMIA='",
  "'sha256-adfJmue3Rk3d7b31YQMyYAGa3S0Fel9lHhxyE0S+SAY='",
  "'sha256-OBThURIY4cV8QfGz2PaJ4xxccET7H0Z1/LYkcO+LyE0='",
  "'sha256-MgQWqEvPlrYxWe1+lMl3VNxR3FkW8ZofNaml/f5M02s='",
  "'sha256-9eJ/N18aZkQpdbi1gmEw/xJtq9T1QfNnB1/aIuS3fO4='",
  "'sha256-XlqDmG2N4fPOfNodwiJgA5QBLyKn9NlQb/iJ8xQ3eYw='",
  "'sha256-opjUTQkSMv653N1nQyv5iwmEwS2OQsNq/c/YkQpYgGI='",
  "'sha256-uDqA+ZmsxGfG9vWf0gfbI/sRSZthw3cKAixh/fVibgA='",
  "'sha256-TjS+MBLS7In0Q0Nm+eQkG98hN+3cAWtL/g/3ubnS/zs='",
  "'sha256-g6NLRuQvVfPgGURwHxxs1iA51tM9nEwB9O9sNlE+jlw='",
  "'sha256-mQkImBcmRiGtr/qRpLuiFfNkcVF/NthFAxT7hxB7xAU='",
  "'sha256-zCeZejzceXzljeEjtJxO0pQ0OpoO0u3E/es4eQU/txs='",
  "'sha256-0pG0DCH1GBbEnvsjQTwl6bJVEInGDIzZJv9Kl/gQ0pE='",
  "'sha256-tU5S0/zuEU/pUf/JUQvUVc/purJalUD7Szh5NsHzxrk='",
  // Hashes from *new* error log (this turn, image_74d219.png)
  "'sha256-zaGFlNmU3+rkk0d7vI3tQdm3lXhYyAGA+3SO9F5eibM='",
  "'sha256-jPaQlx730nTxIBFs3cL38mhA0Lpg3G4MIJPkKjvePkg='",
  "'sha256-1OjyRYLAOH1vhXLUN4bBHal0rWxuwBDBP220NNc0CNU='",
  // Removed 2 truncated/invalid hashes (fUPz... and Hsoh...)
];

// Hashes for inline scripts (from production build console errors)
const INLINE_SCRIPT_HASHES = [
  // Hashes from *new* error log (this turn, image_74d219.png)
  "'sha256-OBTN3RiyCV4Bq7dFqZ5a2pAXjnCcCYeTJMO2I/LYKeo='",
  "'sha256-nQe7Xindgmzl8NiR0FH/gIQzLLSU6z4xPgxeFnqXTNc='",
  "'sha256-PWK9BRpxZZ3CejtXxIVd6e1Fmrfb+q0XYjIQqpowOn0='",
  "'sha256-GPchGDBi4C1jhepDdYXchhAhV2J+NZwZLRBFpV8Bd+c='",
  "'sha256-sFUIqpWzrXUgGqkq/mRzTbq/aUG9EN0ObplqW7gwcfw='",
  "'sha256-Jt/t6HVlA3wLz2ychwDkEt4TX54xF7VNFZ1k1gfxA3I='",
  "'sha256-kmSM+n42vahS85h0eybgjNtDhdpTFHXrX3mBst/qUlg='",
];
// --- END: CSP Hashes ---

export function middleware(request: NextRequest) {
  // 2. Generate a secure nonce
  const nonceArray = new Uint8Array(16);
  crypto.getRandomValues(nonceArray);
  const nonce = Buffer.from(nonceArray).toString('base64');

  // 3. Add the nonce to the request headers
  request.headers.set('X-Nonce', nonce);

  // 4. Define the secure Content Security Policy (CSP)
  const cspDirectives = [
    "default-src 'self'",
    // Add new inline script hashes
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${INLINE_SCRIPT_HASHES.join(' ')} ${
      process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : ''
    }`,
    // Add new inline style hashes AND Google Fonts CSS host
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline' https://fonts.googleapis.com ${INLINE_STYLE_HASHES.join(' ')}`,
    // Add all required image hosts (FIXED per review)
    `img-src 'self' data: blob: https://${supabaseHost} https://avatars.githubusercontent.com https://gravatar.com https://*.gravatar.com https://image.thum.io https://www.google.com/s2/favicons/**`,
    // Add Google Font *file* host (FIXED per review)
    `font-src 'self' data: https://fonts.gstatic.com`,
    `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}`,
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  const csp = cspDirectives.join('; ');

  // 5. Create the response
  const response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  });

  // 6. Set all security headers
  response.headers.set(
    'Content-Security-Policy',
    csp.replace(/\s{2,}/g, ' ').trim()
  );

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  // Removed deprecated X-XSS-Protection header
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

  return response;
}

// 7. Configure middleware paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
