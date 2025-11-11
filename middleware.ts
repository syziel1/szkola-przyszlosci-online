import { NextResponse, type NextRequest } from 'next/server';

// 1. Securely get Supabase host (as suggested by code review)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
  // This will stop the server on startup if the variable is missing
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
}
const supabaseHost = new URL(supabaseUrl).hostname;

export function middleware(request: NextRequest) {
  // 2. Generate a secure nonce (using crypto.getRandomValues per review)
  const nonceArray = new Uint8Array(16);
  crypto.getRandomValues(nonceArray);
  const nonce = btoa(String.fromCharCode(...nonceArray));

  // 3. CRITICAL: Add the nonce to the request headers
  // This allows Next.js server components to read it and apply it to scripts/styles.
  request.headers.set('X-Nonce', nonce);

  // 4. Define the secure Content Security Policy (CSP)
  const cspDirectives = [
    "default-src 'self'",
    // Use the nonce for scripts, enable 'strict-dynamic'
    // 'unsafe-eval' is kept only for development HMR
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${
      process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : ''
    }`,
    // Use the nonce for styles
    // 'unsafe-inline' is kept only for development HMR
    `style-src 'self' 'nonce-${nonce}' ${
      process.env.NODE_ENV === 'development' ? "'unsafe-inline'" : ''
    }`,
    // Whitelist specific image hosts (removed insecure 'https:')
    `img-src 'self' data: blob: https://${supabaseHost} https://avatars.githubusercontent.com https://gravatar.com https://*.gravatar.com https://image.thum.io https://www.google.com`,
    // Whitelist specific font hosts (removed insecure 'https:')
    `font-src 'self' data: https://fonts.googleapis.com https://fonts.gstatic.com`,
    // Whitelist Supabase connections
    `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}`,
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  const csp = cspDirectives.join('; ');

  // 5. Create the response, passing the modified request headers
  const response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  });

  // 6. Set all security headers on the outgoing response
  response.headers.set(
    'Content-Security-Policy',
    csp.replace(/\s{2,}/g, ' ').trim()
  );

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

  return response;
}

// 7. Configure middleware paths (no change needed)
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