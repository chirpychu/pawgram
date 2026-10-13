import { Link, useNavigate } from 'react-router-dom'
import ExploreDropdown from './ExploreDropdown.jsx'
import { logout } from '../hooks/useAuth.js'

/**
 * Left nav shared by Feed, Profile and Search. `active` is one of
 * 'home' | 'explore' | 'profile'. `me` (the signed-in user's profile row)
 * is used to build the "View profile" link; `extra` renders page-specific
 * extra items (Feed's "+ New post" button).
 */
export default function AppSidebar({ active, me, extra }) {
  const navigate = useNavigate()

  return (
    <div className="left-sidebar" style={{ width: 230, flex: '0 0 230px', padding: '28px 16px', display: 'flex', flexDirection: 'column', gap: 6, borderRight: '1px solid #EAE0D2' }}>
      <div className="logo" style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 24, padding: '8px 16px 24px', color: '#3A2E26' }}>Pawgram</div>

      <Link to="/feed" className={`navitem ${active === 'home' ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l9-7 9 7" /><path d="M5 10v9h14v-9" /></svg>
        <span className="nav-label">Home</span>
      </Link>

      <ExploreDropdown active={active === 'explore'} />

      <div className="navitem disabled">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-4.6-9.5-9A5.5 5.5 0 0112 5.5 5.5 5.5 0 0121.5 12c-2.5 4.4-9.5 9-9.5 9z" /></svg>
        <span className="nav-label">Playdates</span>
      </div>
      <div className="navitem disabled">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
        <span className="nav-label">Messages</span>
      </div>

      <Link to={me ? `/profile?u=${encodeURIComponent(me.username)}` : '#'} className={`navitem ${active === 'profile' ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" /></svg>
        <span className="nav-label">Profile</span>
      </Link>

      {extra}

      <a
        href="#"
        className="plain logout-link"
        style={{ marginTop: 'auto', padding: '12px 16px', fontSize: 13, color: '#A6927C' }}
        onClick={(e) => { e.preventDefault(); logout(navigate) }}
      >
        <span className="nav-label">Log out</span>
      </a>
    </div>
  )
}
