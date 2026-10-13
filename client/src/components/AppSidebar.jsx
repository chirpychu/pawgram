import { Link } from 'react-router-dom'
import SettingsMenu from './SettingsMenu.jsx'
import WeatherWidget from './WeatherWidget.jsx'

/**
 * Left nav shared by Feed, Profile and Search. `active` is one of
 * 'home' | 'explore' | 'profile'. `me` (the signed-in user's profile row)
 * is used to build the "View profile" link and for the settings menu's
 * account-privacy toggle; `extra` renders any page-specific extra items.
 */
export default function AppSidebar({ active, me, extra }) {
  return (
    <div className="left-sidebar" style={{ width: 230, flex: '0 0 230px', padding: '28px 16px', display: 'flex', flexDirection: 'column', gap: 6, borderRight: '1px solid #EAE0D2' }}>
      <div className="logo" style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 24, padding: '8px 16px 24px', color: '#3A2E26' }}>Pawgram</div>

      <Link to="/feed" className={`navitem ${active === 'home' ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l9-7 9 7" /><path d="M5 10v9h14v-9" /></svg>
        <span className="nav-label">Home</span>
      </Link>

      <Link to="/explore" className={`navitem ${active === 'explore' ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
        <span className="nav-label">Explore</span>
      </Link>

      <Link to={me ? `/profile?u=${encodeURIComponent(me.username)}` : '#'} className={`navitem ${active === 'profile' ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" /></svg>
        <span className="nav-label">Profile</span>
      </Link>

      {extra}

      <WeatherWidget />

      <SettingsMenu me={me} />
    </div>
  )
}
