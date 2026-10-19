import { Link, useLocation } from 'react-router-dom'
import HeroCarousel from '../components/HeroCarousel.jsx'
import FreshFromThePack from '../components/FreshFromThePack.jsx'
import PlaydatesSearch from '../components/PlaydatesSearch.jsx'
import { useScrollReveal } from '../hooks/useScrollReveal.js'
import Brand from '../components/Brand.jsx'

const FEATURES = [
  {
    icon: <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#D9784F" strokeWidth="2"><rect x="3" y="5" width="18" height="15" rx="2" /><circle cx="12" cy="13" r="3.5" /><path d="M8 5l1.5-2h5L16 5" /></svg>,
    title: 'Share photos',
    body: "Post pictures and short updates of your pet, just like a feed made for them.",
  },
  {
    icon: <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#D9784F" strokeWidth="2"><circle cx="8" cy="9" r="3.2" /><circle cx="17" cy="9" r="3.2" /><path d="M2 20c0-3.3 2.7-6 6-6s6 2.7 6 6M11 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /></svg>,
    title: 'Meet owners',
    body: 'Follow and chat with other pet parents who share your interests and area.',
  },
  {
    icon: <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#D9784F" strokeWidth="2"><path d="M12 21s-7-4.6-9.5-9A5.5 5.5 0 0112 5.5 5.5 5.5 0 0121.5 12c-2.5 4.4-9.5 9-9.5 9z" /></svg>,
    title: 'Plan playdates',
    body: 'Find nearby parks and events, and set up meetups for your pets.',
  },
]

export default function Landing() {
  const location = useLocation()
  const [featuresRef, featuresVisible] = useScrollReveal()

  const authLinkProps = (to) => ({ to, state: { backgroundLocation: location } })

  return (
    <div style={{ width: '100%', maxWidth: 1320, margin: '0 auto', boxSizing: 'border-box' }}>

      {/* NAV */}
      <div className="nav-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 48px', flexWrap: 'wrap', gap: 16 }}>
        <Brand />
        <div className="nav-row-links" style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
          <a href="#playdates-section" style={{ fontWeight: 500 }}>Playdates</a>
          <a href="#about-section" style={{ fontWeight: 500 }}>About</a>
          <Link {...authLinkProps('/login')} className="btn" style={{ background: 'transparent', color: '#3A2E26', border: '2px solid #3A2E26', padding: '10px 22px', fontSize: 15 }}>Log in</Link>
          <Link {...authLinkProps('/signup')} className="btn" style={{ background: '#D9784F', color: '#fff', padding: '12px 26px', fontSize: 15 }}>Sign up</Link>
        </div>
      </div>

      {/* HERO / COVER */}
      <div className="hero-cover" style={{ position: 'relative', margin: '0 48px 20px', borderRadius: 28, overflow: 'hidden', boxShadow: '0 18px 40px rgba(58,46,38,.14)' }}>
        <HeroCarousel />
        <div className="hero-cover-text" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 40 }}>
          <h1 className="hero-heading" style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 52, lineHeight: 1.05, margin: '0 0 16px', color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,.25)' }}>
            <span className="word" style={{ animationDelay: '.15s' }}>Where</span>{' '}
            <span className="word" style={{ animationDelay: '.3s' }}>pet</span>{' '}
            <span className="word" style={{ animationDelay: '.45s' }}>lovers</span>{' '}
            <span className="word" style={{ animationDelay: '.6s' }}>connect.</span>
          </h1>
          <p className="hero-fade hero-subtitle" style={{ animationDelay: '.9s', fontSize: 18, lineHeight: 1.6, color: '#F6EEE4', margin: '0 0 28px', maxWidth: 480 }}>
            Share your pet's best moments, meet other owners nearby, and set up playdates — all in one friendly place.
          </p>
          <div className="hero-actions hero-fade" style={{ animationDelay: '1.1s', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Link {...authLinkProps('/signup')} className="btn" style={{ background: '#D9784F', color: '#fff', padding: '16px 32px', fontSize: 17 }}>Create your pet's profile</Link>
            <a href="#about-section" className="btn" style={{ background: 'rgba(255,255,255,.92)', color: '#3A2E26', border: 'none', padding: '16px 28px', fontSize: 17 }}>See how it works</a>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div id="about-section" ref={featuresRef} className={`features-row reveal-stagger ${featuresVisible ? 'is-visible' : ''}`}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 24, padding: '24px 48px 56px', scrollMarginTop: 24 }}>
        {FEATURES.map((f) => (
          <div key={f.title} style={{ background: '#fff', borderRadius: 20, padding: 30, boxShadow: '0 2px 10px rgba(0,0,0,.04)' }}>
            {f.icon}
            <h3 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 20, margin: '16px 0 8px', color: '#3A2E26' }}>{f.title}</h3>
            <p style={{ margin: 0, color: '#6B5E54', fontSize: 15, lineHeight: 1.6 }}>{f.body}</p>
          </div>
        ))}
      </div>

      <FreshFromThePack />
      <PlaydatesSearch />

      {/* FOOTER — intentionally not scroll-reveal animated: it holds the only
          Privacy/Terms/Contact links on the page, and a short last-row element
          like this can fail an IntersectionObserver's bottom rootMargin at the
          page's natural scroll end (the box only clears that margin during
          iOS's elastic overscroll bounce, then disappears again once the
          bounce settles back) — always rendering it avoids both. */}
      <div className="footer-row"
        style={{ borderTop: '1px solid #EAE0D2', padding: '28px 48px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, color: '#A6927C', fontSize: 14 }}>
        <div>Pawgram — made for pets and their people</div>
        <div style={{ display: 'flex', gap: 20 }}>
          <Link to="/privacy" style={{ color: '#A6927C' }}>Privacy</Link>
          <Link to="/terms" style={{ color: '#A6927C' }}>Terms</Link>
          <a href="mailto:chirpychu@gmail.com" style={{ color: '#A6927C' }}>Contact</a>
        </div>
      </div>
    </div>
  )
}
