import { useState } from 'react'

// import.meta.env.BASE_URL is Vite's configured base path ("/pawgram/"),
// so these resolve correctly regardless of which route rendered this page.
const PHOTOS = [
  { src: `${import.meta.env.BASE_URL}assets/images/cover-1.jpg`, alt: 'A Yorkshire terrier reaching up for a grilled meat skewer' },
  { src: `${import.meta.env.BASE_URL}assets/images/cover-2.jpg`, alt: 'A Yorkshire terrier dressed up in a striped outfit' },
  { src: `${import.meta.env.BASE_URL}assets/images/cover-3.jpg`, alt: 'A calico cat wearing a pink harness, resting on a wicker chair' },
  { src: `${import.meta.env.BASE_URL}assets/images/cover-4.jpg`, alt: 'A corgi playing with a tennis ball in the grass' },
]

export default function HeroCarousel() {
  // No persisted state (no localStorage) — always starts on the main photo
  // on page load, by design.
  const [index, setIndex] = useState(0)
  const [fading, setFading] = useState(false)

  function go(delta) {
    setFading(true)
    setTimeout(() => {
      setIndex((i) => (i + delta + PHOTOS.length) % PHOTOS.length)
      setFading(false)
    }, 180)
  }

  function goTo(i) {
    setFading(true)
    setTimeout(() => {
      setIndex(i)
      setFading(false)
    }, 180)
  }

  const photo = PHOTOS[index]

  return (
    <div className="hero-media" style={{ position: 'relative', height: '100%' }}>
      <img
        className="hero-cover-img"
        src={photo.src}
        alt={photo.alt}
        loading="eager"
        style={{
          width: '100%', height: '100%', maxHeight: 560, objectFit: 'cover', display: 'block',
          transition: 'opacity .35s ease', opacity: fading ? 0 : 1,
        }}
      />
      <div className="hero-media-gradient" style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(0deg,rgba(40,28,20,.72) 0%,rgba(40,28,20,.38) 38%,rgba(40,28,20,0) 65%)',
      }} />
      <div style={{
        position: 'absolute', top: 18, left: 22, fontFamily: "'Fredoka',sans-serif", fontWeight: 600,
        fontSize: 13, color: '#3A2E26', background: '#fff', padding: '7px 15px', borderRadius: 999,
        boxShadow: '0 6px 18px rgba(0,0,0,.12)',
      }}>📸 Real pets, real moments</div>

      <button
        type="button"
        className="hero-cover-prev"
        aria-label="Previous photo"
        onClick={() => go(-1)}
        style={{
          position: 'absolute', top: '50%', left: 16, transform: 'translateY(-50%)', width: 44, height: 44,
          borderRadius: '50%', background: 'rgba(255,255,255,.85)', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(0,0,0,.18)', zIndex: 2,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3A2E26" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
      </button>
      <button
        type="button"
        className="hero-cover-next"
        aria-label="Next photo"
        onClick={() => go(1)}
        style={{
          position: 'absolute', top: '50%', right: 16, transform: 'translateY(-50%)', width: 44, height: 44,
          borderRadius: '50%', background: 'rgba(255,255,255,.85)', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(0,0,0,.18)', zIndex: 2,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3A2E26" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
      </button>

      <div className="hero-cover-dots" style={{ position: 'absolute', top: 22, right: 22, display: 'flex', gap: 8, zIndex: 2 }}>
        {PHOTOS.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Show photo ${i + 1}`}
            onClick={() => goTo(i)}
            style={{
              width: 8, height: 8, borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer',
              background: i === index ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,.5)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
