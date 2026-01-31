import type { Metadata } from 'next'

import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google'
import { AuthProvider } from '@/lib/auth-context'
import { Toaster } from '@/components/ui/sonner'

// Initialize fonts
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-brand',
  display: 'swap',
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Talentronaut Workspace',
  description: 'Professional AI powered Work Manager application',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jakarta.variable} ${playfair.variable} font-body antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
