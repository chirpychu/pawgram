import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { logout } from '../hooks/useAuth.js'

/**
 * The sidebar's "☰ Settings" nav item — a three-line icon that opens a
 * popover with account settings (currently just the public/private
 * toggle) and Log out, replacing the old standalone Log out link at the
 * bottom of the sidebar.
 */
export default function SettingsMenu({ me }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [isPrivate, setIsPrivate] = useState(Boolean(me?.is_private))
  const [saving, setSaving] = useState(false)
  const [pos, setPos] = useState({ bottom: 0, left: 0 })
  const wrapRef = useRef(null)
  const toggleRef = useRef(null)

  useEffect(() => { setIsPrivate(Boolean(me?.is_private)) }, [me?.is_private])

  function openMenu() {
    const rect = toggleRef.current.getBoundingClientRect()
    setPos({
      bottom: window.innerHeight - rect.top + 6,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - 256)),
    })
    setOpen(true)
  }

  useEffect(() => {
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    // mousedown rather than click — see MessageBubble/NotificationBell for why.
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  async function togglePrivacy() {
    if (!me || saving) return
    const next = !isPrivate
    setSaving(true)
    setIsPrivate(next)
    const { error } = await supabase.from('profiles').update({ is_private: next }).eq('id', me.id)
    setSaving(false)
    if (error) {
      setIsPrivate(!next)
      alert("Couldn't update privacy: " + error.message)
    }
  }

  return (
    <div ref={wrapRef} className="settings-menu" style={{ position: 'relative', marginTop: 'auto' }}>
      <a
        href="#"
        ref={toggleRef}
        className="navitem"
        onClick={(e) => { e.preventDefault(); open ? setOpen(false) : openMenu() }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18" />
          <path d="M3 12h18" />
          <path d="M3 18h18" />
        </svg>
        <span className="nav-label">Settings</span>
      </a>

      {open && (
        <div
          className="explore-dropdown"
          style={{ display: 'block', bottom: pos.bottom, left: pos.left, top: 'auto', width: 240 }}
        >
          <div style={{ padding: '6px 10px 2px', fontSize: 13, fontWeight: 600, color: '#3A2E26' }}>Account privacy</div>
          <div style={{ padding: '2px 10px 12px', fontSize: 13, color: '#6B5E54' }}>
            {isPrivate ? 'Private — only followers see your posts' : 'Public — anyone can see your posts'}
          </div>
          <button
            onClick={togglePrivacy}
            disabled={saving || !me}
            className="btn"
            style={{ width: '100%', background: '#FBF3E9', color: '#D9784F', padding: 10, fontSize: 13, marginBottom: 8 }}
          >
            {saving ? 'Saving…' : `Switch to ${isPrivate ? 'Public' : 'Private'}`}
          </button>

          <div style={{ borderTop: '1px solid #EFE3D2', margin: '4px 0 8px' }} />

          <button
            onClick={() => { setOpen(false); logout(navigate) }}
            className="btn"
            style={{ width: '100%', textAlign: 'left', background: 'transparent', color: '#A6927C', padding: '10px', fontSize: 13 }}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
