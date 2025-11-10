'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';
import { ExternalLink } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();

  const projects = [
    {
      name: 'Edu Future',
      url: 'https://edu-future.online/',
      domain: 'edu-future.online',
      description: 'Platforma edukacyjna budująca kompetencje przyszłości.'
    },
    {
      name: 'SkillsCan AI',
      url: 'https://skillscanai.online/',
      domain: 'skillscanai.online',
      description: 'Narzędzia AI do rozwoju umiejętności i automatyzacji.'
    },
    {
      name: 'Zrozoom AI',
      url: 'https://www.zrozoomai.pl/',
      domain: 'zrozoomai.pl',
      description: 'Warsztaty i wiedza o sztucznej inteligencji.'
    },
    {
      name: 'Matma Base44',
      url: 'https://matma.base44.app/',
      domain: 'matma.base44.app',
      description: 'Ćwiczenia i materiały z matematyki online.'
    },
  ];

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
        <section className="mx-auto max-w-6xl px-4 pt-12 pb-10 text-center">
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

        {/* Projects grid */}
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Inne projekty</h2>
            <p className="text-sm text-gray-500">Poznaj nasze inicjatywy i narzędzia</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {projects.map((p) => (
              <Card key={p.url} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  {/* Favicon thumbnail */}
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${p.domain}&sz=128`}
                    alt={`${p.name} favicon`}
                    width={32}
                    height={32}
                    className="rounded"
                  />
                  <div className="flex-1">
                    <CardTitle className="text-base font-semibold text-gray-900">{p.name}</CardTitle>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {p.url.replace('https://', '')}
                    </a>
                  </div>
                  <a href={p.url} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline" className="gap-1">
                      <ExternalLink className="w-4 h-4" />
                      Zobacz
                    </Button>
                  </a>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{p.description}</p>
                </CardContent>
              </Card>
            ))}
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
