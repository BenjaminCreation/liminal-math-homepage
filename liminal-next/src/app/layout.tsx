import type { Metadata, Viewport } from 'next'
import './fonts.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'Liminal Math',
  description: 'Liminal is where curious students learn olympiad mathematics by doing it.',
  icons: {
    icon: "data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'-4%20-4%20141%20136'%3E%3Cpath%20d%3D'M78%202L93%2074L99%20125L55%2060Z'%20fill%3D'%234ECCFC'%2F%3E%3Cpath%20d%3D'M78%202L2%2088L55%2060Z'%20fill%3D'%2300A8FC'%2F%3E%3Cpath%20d%3D'M2%2088L55%2060L99%20125Z'%20fill%3D'%230666D8'%2F%3E%3Cpath%20d%3D'M93%2074L129%2069L98%20108Z'%20fill%3D'%232A4EAE'%2F%3E%3Cpath%20d%3D'M129%2069L99%20125L98%20108Z'%20fill%3D'%230666D8'%2F%3E%3C%2Fsvg%3E",
  },
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400..700&family=Baskervville:ital,wght@0,400..700;1,400..700&family=Figtree:wght@400;500;600;700&family=Caveat:wght@400..700&display=swap"
        />
      </head>
      <body>
        <div id="dc-root">{children}</div>
      </body>
    </html>
  )
}
