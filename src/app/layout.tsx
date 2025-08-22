import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import StructuredData from '@/components/seo/StructuredData'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Skoot Shuttle – Columbia SC to Charlotte Airport Rides',
  description: 'Hourly shuttle service from Columbia, SC to Charlotte Douglas Airport. Comfortable, reliable, and affordable rides starting at $31. Book your seat today!',
  keywords: 'Columbia to Charlotte airport shuttle, CLT airport transportation, Columbia SC shuttle service, Charlotte airport rides, airport shuttle Columbia, USC shuttle to airport, Fort Jackson airport transportation, Rock Hill Charlotte shuttle, affordable airport rides SC',
  authors: [{ name: 'Skoot Transportation' }],
  creator: 'Skoot Transportation',
  publisher: 'Skoot Transportation',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  verification: {
    google: 'your-google-verification-code-here', // Add when you get Google Search Console
  },
  openGraph: {
    title: 'Skoot Shuttle – Columbia SC to Charlotte Airport Transportation',
    description: 'Reliable hourly shuttle service from Columbia, SC to Charlotte Douglas Airport. Clean vehicles, professional drivers, starting at $31.',
    url: 'https://skoot.bike',
    siteName: 'Skoot Shuttle',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://skoot.bike/images/ride-with-skoot.jpg',
        width: 1200,
        height: 630,
        alt: 'Ride with SKOOT - Professional shuttle service with happy passengers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Skoot Shuttle – Columbia SC to Charlotte Airport',
    description: 'Reliable hourly shuttle service starting at $31. Professional drivers, clean vehicles, on-time service.',
    images: ['https://skoot.bike/images/ride-with-skoot.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://skoot.bike',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <StructuredData />
      </head>
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