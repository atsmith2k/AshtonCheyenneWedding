import type { Metadata } from 'next'
import { Inter, Playfair_Display, Dancing_Script } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const dancing = Dancing_Script({ 
  subsets: ['latin'],
  variable: '--font-dancing',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: "Ashton & Cheyenne's Wedding",
    template: "%s | Ashton & Cheyenne's Wedding"
  },
  description: 'Join Ashton and Cheyenne as they celebrate their special day. Find all wedding information, RSVP, and share memories with us.',
  keywords: ['wedding', 'Ashton', 'Cheyenne', 'celebration', 'RSVP', 'photos'],
  authors: [{ name: 'Ashton & Cheyenne' }],
  creator: 'Ashton & Cheyenne',
  publisher: 'Ashton & Cheyenne',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    title: "Ashton & Cheyenne's Wedding",
    description: 'Join Ashton and Cheyenne as they celebrate their special day.',
    siteName: "Ashton & Cheyenne's Wedding",
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: "Ashton & Cheyenne's Wedding",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Ashton & Cheyenne's Wedding",
    description: 'Join Ashton and Cheyenne as they celebrate their special day.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: false, // Wedding sites typically shouldn't be indexed
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  verification: {
    // Add verification codes if needed
    // google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${dancing.variable}`}>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
