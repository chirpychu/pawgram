import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'

export const ANIMAL_EMOJIS = ['🐾', '🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐯']

/**
 * A small animal-emoji reaction picker, reused for both posts (table
 * "likes", idColumn "post_id") and comments (table "comment_reactions",
 * idColumn "comment_id"). Each row is keyed by (targetId, user_id), so a
 * person has exactly one reaction on a given post or comment — picking a
 * new emoji swaps it, picking the same one again clears it.
 *
 * `ownerId` (the post/comment author's profile id) and `postId` (the post
 * the reaction lives on or under — same as targetId for likes, the parent
 * post for a comment reaction) are optional: when given, and the reactor
 * isn't the owner, a notification row is kept in sync alongside the
 * reaction itself so the owner can see who reacted and with which emoji.
 */
export default function ReactionBar({ table, idColumn, targetId, ownerId, postId, me, size = 'normal' }) {
  const [reactions, setReactions] = useState([])
  const [open, setOpen] = useState(false)

  const load = useCallback(async () => {
    const { data, error } = await supabase.from(table).select('user_id, reaction').eq(idColumn, targetId)
    if (!error) setReactions(data || [])
  }, [table, idColumn, targetId])

  useEffect(() => { load() }, [load])

  const mine = reactions.find((r) => r.user_id === me.id)
  const total = reactions.length

  const notifType = table === 'likes' ? 'post_reaction' : 'comment_reaction'
  const notifyOwner = ownerId && ownerId !== me.id

  async function pick(emoji) {
    setOpen(false)
    const hadMine = Boolean(mine)

    if (hadMine && mine.reaction === emoji) {
      // Unreacting: drop the reaction and any notification it generated.
      setReactions((rs) => rs.filter((r) => r.user_id !== me.id))
      await supabase.from(table).delete().eq(idColumn, targetId).eq('user_id', me.id)
      if (notifyOwner) {
        await supabase.from('notifications').delete()
          .eq('actor_id', me.id).eq('recipient_id', ownerId).eq('type', notifType).eq(idColumn, targetId)
      }
      return
    }

    setReactions((rs) => [...rs.filter((r) => r.user_id !== me.id), { user_id: me.id, reaction: emoji }])
    const { error } = await supabase.from(table).upsert({ [idColumn]: targetId, user_id: me.id, reaction: emoji })
    if (error) {
      load()
      return
    }
    if (!notifyOwner) return

    if (hadMine) {
      // Switched to a different emoji — update the existing notification
      // rather than leaving a stale one or creating a duplicate.
      await supabase.from('notifications')
        .update({ reaction: emoji, read: false, created_at: new Date().toISOString() })
        .eq('actor_id', me.id).eq('recipient_id', ownerId).eq('type', notifType).eq(idColumn, targetId)
    } else {
      await supabase.from('notifications').insert({
        recipient_id: ownerId,
        actor_id: me.id,
        type: notifType,
        reaction: emoji,
        post_id: table === 'likes' ? targetId : postId,
        comment_id: table === 'comment_reactions' ? targetId : null,
      })
    }
  }

  const small = size === 'small'

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn"
        style={{
          background: mine ? '#FBF3E9' : 'transparent',
          color: mine ? '#D9784F' : '#A6927C',
          border: 'none',
          padding: small ? '4px 10px' : '6px 14px',
          fontSize: small ? 13 : 14,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          cursor: 'pointer',
        }}
      >
        <span>{mine ? mine.reaction : '🐾'}</span>
        <span>{mine ? 'Reacted' : 'React'}</span>
        {total > 0 && <span style={{ color: '#A6927C' }}>· {total}</span>}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9 }} />
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              marginBottom: 8,
              background: '#fff',
              borderRadius: 999,
              boxShadow: '0 4px 20px rgba(0,0,0,.15)',
              padding: '8px 10px',
              display: 'flex',
              gap: 4,
              zIndex: 10,
              whiteSpace: 'nowrap',
            }}
          >
            {ANIMAL_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => pick(e)}
                title={e}
                style={{
                  background: mine?.reaction === e ? '#FBF3E9' : 'transparent',
                  border: 'none',
                  borderRadius: '50%',
                  width: 34,
                  height: 34,
                  fontSize: 18,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
