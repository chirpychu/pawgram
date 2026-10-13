import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useElapsedLabel } from '../hooks/useElapsedLabel.js'
import { supabase } from '../services/supabaseClient'
import { compressImage } from '../utils/image'
import AppSidebar from '../components/AppSidebar.jsx'
import PostCard from '../components/PostCard.jsx'
import NotificationBell from '../components/NotificationBell.jsx'

function Composer({ me, onPosted }) {
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [posting, setPosting] = useState(false)
  const fileInputRef = useRef(null)
  const label = useElapsedLabel(posting, 'Posting…')

  function handleFileChange(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setError('')
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result)
    reader.readAsDataURL(f)
  }

  function resetImage() {
    setFile(null)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function createPost() {
    const trimmedCaption = caption.trim()
    if (!file) {
      setError("Add a photo of your pet before posting — photo-less posts aren't allowed.")
      return
    }

    setError('')
    setPosting(true)
    try {
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({ author_id: me.id, caption: trimmedCaption || null })
        .select('id')
        .single()

      if (postError) {
        setError("Couldn't post: " + postError.message)
        return
      }

      const compressed = await compressImage(file)
      const storagePath = `${me.id}/${post.id}-${Date.now()}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(storagePath, compressed, { contentType: 'image/jpeg' })

      if (uploadError) {
        await supabase.from('posts').delete().eq('id', post.id)
        setError("Couldn't upload the photo: " + uploadError.message)
        return
      }

      const { error: imageError } = await supabase
        .from('post_images')
        .insert({ post_id: post.id, storage_path: storagePath, position: 0 })

      if (imageError) {
        await supabase.from('posts').delete().eq('id', post.id)
        setError("Couldn't attach the photo: " + imageError.message)
        return
      }

      setCaption('')
      resetImage()
      onPosted()
    } catch (err) {
      setError('Something went wrong: ' + err.message)
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="card" style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#6B9080', flex: '0 0 44px' }} />
        <input
          id="composer-input"
          type="text"
          placeholder={me ? `What's on your mind, ${me.username}?` : 'Share something…'}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') createPost() }}
          style={{ flex: 1, minWidth: 0, background: '#FBF3E9', border: 'none', borderRadius: 999, padding: '12px 18px', color: '#3A2E26', fontSize: 15, outline: 'none' }}
        />
        <button onClick={createPost} disabled={posting} className="btn" style={{ background: '#D9784F', color: '#fff', padding: '10px 20px', fontSize: 14 }}>
          {posting ? label : 'Post'}
        </button>
      </div>

      {preview && (
        <div className="composer-indent" style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 58 }}>
          <img src={preview} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 12 }} />
          <button onClick={resetImage} className="btn" style={{ background: '#FBF3E9', color: '#3A2E26', padding: '7px 14px', fontSize: 13 }}>Remove photo</button>
        </div>
      )}

      <div className="composer-indent" style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 58, flexWrap: 'wrap' }}>
        <label className="btn" style={{ background: '#FBF3E9', color: '#D9784F', padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>
          📷 Add a photo of your pet
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
        </label>
        {error && <div style={{ fontSize: 13, color: '#C0392B' }}>{error}</div>}
      </div>
    </div>
  )
}

function Suggestions({ me, onFollowed }) {
  const [state, setState] = useState({ loading: true, people: [] })

  const load = useCallback(async () => {
    const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', me.id)
    const followingIds = new Set((follows || []).map((f) => f.following_id))

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, is_private')
      .neq('id', me.id)
      .limit(25)

    if (error) {
      setState({ loading: false, people: [], error: error.message })
      return
    }

    // Anyone already followed or already requested isn't a fresh suggestion.
    const suggestions = profiles.filter((p) => !followingIds.has(p.id)).slice(0, 5).map((p) => ({ ...p, status: 'none' }))
    setState({ loading: false, people: suggestions })
  }, [me.id])

  useEffect(() => { load() }, [load])

  async function follow(p) {
    if (p.is_private) {
      const { error } = await supabase.from('follows').insert({ follower_id: me.id, following_id: p.id, status: 'pending' })
      if (error) return
      await supabase.from('notifications').insert({ recipient_id: p.id, actor_id: me.id, type: 'follow_request' })
      setState((s) => ({ ...s, people: s.people.map((x) => (x.id === p.id ? { ...x, status: 'pending' } : x)) }))
    } else {
      const { error } = await supabase.from('follows').insert({ follower_id: me.id, following_id: p.id })
      if (error) return
      setState((s) => ({ ...s, people: s.people.map((x) => (x.id === p.id ? { ...x, status: 'accepted' } : x)) }))
    }
    onFollowed()
  }

  if (state.loading) return <div style={{ fontSize: 13, color: '#A6927C' }}>Loading…</div>
  if (state.error) return <div style={{ fontSize: 13, color: '#C0392B' }}>{state.error}</div>
  if (state.people.length === 0) return <div style={{ fontSize: 13, color: '#A6927C' }}>No one new to suggest yet.</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {state.people.map((p) => (
        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#6B9080', flex: '0 0 36px' }} />
          <Link to={`/profile?u=${encodeURIComponent(p.username)}`} style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#3A2E26' }}>{p.display_name || p.username}</Link>
          <button
            onClick={() => follow(p)}
            disabled={p.status !== 'none'}
            className="btn"
            style={{ background: '#FBF3E9', color: '#D9784F', padding: '6px 14px', fontSize: 13 }}
          >{p.status === 'accepted' ? 'Following' : p.status === 'pending' ? 'Requested' : p.is_private ? 'Request' : 'Follow'}</button>
        </div>
      ))}
    </div>
  )
}

