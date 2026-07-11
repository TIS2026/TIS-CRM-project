import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'EduCRM — Sales Dashboard',
  description: 'Enterprise-grade Educational CRM System',
}

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <nav style={{
          background: '#ffffff',
          padding: '0 2rem',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex',
          gap: '0.25rem',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          height: 'var(--nav-height)',
        }}>
          {/* Brand */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem', marginRight: '1.5rem' }}>
            <div style={{
              width: '32px', height: '32px',
              background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', color: 'white', fontWeight: '800',
              flexShrink: 0,
            }}>E</div>
            <span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
              Edu<span style={{ color: 'var(--accent-primary)' }}>CRM</span>
            </span>
          </Link>

          {/* Nav Links */}
          <Link href="/" className="nav-link">Dashboard</Link>
          <Link href="/upload" className="nav-link">Bulk Upload</Link>

          {/* Right side */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link href="/leads/new" className="btn" style={{ textDecoration: 'none', gap: '0.4rem', padding: '0.5rem 1rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Lead
            </Link>
            <Link
              href="/settings"
              style={{
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                padding: '0.5rem',
                borderRadius: '8px',
                background: 'var(--bg-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '38px',
                height: '38px',
                border: '1px solid var(--glass-border)',
                transition: 'var(--transition)',
              }}
              title="Settings"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </Link>
          </div>
        </nav>
        <main style={{ padding: '1.5rem 2rem', maxWidth: '1500px', margin: '0 auto' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
