import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://freqai.io'),
  title: {
    default: 'FREQ AI | Autonomous Maritime Cargo Intelligence',
    template: '%s | FREQ AI',
  },
  description: 'FREQ AI replaces the 4-hour manual barge drafting process with autonomous intelligence. 15-minute results. Zero crew exposure.',
  openGraph: {
    title: 'FREQ AI | Autonomous Maritime Cargo Intelligence',
    description: 'FREQ AI replaces the 4-hour manual barge drafting process with autonomous intelligence. 15-minute results. Zero crew exposure.',
    url: 'https://freqai.io',
    siteName: 'FREQ AI',
    images: [{ url: '/og-image.svg', width: 1200, height: 630 }],
    type: 'website',
  },
  robots: { index: true, follow: true },
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
