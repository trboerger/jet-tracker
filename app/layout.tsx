import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Jet Tracker | Real-Time Billionaire & Government Aircraft Tracking',
  description: 'Track private jets of billionaires, tech CEOs, and government aircraft in real-time. Monitor movements of Elon Musk, Jeff Bezos, Air Force One, and more.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="bg-jet-dark text-white antialiased">{children}</body>
    </html>
  )
}
