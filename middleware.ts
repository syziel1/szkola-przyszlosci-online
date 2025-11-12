import { NextResponse, type NextRequest } from 'next/server';

// 1. Securely get Supabase host
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
  throw new Error('CRITICAL_ERROR: Missing NEXT_PUBLIC_SUPABASE_URL');
}
const supabaseHost = new URL(supabaseUrl).hostname;

// Funkcja pomocnicza do budowania CSP
function buildCSP(nonce: string) {
  const cspDirectives = [
    "default-src 'self'",
    // 'strict-dynamic' ufa skryptom ładowanym przez skrypty z 'nonce'
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${
      process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : ''
    }`,
    
    // 'unsafe-inline' jest SZYBKIM FIXEM na atrybuty style="...".
    // Długoterminowo należy je usunąć i zastąpić klasami.
    `style-src 'self' https://fonts.googleapis.com 'unsafe-inline'`, // teraz bez 'nonce-${nonce}'
    
    // Poprawione hosty dla obrazków i fontów
    `img-src 'self' data: blob: https://${supabaseHost} https://avatars.githubusercontent.com https://gravatar.com https://*.gravatar.com https://image.thum.io https://www.google.com`,
    `font-src 'self' data: https://fonts.gstatic.com`,
    
    `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}`,
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  return cspDirectives.join('; ').replace(/\s{2,}/g, ' ').trim();
}

export function middleware(request: NextRequest) {
  // 2. Wygeneruj nonce
  const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64');

  // 3. Utwórz KOPIĘ nagłówków żądania i dodaj do niej nonce
  // To jest kluczowy fix z analizy "Codexa"
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('X-Nonce', nonce);

  // 4. Stwórz odpowiedź, przekazując ZMODYFIKOWANE nagłówki ŻĄDANIA
  // Next.js automatycznie użyje 'X-Nonce' do oznaczenia swoich skryptów
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // 5. Zbuduj i ustaw CSP na nagłówkach ODPOWIEDZI
  const csp = buildCSP(nonce);
  response.headers.set('Content-Security-Policy', csp);

  // 6. Ustaw pozostałe nagłówki bezpieczeństwa
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  
  // Opcjonalnie: Ustaw x-nonce na odpowiedzi, aby był dostępny w app/layout.tsx
  // przez headers(), jeśli będziesz dodawał własne tagi <Script>
  response.headers.set('X-Nonce', nonce);

  return response;
}

// 7. Konfiguracja matchera pozostaje bez zmian
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
