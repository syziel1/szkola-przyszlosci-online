'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header with login top-right */}
      <header className="sticky top-0 z-10 w-full border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-yellow-300 flex items-center justify-center font-bold text-gray-900">SP</div>
            <span className="font-semibold text-gray-900">Szkoła Przyszłości Online</span>
          </Link>
          <div>
            {loading ? (
              <span className="text-sm text-gray-500">Ładowanie...</span>
            ) : user ? (
              <Link href="/dashboard">
                <Button size="sm" variant="default">Kokpit</Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button size="sm" variant="default">Zaloguj się</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 pt-12 pb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
            Szkoła Przyszłości Online
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
            Baza Uczniów – nowoczesny system do zarządzania uczniami, zajęciami i płatnościami dla
            korepetytorów oraz szkół. Prosto, szybko i skutecznie.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            {loading ? (
              <span className="text-gray-500">Ładowanie...</span>
            ) : user ? (
              <Link href="/dashboard">
                <Button size="lg">Przejdź do kokpitu</Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button size="lg">Zaloguj się</Button>
              </Link>
            )}
          </div>
        </section>

      </main>

      <footer className="border-t bg-gray-50">
        <div className="mx-auto max-w-6xl p-4 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Szkoła Przyszłości Online. Wszelkie prawa zastrzeżone.
        </div>
      </footer>
    </div>
  );
}
