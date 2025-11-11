import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { NonceProvider } from '@/lib/nonce-provider'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Baza Uczniów - CRM dla Korepetytora',
  description: 'System zarządzania uczniami, zajęciami i płatnościami',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Retrieve the nonce from the request headers set by middleware
  const headersList = headers()
  const nonce = headersList.get('X-Nonce') || undefined

  return (
    <html lang="pl">
      <body className={inter.className}>
        <NonceProvider nonce={nonce}>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </NonceProvider>
      </body>
    </html>
  )
}
