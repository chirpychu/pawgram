import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { timeAgo } from '../utils/timeAgo'
import Avatar from './Avatar.jsx'

/**
 * Fixed top-right bell, present on every logged-in page. Shows a badge
 * with the unread count; opening the dropdown marks everything read.
 * Follow-request notifications get inline Accept/Reject buttons; once
 * acted on, the request disappears from the list (the requester gets
 * their own "accepted" notification separately, or the row is just
 * removed on reject).
 */
export default function NotificationBell({ me }) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const wrapRef = useRef(null)

  const load = useCallback(async () => {
    if (!me) return
    const { data, error } = await supabase
      .from('notifications')
      .select('id, type, read, created_at, actor_id, reaction, post_id, comment_id, message, actor:profiles!notifications_actor_id_fkey(username, display_name, avatar_url)')
      .eq('recipient_id', me.id)
      .order('created_at', { ascending: false })
      .limit(30)
    if (!error) {
      setNotifications(data || [])
      setLoading(false)
    }
  }, [me])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    // mousedown, not click: accepting/rejecting a request removes that
    // notification's row before the click event finishes bubbling to
    // document, which would make `contains()` see a detached node and
    // misfire as an outside click. mousedown fires before that happens.
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  async function toggleOpen() {
    const next = !open
    setOpen(next)
    if (next) {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
      if (unreadIds.length > 0) {
        setNotifications((ns) => ns.map((n) => ({ ...n, read: true })))
        await supabase.from('notifications').update({ read: true }).in('id', unreadIds)
      }
    }
  }

  async function respond(notif, accept) {
    setBusyId(notif.id)
    try {
      if (accept) {
        const { error } = await supabase
          .from('follows')
          .update({ status: 'accepted' })
          .eq('follower_id', notif.actor_id)
          .eq('following_id', me.id)
        if (error) {
          alert("Couldn't accept: " + error.message)
          return
        }
        await supabase.from('notifications').insert({ recipient_id: notif.actor_id, actor_id: me.id, type: 'follow_accepted' })
      } else {
        await supabase.from('follows').delete().eq('follower_id', notif.actor_id).eq('following_id', me.id)
      }
      await supabase.from('notifications').delete().eq('id', notif.id)
      setNotifications((ns) => ns.filter((n) => n.id !== notif.id))
    } finally {
      setBusyId(null)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div ref={wrapRef} className="notification-bell" style={{ position: 'fixed', top: 22, right: 28, zIndex: 1001 }}>
      <button
        onClick={toggleOpen}
        title="Notifications"
        style={{
          position: 'relative',
          width: 42,
          height: 42,
          borderRadius: '50%',
          background: '#fff',
          border: 'none',
          boxShadow: '0 2px 10px rgba(0,0,0,.08)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#3A2E26',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              background: '#D9784F',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 8,
            width: 320,
            maxHeight: 420,
            overflowY: 'auto',
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 10px 30px rgba(0,0,0,.16)',
            padding: 10,
          }}
        >
          <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 15, color: '#3A2E26', padding: '6px 8px 10px' }}>
            Notifications
          </div>

          {loading && <div style={{ fontSize: 13, color: '#A6927C', padding: '8px' }}>Loading…</div>}
          {!loading && notifications.length === 0 && (
            <div style={{ fontSize: 13, color: '#A6927C', padding: '8px' }}>Nothing yet — follow requests and updates will show up here.</div>
          )}

          {!loading && notifications.map((n) => {
            const isSystem = n.type === 'post_removed'
            const name = isSystem ? 'Pawgram' : (n.actor?.display_name || n.actor?.username || 'Someone')
            return (
              <div key={n.id} style={{ display: 'flex', gap: 10, padding: '10px 8px', borderRadius: 12, background: n.read ? 'transparent' : '#FBF3E9' }}>
                {isSystem ? (
                  <div style={{ width: 34, height: 34, flex: '0 0 34px', borderRadius: '50%', background: '#F3E9DC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🐾</div>
                ) : (
                  <Avatar url={n.actor?.avatar_url} name={name} size={34} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: '#3A2E26' }}>
                    {isSystem ? (
                      <span style={{ fontWeight: 600, color: '#3A2E26' }}>{name}</span>
                    ) : (
                      <Link to={`/profile?u=${encodeURIComponent(n.actor?.username || '')}`} style={{ fontWeight: 600, color: '#3A2E26' }}>{name}</Link>
                    )}{' '}
                    {n.type === 'follow_request' && 'requested to follow you'}
                    {n.type === 'follow_accepted' && 'accepted your follow request'}
                    {n.type === 'post_reaction' && <>reacted {n.reaction} to your post</>}
                    {n.type === 'comment_reaction' && <>reacted {n.reaction} to your comment</>}
                    {n.type === 'post_removed' && (n.message || 'removed one of your posts')}
                  </div>
                  <div style={{ fontSize: 11, color: '#A6927C', marginTop: 2 }}>{timeAgo(n.created_at)}</div>

                  {n.type === 'follow_request' && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button
                        onClick={() => respond(n, true)}
                        disabled={busyId === n.id}
                        className="btn"
                        style={{ background: '#D9784F', color: '#fff', padding: '6px 14px', fontSize: 12 }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => respond(n, false)}
                        disabled={busyId === n.id}
                        className="btn"
                        style={{ background: '#F3E9DC', color: '#3A2E26', padding: '6px 14px', fontSize: 12 }}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
