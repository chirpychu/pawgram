import { Link } from 'react-router-dom'
import Brand from './Brand.jsx'

/**
 * Shared chrome for standalone legal/info pages (Privacy Policy, Terms)
 * reached from the landing page footer. Not part of the logged-in app
 * shell — these are plain, public, unauthenticated pages.
 */
export default function LegalPageLayout({ title, updated, children }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '28px 20px 80px' }}>
        <Link to="/" style={{ display: 'inline-block', marginBottom: 28 }}>
          <Brand />
        </Link>

        <div className="card" style={{ padding: '36px 32px' }}>
          <h1 style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 28, margin: '0 0 6px', color: 'var(--ink)' }}>
            {title}
          </h1>
          {updated && (
            <div style={{ fontSize: 13, color: 'var(--ink-faint)', marginBottom: 28 }}>Last updated: {updated}</div>
          )}

          <div className="legal-body" style={{ color: 'var(--ink-soft)', fontSize: 15, lineHeight: 1.7 }}>
            {children}
          </div>
        </div>

        <div style={{ marginTop: 20, fontSize: 13, color: 'var(--ink-faint)' }}>
          <Link to="/" style={{ color: 'var(--orange)', fontWeight: 600 }}>← Back to Pawgram</Link>
        </div>
      </div>
    </div>
  )
}
