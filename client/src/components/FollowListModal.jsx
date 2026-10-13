import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'

/**
 * Centered modal listing either the people following `profileId` or the
 * people `profileId` follows — only ever accepted follows, matching the
 * counts shown on the profile header. Clicking a person navigates to
 * their profile and closes the modal.
 */
export default function FollowListModal({ profileId, mode, onClose }) {
  const [state, setState] = useState({ loading: true, people: [], error: null })

  useEffect(() => {
    let cancelled = false

    async function load() {
      const query =
        mode === 'followers'
          ? supabase
              .from('follows')
              .select('follower:profiles!follows_follower_id_fkey(id, username, display_name)')
              .eq('following_id', profileId)
              .eq('status', 'accepted')
          : supabase
              .from('follows')
              .select('following:profiles!follows_following_id_fkey(id, username, display_name)')
              .eq('follower_id', profileId)
              .eq('status', 'accepted')

      const { data, error } = await query
      if (cancelled) return
      if (error) {
        setState({ loading: false, people: [], error: error.message })
        return
      }
      const people = (data || []).map((row) => (mode === 'followers' ? row.follower : row.following)).filter(Boolean)
      setState({ loading: false, people, error: null })
    }

    load()
    return () => { cancelled = true }
  }, [profileId, mode])

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(58,46,38,.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 20, width: 360, maxWidth: '100%', maxHeight: '70vh', overflowY: 'auto', padding: 20 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 18, color: '#3A2E26' }}>
            {mode === 'followers' ? 'Followers' : 'Following'}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#A6927C', padding: 4 }}>✕</button>
        </div>

        {state.loading && <div style={{ fontSize: 13, color: '#A6927C', padding: '12px 4px' }}>Loading…</div>}
        {!state.loading && state.error && <div style={{ fontSize: 13, color: '#C0392B', padding: '12px 4px' }}>Couldn't load: {state.error}</div>}
        {!state.loading && !state.error && state.people.length === 0 && (
          <div style={{ fontSize: 13, color: '#A6927C', padding: '12px 4px' }}>
            {mode === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
          </div>
        )}
        {!state.loading && !state.error && state.people.map((p) => (
          <Link
            key={p.id}
            to={`/profile?u=${encodeURIComponent(p.username)}`}
            onClick={onClose}
            className="plain"
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 4px' }}
          >
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#6B9080', flex: '0 0 38px' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#3A2E26' }}>{p.display_name || p.username}</div>
              <div style={{ fontSize: 12, color: '#A6927C' }}>@{p.username}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
