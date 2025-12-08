import type { Metadata } from 'next'
import Script from 'next/script'
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
        <Script
          id="microsoft-clarity"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "uicdd04etj");
            `,
          }}
        />
        <FacebookPixel />
        {children}
      </body>
    </html>
  )
}

