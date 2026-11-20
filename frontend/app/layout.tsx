import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Background from '@/components/shared/Background'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { ConnectivityProvider } from '@/components/providers/ConnectivityProvider'
import { ConnectivityGuard } from '@/components/providers/ConnectivityGuard'
import { NotificationProvider } from '@/components/providers/NotificationProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BitSilo - Multi-Chain Wallet',
  description: 'Secure multi-chain stablecoin wallet for managing ETH, USDT, USDC, and EURC',
}

import { Suspense } from 'react'
import ReferralTracker from '@/components/ReferralTracker'
import NextTopLoader from 'nextjs-toploader'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextTopLoader 
            color="#6366f1"
            initialPosition={0.08}
            crawlSpeed={200}
            height={3}
            crawl={true}
            showSpinner={false}
            easing="ease"
            speed={200}
            shadow="0 0 10px #6366f1,0 0 5px #6366f1"
          />
          <ConnectivityProvider>
            <AuthProvider>
              <div className="relative z-10 transition-colors duration-300">
                <ConnectivityGuard>
                  <Suspense fallback={null}>
                    <ReferralTracker />
                  </Suspense>
                  {children}
                </ConnectivityGuard>
                <NotificationProvider />
              </div>
            </AuthProvider>
          </ConnectivityProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
