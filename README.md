# Szkoła Przyszłości Online – Baza Uczniów

Nowoczesny, webowy system zarządzania uczniami i zajęciami dla korepetytorów i szkół. Aplikacja umożliwia przegląd nadchodzących zajęć, zarządzanie uczniami, płatnościami, diagnozami, książkami i linkami, a także administrację użytkownikami i rolami.

- Widoki: logowanie (`/login`), kokpit nauczyciela (`/dashboard`)
- Backend: API routes dla administracji (`/api/admin/users`, `/api/admin/invite`)
- Autoryzacja i dane: Supabase (Auth + Database)

## Stos technologiczny

- Next.js 13 (App Router), React 18, TypeScript
- Tailwind CSS, Radix UI, shadcn/ui, lucide-react
- Supabase (`@supabase/supabase-js`)
- date-fns, react-hook-form, zod

## Kluczowe funkcje

- Kokpit nauczyciela z listą nadchodzących zajęć
- Zarządzanie uczniami, zajęciami, płatnościami, diagnozami
- Książki i linki przypisane do uczniów/klas
- Role użytkowników: administrator, konsultant, nauczyciel, opiekun, uczeń
- Zapraszanie użytkowników i przegląd profili (endpoints admin)
- Formularze z walidacją i toasty powiadomień

## Wymagania

- Node.js 18+ (zalecane LTS)
- npm 9+ lub pnpm/yarn
- Konto i projekt w Supabase:
  - URL projektu
  - Anon public key
  - Service role key (tylko po stronie serwera)

## Szybki start

1) Zainstaluj zależności

```bash
npm install
```

2) Skonfiguruj zmienne środowiskowe (stwórz plik `.env.local` w katalogu głównym)

```ini
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...   # nie ujawniaj publicznie!
```

3) Uruchom aplikację w trybie deweloperskim

```bash
npm run dev
# aplikacja: http://localhost:3000
```

4) Budowanie i uruchomienie produkcyjne

```bash
npm run build
npm start
```

## Skrypty npm

- `dev` – uruchamia Next.js w trybie deweloperskim
- `build` – buduje aplikację
- `start` – uruchamia build produkcyjny
- `lint` – uruchamia ESLint
- `typecheck` – sprawdza typy TypeScript

## Zmienne środowiskowe

- `NEXT_PUBLIC_SUPABASE_URL` – URL projektu Supabase (publiczny)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Anon public key Supabase (publiczny)
- `SUPABASE_SERVICE_ROLE_KEY` – Service role key Supabase (poufny; tylko po stronie serwera, używany przez API admin)

Uwaga: Klucza `SUPABASE_SERVICE_ROLE_KEY` nie wolno umieszczać w kliencie/przeglądarce ani w publicznych buildach.

## Struktura katalogów

- `app/` – App Router Next.js (strony, layouty, API routes)
  - `app/login/page.tsx` – logowanie/rejestracja z Supabase Auth
  - `app/dashboard/` – kokpit i widoki dla nauczyciela/administracji
  - `app/api/admin/` – trasy API do administracji (wymagają tokenu i roli)
- `components/` – komponenty UI (w tym `components/ui/*` z shadcn/ui)
- `hooks/` – hooki do logiki domenowej (np. uczniowie, płatności, książki)
- `lib/` – utilsy i klienci (np. `lib/supabase.ts`, `lib/auth-context.tsx`)
- `app/globals.css` – globalne style
- Konfiguracje: `tailwind.config.ts`, `postcss.config.js`, `tsconfig.json`, `next.config.js`

## Model danych (Supabase)

Definicje typów i wyliczeń znajdziesz w `lib/supabase.ts`. Tabele m.in.:

- `uczniowie`, `zajecia`, `platnosci`, `diagnozy`, `ksiazki`, `linki`
- `przedmiot_ucznia`, `uczen_ksiazka`
- `user_profiles` (rola użytkownika), `auth_settings`
- `student_guardians`, `student_user_mapping`

Role użytkowników (`user_role_enum`): `administrator`, `konsultant`, `nauczyciel`, `opiekun`, `uczen`.

## API Administracyjne

- `GET /api/admin/users` – lista użytkowników z rolami (wymaga nagłówka `Authorization: Bearer <access_token>`)
- `POST /api/admin/invite` – zaproszenie użytkownika przez e‑mail; wymaga roli `administrator` i poprawnej konfiguracji `SUPABASE_SERVICE_ROLE_KEY`

Token z nagłówka jest weryfikowany przez Supabase (`auth.getUser`), a rola sprawdzana w tabeli `user_profiles`.

## Wdrożenie

- Zalecane: Vercel + Supabase
- Ustaw zmienne środowiskowe w panelu Vercel/serwera:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (jako zmienna serwerowa/secret)
- Upewnij się, że trasy w `app/api/admin/*` mają dostęp do `SUPABASE_SERVICE_ROLE_KEY` i nie są wykonywane po stronie klienta.

## Bezpieczeństwo

- Nigdy nie udostępniaj `SUPABASE_SERVICE_ROLE_KEY` po stronie klienta.
- Ogranicz dostęp do tras admin wyłącznie do użytkowników z rolą `administrator`.
- W Supabase skonfiguruj RLS (Row Level Security) zgodnie z potrzebami projektu.

## Licencja

Dodaj informacje o licencji (np. MIT) lub pozostaw jako „All rights reserved”, jeśli projekt jest zamknięty.
