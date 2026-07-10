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
        <nav style={{ background: '#ffffff', padding: '1rem 2rem', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '2rem', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ fontWeight: 'bold', fontSize: '1.5rem', color: 'var(--accent)', letterSpacing: '-0.5px' }}>EduCRM</div>
          <Link href="/" className="nav-link" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500, padding: '0.5rem 1rem', borderRadius: '4px', transition: 'background 0.2s' }}>Dashboard</Link>
          <Link href="/upload" className="nav-link" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500, padding: '0.5rem 1rem', borderRadius: '4px', transition: 'background 0.2s' }}>Bulk Upload</Link>
          
          <Link href="/leads/new" className="btn" style={{ textDecoration: 'none', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>+ Add Lead</Link>
          <Link href="/settings" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '1.2rem', padding: '0.5rem', borderRadius: '50%', background: 'var(--bg-highlight)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px' }} title="Settings">⚙️</Link>
        </nav>
        <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
