import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { timeAgo } from '../utils/timeAgo'

/**
 * Fixed bottom-right speech-bubble, present on every logged-in page. Shows
 * a list of conversations (grouped from the flat `messages` table by the
 * other participant), a thread view for one of them, and a way to start a
 * new conversation by username. Messaging a private account that hasn't
 * accepted your follow request is blocked server-side by RLS — the
 * sender_insert policy on `messages` — so that's enforced even if this UI
 * had a bug, not just by hiding the button.
 */
export default function MessageBubble({ me }) {
  const [open, setOpen] = useState(false)
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [thread, setThread] = useState(null) // { id, username, display_name } | null
  const [threadMessages, setThreadMessages] = useState([])
  const [threadLoading, setThreadLoading] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newError, setNewError] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const wrapRef = useRef(null)
  const threadEndRef = useRef(null)

  const loadConversations = useCallback(async () => {
    if (!me) return
    const { data, error } = await supabase
      .from('messages')
      .select(
        'id, body, read, created_at, sender_id, recipient_id, sender:profiles!messages_sender_id_fkey(id, username, display_name), recipient:profiles!messages_recipient_id_fkey(id, username, display_name)'
      )
      .or(`sender_id.eq.${me.id},recipient_id.eq.${me.id}`)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      setLoading(false)
      return
    }

    const byOther = new Map()
    for (const m of data || []) {
      const mine = m.sender_id === me.id
      const other = mine ? m.recipient : m.sender
      if (!other) continue
      const existing = byOther.get(other.id)
      if (!existing) {
        byOther.set(other.id, { other, lastMessage: m, unread: 0 })
      }
      if (!mine && !m.read) {
        const entry = byOther.get(other.id)
        entry.unread += 1
      }
    }

    setConversations([...byOther.values()].sort((a, b) => new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at)))
    setLoading(false)
  }, [me])

  useEffect(() => { loadConversations() }, [loadConversations])

  useEffect(() => {
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    // mousedown, not click: a click inside the panel that changes what's
    // rendered (opening a thread, accepting a request, etc.) can unmount
    // the very element the click landed on before the click event finishes
    // bubbling to document, which makes `contains()` see a detached node
    // and misfire as an outside click. mousedown fires before that happens.
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: 'end' })
  }, [threadMessages])

  async function openThread(other) {
    setThread(other)
    setThreadLoading(true)
    setNewError('')
    const { data, error } = await supabase
      .from('messages')
      .select('id, body, read, created_at, sender_id, recipient_id')
      .or(`and(sender_id.eq.${me.id},recipient_id.eq.${other.id}),and(sender_id.eq.${other.id},recipient_id.eq.${me.id})`)
      .order('created_at', { ascending: true })

    if (!error) {
      setThreadMessages(data || [])
      const unreadIds = (data || []).filter((m) => m.recipient_id === me.id && !m.read).map((m) => m.id)
      if (unreadIds.length > 0) {
        await supabase.from('messages').update({ read: true }).in('id', unreadIds)
        loadConversations()
      }
    }
    setThreadLoading(false)
  }

  async function sendMessage() {
    const body = draft.trim()
    if (!body || !thread || sending) return
    setSending(true)
    setDraft('')
    const { data, error } = await supabase
      .from('messages')
      .insert({ sender_id: me.id, recipient_id: thread.id, body })
      .select('id, body, read, created_at, sender_id, recipient_id')
      .single()
    setSending(false)
    if (error) {
      setNewError("Couldn't send — this account may only accept messages from people it follows back.")
      return
    }
    setThreadMessages((ms) => [...ms, data])
    loadConversations()
  }

  async function startNewConversation() {
    const uname = newUsername.trim().replace(/^@/, '')
    if (!uname) return
    setLookingUp(true)
    setNewError('')
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .eq('username', uname)
      .maybeSingle()
    setLookingUp(false)
    if (error || !profile) {
      setNewError(`Couldn't find @${uname}.`)
      return
    }
    if (profile.id === me.id) {
      setNewError("That's you!")
      return
    }
    setNewUsername('')
    openThread(profile)
  }

  const unreadTotal = conversations.reduce((sum, c) => sum + c.unread, 0)

  function closePanel() {
    setOpen(false)
    setThread(null)
    setNewError('')
  }

  return (
    <div ref={wrapRef} className="message-bubble" style={{ position: 'fixed', bottom: 24, right: 28, zIndex: 1001 }}>
      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            right: 0,
            marginBottom: 10,
            width: 340,
            maxHeight: 460,
            display: 'flex',
            flexDirection: 'column',
            background: '#fff',
            borderRadius: 18,
            boxShadow: '0 10px 30px rgba(0,0,0,.16)',
            overflow: 'hidden',
          }}
        >
          {!thread ? (
            <>
              <div style={{ padding: '14px 16px 10px', fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 15, color: '#3A2E26' }}>
                Messages
              </div>

              <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px' }}>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') startNewConversation() }}
                  placeholder="Message @username…"
                  style={{ flex: 1, minWidth: 0, padding: '8px 12px', border: '2px solid #E3D6C6', borderRadius: 999, fontSize: 13, outline: 'none' }}
                />
                <button onClick={startNewConversation} disabled={lookingUp} className="btn" style={{ background: '#D9784F', color: '#fff', padding: '8px 14px', fontSize: 13 }}>
                  Go
                </button>
              </div>
              {newError && <div style={{ fontSize: 12, color: '#C0392B', padding: '0 16px 10px' }}>{newError}</div>}

              <div style={{ overflowY: 'auto', flex: 1, padding: '0 8px 10px' }}>
                {loading && <div style={{ fontSize: 13, color: '#A6927C', padding: '8px' }}>Loading…</div>}
                {!loading && conversations.length === 0 && (
                  <div style={{ fontSize: 13, color: '#A6927C', padding: '8px' }}>No messages yet — search a username above to start one.</div>
                )}
                {!loading && conversations.map((c) => (
                  <button
                    key={c.other.id}
                    onClick={() => openThread(c.other)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px',
                      borderRadius: 12,
                      background: c.unread > 0 ? '#FBF3E9' : 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#6B9080', flex: '0 0 36px' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#3A2E26' }}>{c.other.display_name || c.other.username}</div>
                      <div style={{ fontSize: 12, color: '#A6927C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.lastMessage.sender_id === me.id ? 'You: ' : ''}{c.lastMessage.body}
                      </div>
                    </div>
                    {c.unread > 0 && (
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#D9784F', flex: '0 0 8px' }} />
                    )}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: '1px solid #EFE3D2' }}>
                <button onClick={() => setThread(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#A6927C', padding: 4 }}>‹</button>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#6B9080', flex: '0 0 30px' }} />
                <div style={{ fontWeight: 600, fontSize: 14, color: '#3A2E26' }}>{thread.display_name || thread.username}</div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {threadLoading && <div style={{ fontSize: 13, color: '#A6927C' }}>Loading…</div>}
                {!threadLoading && threadMessages.length === 0 && (
                  <div style={{ fontSize: 13, color: '#A6927C' }}>No messages yet — say hi!</div>
                )}
                {!threadLoading && threadMessages.map((m) => {
                  const mine = m.sender_id === me.id
                  return (
                    <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                      <div
                        style={{
                          maxWidth: '78%',
                          padding: '8px 12px',
                          borderRadius: 14,
                          fontSize: 13,
                          whiteSpace: 'pre-wrap',
                          background: mine ? '#D9784F' : '#FBF3E9',
                          color: mine ? '#fff' : '#3A2E26',
                        }}
                      >
                        {m.body}
                      </div>
                    </div>
                  )
                })}
                <div ref={threadEndRef} />
              </div>

              {newError && <div style={{ fontSize: 12, color: '#C0392B', padding: '0 12px 6px' }}>{newError}</div>}

              <div style={{ display: 'flex', gap: 8, padding: 10, borderTop: '1px solid #EFE3D2' }}>
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') sendMessage() }}
                  placeholder="Write a message…"
                  style={{ flex: 1, minWidth: 0, padding: '9px 14px', background: '#FBF3E9', border: 'none', borderRadius: 999, fontSize: 13, outline: 'none' }}
                />
                <button onClick={sendMessage} disabled={sending} className="btn" style={{ background: '#D9784F', color: '#fff', padding: '9px 16px', fontSize: 13 }}>
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => (open ? closePanel() : setOpen(true))}
        title="Messages"
        style={{
          position: 'relative',
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: '#D9784F',
          border: 'none',
          boxShadow: '0 4px 14px rgba(217,120,79,.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
        {unreadTotal > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              background: '#3A2E26',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid #FBF3E9',
            }}
          >
            {unreadTotal > 9 ? '9+' : unreadTotal}
          </span>
        )}
      </button>
    </div>
  )
}
