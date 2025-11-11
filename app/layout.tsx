import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { Toaster } from '@/components/ui/toaster'
import { headers } from 'next/headers'

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
  // Read the nonce from the request headers set by middleware
  const nonce = headers().get('x-nonce')
  
  return (
    <html lang="pl">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
