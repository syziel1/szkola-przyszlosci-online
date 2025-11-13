import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { Toaster } from '@/components/ui/toaster'
import { NonceProvider } from '@/lib/nonce-context'
import { NoncedScript } from '@/components/nonced-script'

export const dynamic = 'force-dynamic'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Baza Uczniów - CRM dla Korepetytora',
  description: 'System zarządzania uczniami, zajęciami i płatnościami',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const nonce = headersList.get('x-nonce')

  return (
    <html lang="pl">
      <body className={inter.className}>
        <NonceProvider nonce={nonce}>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
          {nonce ? (
            <NoncedScript
              id="csp-nonce-check"
              strategy="beforeInteractive"
              dangerouslySetInnerHTML={{ __html: 'void 0;' }}
            />
          ) : null}
        </NonceProvider>
      </body>
    </html>
  )
}
