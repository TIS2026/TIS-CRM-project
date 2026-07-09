import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Antigravity EduCRM',
  description: 'Enterprise-grade Educational CRM System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
