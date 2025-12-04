import type { Metadata } from 'next'
import './globals.css'
import FacebookPixel from '@/components/FacebookPixel'

export const metadata: Metadata = {
  title: 'Xperience Living',
  description: 'AI-powered product recommendations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <FacebookPixel />
        {children}
      </body>
    </html>
  )
}

