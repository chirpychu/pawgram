import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useElapsedLabel } from '../hooks/useElapsedLabel.js'
import { supabase } from '../services/supabaseClient'
import AppSidebar from '../components/AppSidebar.jsx'
import PostCard from '../components/PostCard.jsx'

function ProfileHeader({ profile, isMe, postCount, isFollowing, onToggleFollow, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState(profile.display_name || '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const label = useElapsedLabel(saving, 'Saving…')
  const [followBusy, setFollowBusy] = useState(false)

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
      <div style={{ width: 84, height: 84, borderRadius: '50%', background: '#D9784F', margin: '0 auto 16px' }} />
      <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 700, fontSize: 22, color: '#3A2E26' }}>{profile.display_name || profile.username}</div>
      <div style={{ fontSize: 14, color: '#A6927C', marginTop: 4 }}>@{profile.username}</div>
      {profile.bio && <div style={{ fontSize: 15, color: '#3A2E26', marginTop: 14, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>{profile.bio}</div>}
      <div style={{ fontSize: 14, color: '#6B5E54', marginTop: 14 }}>{postCount ?? 0} post{postCount === 1 ? '' : 's'}</div>
      {!isMe && (
        <button
          disabled={followBusy}
          onClick={async () => { setFollowBusy(true); await onToggleFollow(); setFollowBusy(false) }}
          className="btn"
          style={{ padding: '10px 24px', fontSize: 14, marginTop: 14, ...(isFollowing ? { background: '#FBF3E9', color: '#3A2E26' } : { background: '#D9784F', color: '#fff' }) }}
        >{isFollowing ? 'Following' : 'Follow'}</button>
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

  const [state, setState] = useState({ loading: true, profile: null, error: null, postCount: 0, isFollowing: false })
  const [posts, setPosts] = useState({ loading: true, items: [] })

  const load = useCallback(async () => {
    if (!me || !username) return
    setState((s) => ({ ...s, loading: true }))

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, bio, is_private')
      .eq('username', username)
      .maybeSingle()

    if (error || !profile) {
      setState({ loading: false, profile: null, error: `Couldn't find a profile for "${username}".`, postCount: 0, isFollowing: false })
      return
    }

    const isMe = profile.id === me.id

    const { count: postCount } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', profile.id)

    let isFollowing = false
    if (!isMe) {
      const { data: existingFollow } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', me.id)
        .eq('following_id', profile.id)
        .maybeSingle()
      isFollowing = Boolean(existingFollow)
    }

    setState({ loading: false, profile, error: null, postCount: postCount ?? 0, isFollowing })

    setPosts({ loading: true, items: [] })
    const { data: profilePosts, error: postsError } = await supabase
      .from('posts')
      .select('id, caption, location, created_at, post_images(storage_path, position)')
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
    if (state.isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', me.id).eq('following_id', state.profile.id)
    } else {
      await supabase.from('follows').insert({ follower_id: me.id, following_id: state.profile.id })
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

  return (
    <div className="app-shell" style={{ display: 'flex', maxWidth: 1320, margin: '0 auto', minHeight: '100vh' }}>
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
              isFollowing={state.isFollowing}
              onToggleFollow={toggleFollow}
              onSaved={() => load()}
            />
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
            <PostCard key={p.id} post={p} showAuthor={false} onDelete={isMe ? deletePost : undefined} />
          ))}
        </div>
      </div>
    </div>
  )
}