export default function Feed() {
  const { loading, me } = useAuth()
  const [feed, setFeed] = useState({ loading: true, posts: [], error: null })
  const label = useElapsedLabel(feed.loading, 'Loading your feed…')
  const [suggestionsKey, setSuggestionsKey] = useState(0)

  const loadFeed = useCallback(async () => {
    if (!me) return
    setFeed((s) => ({ ...s, loading: true }))
    try {
      const { data: follows, error: followsError } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', me.id)
        .eq('status', 'accepted')

      if (followsError) {
        setFeed({ loading: false, posts: [], error: followsError.message })
        return
      }

      const authorIds = [me.id, ...follows.map((f) => f.following_id)]

      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('id, caption, location, created_at, author_id, author:profiles!posts_author_id_fkey(username, display_name), post_images(storage_path, position)')
        .in('author_id', authorIds)
        .order('created_at', { ascending: false })
        .limit(30)

      if (postsError) {
        setFeed({ loading: false, posts: [], error: postsError.message })
        return
      }

      setFeed({ loading: false, posts: posts || [], error: null })
    } catch (err) {
      setFeed({ loading: false, posts: [], error: err.message })
    }
  }, [me])

  useEffect(() => { loadFeed() }, [loadFeed])

  async function deletePost(id) {
    if (!confirm('Delete this post?')) return
    const { error } = await supabase.from('posts').delete().eq('id', id)
    if (error) {
      alert("Couldn't delete: " + error.message)
      return
    }
    loadFeed()
  }

  if (loading || !me) return null

  return (
    <div className="app-shell" style={{ display: 'flex', maxWidth: 1320, margin: '0 auto', minHeight: '100vh' }}>
      <NotificationBell me={me} />
      <AppSidebar
        active="home"
        me={me}
        extra={
          <button
            className="btn sidebar-new-post"
            style={{ marginTop: 20, background: '#D9784F', color: '#fff', padding: 14, fontSize: 15 }}
            onClick={() => document.getElementById('composer-input')?.focus()}
          >
            <span className="nav-label">+ New post</span>
          </button>
        }
      />

      <div className="center-col" style={{ flex: '1 1 auto', minWidth: 0, padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Composer me={me} onPosted={loadFeed} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {feed.loading && <div className="card" style={{ padding: 32, textAlign: 'center', color: '#A6927C' }}>{label}</div>}
          {!feed.loading && feed.error && <div className="card" style={{ padding: 24, color: '#C0392B' }}>Couldn't load the feed: {feed.error}</div>}
          {!feed.loading && !feed.error && feed.posts.length === 0 && (
            <div className="card" style={{ padding: 32, textAlign: 'center' }}>
              <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 8, color: '#3A2E26' }}>No posts yet</div>
              <div style={{ fontSize: 14, color: '#6B5E54' }}>Follow a few pet parents on the right to see their posts here — or share your own above.</div>
            </div>
          )}
          {!feed.loading && !feed.error && feed.posts.map((p) => (
            <PostCard key={p.id} post={p} me={me} onDelete={p.author_id === me.id ? deletePost : undefined} />
          ))}
        </div>
      </div>

      <div className="right-sidebar" style={{ width: 280, flex: '0 0 280px', padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Link to={`/profile?u=${encodeURIComponent(me.username)}`} className="card plain my-profile-card" style={{ padding: 20, textAlign: 'center', display: 'block' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#D9784F', margin: '0 auto 12px' }} />
          <div style={{ fontWeight: 600, fontSize: 16 }}>{me.display_name || me.username}</div>
          <div style={{ fontSize: 13, color: '#A6927C' }}>View your profile</div>
        </Link>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 16, marginBottom: 14 }}>Upcoming playdates</div>
          <div style={{ fontSize: 13, color: '#A6927C' }}>No playdates yet — this is coming soon.</div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 16, marginBottom: 14 }}>Suggested for you</div>
          <Suggestions key={suggestionsKey} me={me} onFollowed={() => { loadFeed(); setSuggestionsKey((k) => k + 1) }} />
        </div>
      </div>
    </div>
  )
}
