import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * The "Explore" nav item's search dropdown, shared by every logged-in
 * page's sidebar. Submitting always navigates to /search?q=... — even
 * from the Search page itself, so a fresh search re-triggers that page's
 * own load (its effect depends on the URL's q param).
 */
export default function ExploreDropdown({ active }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const wrapRef = useRef(null)
  const toggleRef = useRef(null)
  const inputRef = useRef(null)

  function openDropdown() {
    const rect = toggleRef.current.getBoundingClientRect()
    setPos({
      top: rect.bottom + 6,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - 256)),
    })
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  useEffect(() => {
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    navigate('/search?q=' + encodeURIComponent(q))
    setOpen(false)
  }

  return (
    <div ref={wrapRef} className="explore-wrap" style={{ position: 'relative' }}>
      <a
        href="#"
        ref={toggleRef}
        className={`navitem ${active ? 'active' : ''}`}
        onClick={(e) => { e.preventDefault(); open ? setOpen(false) : openDropdown() }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
        <span className="nav-label">Explore</span>
      </a>
      {open && (
        <div className="explore-dropdown" style={{ display: 'block', top: pos.top, left: pos.left }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search people or posts…"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ flex: 1, minWidth: 0, padding: '10px 12px', border: '2px solid #E3D6C6', borderRadius: 10, fontSize: 14, outline: 'none' }}
            />
            <button type="submit" className="btn" style={{ background: '#D9784F', color: '#fff', padding: '10px 14px', fontSize: 13, flex: 'none' }}>Go</button>
          </form>
        </div>
      )}
    </div>
  )
}
