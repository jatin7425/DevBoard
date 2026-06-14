import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DevBoard',
  description: 'Personal project management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif' }}>{children}</body>
    </html>
  )
}
