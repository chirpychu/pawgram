import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useElapsedLabel } from '../hooks/useElapsedLabel.js'
import { supabase } from '../services/supabaseClient'
import AppSidebar from '../components/AppSidebar.jsx'
import PostCard from '../components/PostCard.jsx'
import NotificationBell from '../components/NotificationBell.jsx'
import MessageBubble from '../components/MessageBubble.jsx'
import FollowListModal from '../components/FollowListModal.jsx'
import Avatar from '../components/Avatar.jsx'

const MAX_AVATAR_BYTES = 5 * 1024 * 1024

function ProfileHeader({ profile, isMe, postCount, followerCount, followingCount, followState, showCounts, onToggleFollow, onSaved, onOpenFollowers, onOpenFollowing }) {
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState(profile.display_name || '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const label = useElapsedLabel(saving, 'Saving…')
  const [followBusy, setFollowBusy] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const fileInputRef = useRef(null)

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // let the same file be picked again later if needed
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setAvatarError('Please choose an image file.')
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError('That image is too large — please pick one under 5MB.')
      return
    }

    setAvatarError('')
    setUploadingAvatar(true)

    const ext = file.name.includes('.') ? file.name.split('.').pop() : 'jpg'
    const path = `${profile.id}/${Date.now()}.${ext}`
    const previousPath = profile.avatar_url

    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (uploadError) {
      setUploadingAvatar(false)
      setAvatarError("Couldn't upload: " + uploadError.message)
      return
    }

    const { error: updateError } = await supabase.from('profiles').update({ avatar_url: path }).eq('id', profile.id)
    setUploadingAvatar(false)
    if (updateError) {
      setAvatarError("Couldn't save: " + updateError.message)
      return
    }

    // Best-effort cleanup of the old file — not worth failing the whole
    // change over if this doesn't succeed.
    if (previousPath && previousPath !== path) {
      supabase.storage.from('avatars').remove([previousPath])
    }

    onSaved(null)
  }

  async function save() {
    const trimmed = displayName.trim()
    if (!trimmed) {
      setError('Display name cannot be empty.')
      return
    }
    setError('')
    setSaving(true)
    try {
      // .select().single() forces Postgres to report back the row it
      // actually changed — without it, Supabase's update() can return a
      // "success" with zero rows affected (e.g. if a policy silently
      // blocks it), and the save would look like it worked but didn't.
      const { data: updated, error: updateError } = await supabase
        .from('profiles')
        .update({ display_name: trimmed })
        .eq('id', profile.id)
        .select('display_name')
        .single()

      if (updateError) {
        setError("Couldn't save: " + updateError.message)
        return
      }
      setEditing(false)
      onSaved(updated.display_name)
    } catch (err) {
      setError('Something went wrong: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div className="profile-edit" style={{ maxWidth: 320, margin: '0 auto', textAlign: 'left' }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#3A2E26' }}>Display name</label>
        <input
          type="text" maxLength={40} value={displayName} onChange={(e) => setDisplayName(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', border: '2px solid #E3D6C6', borderRadius: 10, fontSize: 14, marginBottom: 12, outline: 'none' }}
        />
        {error && <div style={{ fontSize: 13, color: '#C0392B', marginBottom: 8 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={save} disabled={saving} className="btn" style={{ flex: 1, background: '#D9784F', color: '#fff', padding: 10, fontSize: 14 }}>{saving ? label : 'Save'}</button>
          <button onClick={() => { setEditing(false); setError('') }} className="btn" style={{ flex: 1, background: '#FBF3E9', color: '#3A2E26', padding: 10, fontSize: 14 }}>Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ position: 'relative', width: 84, height: 84, margin: '0 auto 16px' }}>
        <Avatar url={profile.avatar_url} name={profile.display_name || profile.username} size={84} color="#D9784F" />
        {isMe && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              title="Change profile picture"
              aria-label="Change profile picture"
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: '#D9784F',
                border: '3px solid #fff',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: uploadingAvatar ? 'default' : 'pointer',
              }}
            >
              {uploadingAvatar ? (
                <span style={{ fontSize: 10 }}>…</span>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              )}
            </button>
          </>
        )}
      </div>
      {avatarError && <div style={{ fontSize: 13, color: '#C0392B', marginBottom: 10 }}>{avatarError}</div>}
      <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 22, color: '#3A2E26' }}>{profile.display_name || profile.username}</div>
      <div style={{ fontSize: 14, color: '#A6927C', marginTop: 4 }}>@{profile.username}</div>
      {profile.bio && <div style={{ fontSize: 15, color: '#3A2E26', marginTop: 14, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>{profile.bio}</div>}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 22, marginTop: 14, fontSize: 14, color: '#6B5E54' }}>
        <span>{postCount ?? 0} post{postCount === 1 ? '' : 's'}</span>
        {showCounts ? (
          <>
            <button onClick={onOpenFollowers} className="plain" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit', color: '#6B5E54' }}>
              <strong style={{ color: '#3A2E26' }}>{followerCount ?? 0}</strong> follower{followerCount === 1 ? '' : 's'}
            </button>
            <button onClick={onOpenFollowing} className="plain" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit', color: '#6B5E54' }}>
              <strong style={{ color: '#3A2E26' }}>{followingCount ?? 0}</strong> following
            </button>
          </>
        ) : (
          <>
            <span>{followerCount ?? 0} follower{followerCount === 1 ? '' : 's'}</span>
            <span>{followingCount ?? 0} following</span>
          </>
        )}
      </div>
      {!isMe && (
        <button
          disabled={followBusy}
          onClick={async () => { setFollowBusy(true); await onToggleFollow(); setFollowBusy(false) }}
          className="btn"
          style={{ padding: '10px 24px', fontSize: 14, marginTop: 14, ...(followState === 'none' ? { background: '#D9784F', color: '#fff' } : { background: '#FBF3E9', color: '#3A2E26' }) }}
        >
          {followState === 'accepted' ? 'Following' : followState === 'pending' ? 'Requested' : profile.is_private ? 'Request to follow' : 'Follow'}
        </button>
      )}
      {isMe && (
        <button onClick={() => setEditing(true)} className="btn" style={{ padding: '8px 20px', fontSize: 13, marginTop: 14, background: '#FBF3E9', color: '#3A2E26' }}>Edit display name</button>
      )}
    </div>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const { loading: authLoading, me } = useAuth()
  const [searchParams] = useSearchParams()
  const username = searchParams.get('u')

  // followState is one of 'none' | 'pending' | 'accepted' — only 'accepted'
  // is a real follow; 'pending' means a request is awaiting the other
  // person's approval (private accounts only).
  const [state, setState] = useState({ loading: true, profile: null, error: null, postCount: 0, followerCount: 0, followingCount: 0, followState: 'none' })
  const [posts, setPosts] = useState({ loading: true, items: [] })
  const [listModal, setListModal] = useState(null) // 'followers' | 'following' | null

  const load = useCallback(async () => {
    if (!me || !username) return
    setState((s) => ({ ...s, loading: true }))

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, bio, avatar_url, is_private')
      .eq('username', username)
      .maybeSingle()

    if (error || !profile) {
      setState({ loading: false, profile: null, error: `Couldn't find a profile for "${username}".`, postCount: 0, followerCount: 0, followingCount: 0, followState: 'none' })
      return
    }

    const isMe = profile.id === me.id

    const [{ count: postCount }, { count: followerCount }, { count: followingCount }] = await Promise.all([
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', profile.id),
      supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', profile.id).eq('status', 'accepted'),
      supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', profile.id).eq('status', 'accepted'),
    ])

    let followState = 'none'
    if (!isMe) {
      const { data: existingFollow } = await supabase
        .from('follows')
        .select('status')
        .eq('follower_id', me.id)
        .eq('following_id', profile.id)
        .maybeSingle()
      followState = existingFollow?.status || 'none'
    }

    setState({ loading: false, profile, error: null, postCount: postCount ?? 0, followerCount: followerCount ?? 0, followingCount: followingCount ?? 0, followState })

    setPosts({ loading: true, items: [] })
    const { data: profilePosts, error: postsError } = await supabase
      .from('posts')
      .select('id, author_id, caption, location, created_at, post_images(storage_path, position)')
      .eq('author_id', profile.id)
      .order('created_at', { ascending: false })

    if (postsError) {
      setPosts({ loading: false, items: [], error: postsError.message })
    } else {
      setPosts({ loading: false, items: profilePosts || [] })
    }
  }, [me, username])

  useEffect(() => {
    if (authLoading) return
    if (!username && me) {
      navigate(`/profile?u=${encodeURIComponent(me.username)}`, { replace: true })
      return
    }
    load()
  }, [authLoading, username, me, load, navigate])

  async function toggleFollow() {
    if (!state.profile) return
    const target = state.profile

    if (state.followState === 'accepted' || state.followState === 'pending') {
      // Unfollow, or cancel a pending request — either way it's just
      // removing the follows row. Also clear out the follow-request
      // notification it may have sent, so it doesn't linger as a stale
      // "respond" prompt in their bell.
      await supabase.from('follows').delete().eq('follower_id', me.id).eq('following_id', target.id)
      await supabase.from('notifications').delete().eq('actor_id', me.id).eq('recipient_id', target.id).eq('type', 'follow_request')
    } else if (target.is_private) {
      await supabase.from('follows').insert({ follower_id: me.id, following_id: target.id, status: 'pending' })
      await supabase.from('notifications').insert({ recipient_id: target.id, actor_id: me.id, type: 'follow_request' })
    } else {
      await supabase.from('follows').insert({ follower_id: me.id, following_id: target.id })
    }
    load()
  }

  async function deletePost(id) {
    if (!confirm('Delete this post?')) return
    const { error } = await supabase.from('posts').delete().eq('id', id)
    if (error) {
      alert("Couldn't delete: " + error.message)
      return
    }
    load()
  }

  if (authLoading || !me) return null

  const isMe = state.profile?.id === me.id
  const locked = !isMe && state.profile?.is_private && state.followState !== 'accepted'

  return (
    <div className="app-shell" style={{ display: 'flex', maxWidth: 1320, margin: '0 auto', minHeight: '100vh' }}>
      <NotificationBell me={me} />
      <MessageBubble me={me} />
      <AppSidebar active="profile" me={me} />

      <div className="main-col" style={{ flex: '1 1 auto', minWidth: 0, padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="profile-header card" style={{ padding: 32, textAlign: 'center' }}>
          {state.loading && <span style={{ color: '#A6927C' }}>Loading profile…</span>}
          {!state.loading && state.error && <span style={{ fontSize: 16, color: '#C0392B' }}>{state.error}</span>}
          {!state.loading && state.profile && (
            <ProfileHeader
              profile={state.profile}
              isMe={isMe}
              postCount={state.postCount}
              followerCount={state.followerCount}
              followingCount={state.followingCount}
              followState={state.followState}
              showCounts={!locked}
              onToggleFollow={toggleFollow}
              onSaved={() => load()}
              onOpenFollowers={() => setListModal('followers')}
              onOpenFollowing={() => setListModal('following')}
            />
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {locked ? (
            <div className="card" style={{ padding: 32, textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>🔒</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#3A2E26' }}>This account is private</div>
              <div style={{ fontSize: 14, color: '#6B5E54', marginTop: 6 }}>
                {state.followState === 'pending'
                  ? 'Your follow request is waiting for approval.'
                  : `Request to follow ${state.profile?.display_name || state.profile?.username} to see their posts.`}
              </div>
            </div>
          ) : (
            <>
              {posts.loading && <div className="card" style={{ padding: 32, textAlign: 'center', color: '#A6927C' }}>Loading posts…</div>}
              {!posts.loading && posts.error && <div className="card" style={{ padding: 24, color: '#C0392B' }}>Couldn't load posts: {posts.error}</div>}
              {!posts.loading && !posts.error && posts.items.length === 0 && (
                <div className="card" style={{ padding: 32, textAlign: 'center' }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#3A2E26' }}>
                    {isMe ? "You haven't" : `${state.profile?.display_name || state.profile?.username} hasn't`} posted yet
                  </div>
                </div>
              )}
              {!posts.loading && !posts.error && posts.items.map((p) => (
                <PostCard key={p.id} post={p} me={me} showAuthor={false} onDelete={isMe ? deletePost : undefined} />
              ))}
            </>
          )}
        </div>
      </div>

      {listModal && state.profile && (
        <FollowListModal profileId={state.profile.id} mode={listModal} onClose={() => setListModal(null)} />
      )}
    </div>
  )
}
