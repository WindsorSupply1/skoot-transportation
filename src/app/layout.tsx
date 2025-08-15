import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Skoot Transportation | Columbia to Charlotte Airport Shuttle Service',
  description: 'Professional shuttle service from Columbia, SC to Charlotte Douglas International Airport (CLT). Daily departures every 2 hours, starting at $31. Book your reliable airport transportation today!',
  keywords: 'Columbia to Charlotte airport, CLT shuttle, airport transportation Columbia SC, Charlotte airport shuttle, Rock Hill shuttle, Fort Jackson transportation, USC airport shuttle, reliable airport transfer',
  openGraph: {
    title: 'Skoot Transportation - Columbia to Charlotte Airport Shuttle',
    description: 'Professional shuttle service from Columbia, SC to Charlotte Douglas International Airport. Daily departures every 2 hours, starting at $31.',
    url: 'https://skoot.bike',
    siteName: 'Skoot Transportation',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Skoot Transportation - Columbia to Charlotte Airport Shuttle',
    description: 'Professional shuttle service from Columbia, SC to Charlotte Douglas International Airport. Daily departures every 2 hours, starting at $31.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div id="root">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}