import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoginForm, SignupForm } from './AuthForms.jsx'

/**
 * The slide-in-from-the-right login/signup drawer shown over the landing
 * page. Only ever rendered when App.jsx has a backgroundLocation (i.e. the
 * person clicked a Log in / Sign up link on the landing page itself) — a
 * direct visit to /login or /signup renders the full-page version instead.
 */
export default function AuthDrawer({ initialTab }) {
  const navigate = useNavigate()
  const [tab, setTab] = useState(initialTab)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const heroCover = document.querySelector('.hero-cover')
    heroCover?.classList.add('is-shrunk')
    return () => {
      document.body.style.overflow = ''
      heroCover?.classList.remove('is-shrunk')
    }
  }, [])

  function close() {
    setClosing(true)
    // Let the slide-out transition play before actually leaving the route.
    setTimeout(() => navigate(-1), 300)
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isOpen = !closing

  return (
    <>
      <div className={`auth-backdrop ${isOpen ? 'is-open' : ''}`} onClick={close} />
      <div className={`auth-drawer ${isOpen ? 'is-open' : ''}`} role="dialog" aria-modal="true" aria-label="Log in or sign up">
        <button
          type="button"
          aria-label="Close"
          onClick={close}
          style={{
            position: 'absolute', top: 18, right: 18, width: 36, height: 36, borderRadius: '50%',
            border: 'none', background: '#F3E9DC', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3A2E26" strokeWidth="2.5" strokeLinecap="round">
            <line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>

        <div className="auth-drawer-body" style={{ padding: '44px 32px 32px' }}>
          <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 22, marginBottom: 24 }}>🐾 Pawgram</div>

          <div className="auth-drawer-tabs">
            <button type="button" className={tab === 'login' ? 'active' : ''} onClick={() => setTab('login')}>Log in</button>
            <button type="button" className={tab === 'signup' ? 'active' : ''} onClick={() => setTab('signup')}>Sign up</button>
          </div>

          {tab === 'login' ? <LoginForm /> : <SignupForm />}
        </div>
      </div>
    </>
  )
}
