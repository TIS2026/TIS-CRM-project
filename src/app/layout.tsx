import './globals.css'
import type { Metadata } from 'next'

import Link from 'next/link'

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
        <nav style={{ background: 'rgba(20,20,20,0.8)', padding: '1rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--primary)' }}>EduCRM</div>
          <Link href="/" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>Dashboard</Link>
          <Link href="/upload" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>Bulk Upload</Link>
          <Link href="/leads/new" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>+ Add Lead</Link>
          <Link href="/settings" style={{ color: 'var(--text-primary)', textDecoration: 'none', marginLeft: 'auto' }}>⚙️ Settings</Link>
        </nav>
        <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
