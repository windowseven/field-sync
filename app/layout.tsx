import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { AuthProvider } from '@/lib/auth/AuthContext'
import { AuthErrorBoundary } from '@/components/features/auth/AuthErrorBoundary'
import { InactivityWatcher } from '@/components/features/auth/InactivityWatcher'
import { SyncInitializer } from '@/components/features/auth/SyncInitializer'
import { SecurityInitializer } from '@/components/features/auth/SecurityInitializer'
import './globals.css'

const geistSans = Geist({ 
  subsets: ["latin"],
  variable: '--font-geist-sans',
})
const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'Field Sync | Mission Control',
  description: 'Real-time field operations management system for team coordination, live tracking, and dynamic task management.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/icon.svg',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f9fafb' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f14' },
  ],
  width: 'device-width',
  initialScale: 1,
}
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <AuthErrorBoundary>
              <SecurityInitializer />
              <InactivityWatcher />
              <SyncInitializer />
              {children}
            </AuthErrorBoundary>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

