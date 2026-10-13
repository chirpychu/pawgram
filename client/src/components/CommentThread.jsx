import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { timeAgo } from '../utils/timeAgo'
import ReactionBar from './ReactionBar.jsx'

function Comment({ comment, childrenByParent, me, onReply, depth = 0 }) {
  const [replying, setReplying] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [showReplies, setShowReplies] = useState(depth > 0)
  const replies = childrenByParent[comment.id] || []
  const name = comment.author?.display_name || comment.author?.username || 'Someone'

  async function submitReply() {
    const body = replyText.trim()
    if (!body) return
    setReplyText('')
    setReplying(false)
    setShowReplies(true)
    await onReply(body, comment.id)
  }

  return (
    <div style={{ marginLeft: depth > 0 ? 36 : 0, marginTop: depth > 0 ? 10 : 16 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#6B9080', flex: '0 0 30px' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: '#FBF3E9', borderRadius: 14, padding: '8px 14px', display: 'inline-block', maxWidth: '100%' }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#3A2E26' }}>{name}</div>
            <div style={{ fontSize: 14, color: '#3A2E26', whiteSpace: 'pre-wrap' }}>{comment.body}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4, fontSize: 12, color: '#A6927C', flexWrap: 'wrap' }}>
            <span>{timeAgo(comment.created_at)}</span>
            <ReactionBar table="comment_reactions" idColumn="comment_id" targetId={comment.id} me={me} size="small" />
            <button onClick={() => setReplying((r) => !r)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A6927C', fontSize: 12, padding: 0 }}>
              Reply
            </button>
            {replies.length > 0 && (
              <button
                onClick={() => setShowReplies((s) => !s)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D9784F', fontSize: 12, padding: 0, fontWeight: 600 }}
              >
                {showReplies ? 'Hide' : 'View'} {replies.length} repl{replies.length === 1 ? 'y' : 'ies'}
              </button>
            )}
          </div>

          {replying && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input
                autoFocus
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submitReply() }}
                placeholder={`Reply to ${name}…`}
                style={{ flex: 1, minWidth: 0, background: '#fff', border: '1px solid #E3D6C6', borderRadius: 999, padding: '8px 14px', fontSize: 13, outline: 'none' }}
              />
              <button onClick={submitReply} className="btn" style={{ background: '#D9784F', color: '#fff', padding: '7px 16px', fontSize: 13 }}>
                Send
              </button>
            </div>
          )}

          {showReplies && replies.map((r) => (
            <Comment key={r.id} comment={r} childrenByParent={childrenByParent} me={me} onReply={onReply} depth={depth + 1} />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Loads every comment on a post in one query (they're ordered oldest-first
 * and small in number for this app) and builds the reply tree client-side
 * via `parent_comment_id`. A top-level comment with no parent can be
 * replied to, and so can a reply itself, so threads can nest.
 */
export default function CommentThread({ postId, me, onCountChange }) {
  const [state, setState] = useState({ loading: true, comments: [], error: null })
  const [text, setText] = useState('')

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('id, body, created_at, user_id, parent_comment_id, author:profiles!comments_user_id_fkey(username, display_name)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (error) {
      setState({ loading: false, comments: [], error: error.message })
      return
    }
    setState({ loading: false, comments: data || [], error: null })
    onCountChange?.(data?.length ?? 0)
  }, [postId, onCountChange])

  useEffect(() => { load() }, [load])

  async function addComment(body, parentCommentId = null) {
    const { error } = await supabase.from('comments').insert({ post_id: postId, user_id: me.id, body, parent_comment_id: parentCommentId })
    if (error) {
      alert("Couldn't post comment: " + error.message)
      return
    }
    load()
  }

  async function submitTop() {
    const body = text.trim()
    if (!body) return
    setText('')
    await addComment(body)
  }

  if (state.loading) return <div style={{ padding: '4px 22px 18px', fontSize: 13, color: '#A6927C' }}>Loading comments…</div>
  if (state.error) return <div style={{ padding: '4px 22px 18px', fontSize: 13, color: '#C0392B' }}>Couldn't load comments: {state.error}</div>

  const topLevel = state.comments.filter((c) => !c.parent_comment_id)
  const childrenByParent = {}
  for (const c of state.comments) {
    if (c.parent_comment_id) {
      childrenByParent[c.parent_comment_id] = childrenByParent[c.parent_comment_id] || []
      childrenByParent[c.parent_comment_id].push(c)
    }
  }

  return (
    <div style={{ padding: '4px 22px 18px' }}>
      {topLevel.length === 0 && <div style={{ fontSize: 13, color: '#A6927C', padding: '8px 0' }}>No comments yet — be the first to say something.</div>}
      {topLevel.map((c) => (
        <Comment key={c.id} comment={c} childrenByParent={childrenByParent} me={me} onReply={addComment} />
      ))}

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submitTop() }}
          placeholder="Write a comment…"
          style={{ flex: 1, minWidth: 0, background: '#FBF3E9', border: 'none', borderRadius: 999, padding: '10px 16px', fontSize: 14, outline: 'none' }}
        />
        <button onClick={submitTop} className="btn" style={{ background: '#D9784F', color: '#fff', padding: '9px 18px', fontSize: 13 }}>
          Post
        </button>
      </div>
    </div>
  )
}
