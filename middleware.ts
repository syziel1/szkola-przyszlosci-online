import { NextResponse, type NextRequest } from 'next/server';

// 1. Bezpieczne pobranie hosta Supabase (zgodnie z sugestią Copilota)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
  // To zatrzyma serwer przy starcie, jeśli zmienna nie jest ustawiona
  throw new Error('CRITICAL_ERROR: Missing NEXT_PUBLIC_SUPABASE_URL');
}
const supabaseHost = new URL(supabaseUrl).hostname;

export function middleware(request: NextRequest) {
  // 2. Wygeneruj unikalny nonce dla każdego żądania
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  // 3. Zdefiniuj politykę bezpieczeństwa (CSP)
  // Ta polityka jest znacznie bezpieczniejsza.
  // Używamy 'nonce-${nonce}' zamiast 'unsafe-inline' i 'unsafe-eval'.
  const cspDirectives = [
    "default-src 'self'",
    // Next.js potrzebuje 'strict-dynamic' do ładowania swoich skryptów
    // Dodajemy 'unsafe-eval' TYLKO w trybie deweloperskim dla HMR (Hot Module Replacement)
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${
      process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : ''
    }`,
    // 'unsafe-inline' jest potrzebne w trybie dev dla HMR
    `style-src 'self' 'nonce-${nonce}' ${
      process.env.NODE_ENV === 'development' ? "'unsafe-inline'" : ''
    }`,
    // Lista dozwolonych hostów dla obrazów (z poprzedniej konfiguracji)
    `img-src 'self' https: data: blob: https://${supabaseHost} https://image.thum.io https://www.google.com`,
    // Dodajemy hosty dla czcionek (np. Google Fonts)
    "font-src 'self' https: data: https://fonts.gstatic.com",
    // Połączenia (API, WebSockets)
    `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}`,
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ];

  const csp = cspDirectives.join('; ');

  // 4. Ustaw nagłówki w odpowiedzi
  const response = NextResponse.next();

  // Ustaw nagłówek CSP. Next.js automatycznie wykryje ten nonce.
  response.headers.set(
    'Content-Security-Policy',
    csp.replace(/\s{2,}/g, ' ').trim()
  );

  // Ustaw inne nagłówki bezpieczeństwa (przeniesione z next.config.js)
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '0'); // Wyłączone na rzecz CSP
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

  return response;
}

// 5. Określ, dla jakich ścieżek ma działać middleware
export const config = {
  matcher: [
    /*
     * Dopasuj wszystkie ścieżki z wyjątkiem:
     * - /api (trasy API)
     * - /_next/static (pliki statyczne)
     * - /_next/image (optymalizacja obrazów)
     * - /favicon.ico (plik favicon)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};