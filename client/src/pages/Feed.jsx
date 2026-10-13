import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useElapsedLabel } from '../hooks/useElapsedLabel.js'
import { supabase } from '../services/supabaseClient'
import { compressImage } from '../utils/image'

// Matches the post-images bucket's server-side file_size_limit (45MB) --
// checked client-side too so a too-large video fails fast with a clear
// message instead of a vague upload error after the wait.
const MAX_VIDEO_BYTES = 45 * 1024 * 1024
const VIDEO_EXT_BY_MIME = { 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm' }
import AppSidebar from '../components/AppSidebar.jsx'
import PostCard from '../components/PostCard.jsx'
import NotificationBell from '../components/NotificationBell.jsx'
import MessageBubble from '../components/MessageBubble.jsx'
import Avatar from '../components/Avatar.jsx'
import TipCard from '../components/TipCard.jsx'
import { PET_TIPS } from '../data/petTips.js'

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

    const isVideo = f.type.startsWith('video/')
    if (isVideo && f.size > MAX_VIDEO_BYTES) {
      setError(`That video is too large — please pick one under ${Math.floor(MAX_VIDEO_BYTES / (1024 * 1024))}MB.`)
      e.target.value = ''
      return
    }

    setFile(f)
    setError('')

    if (isVideo) {
      // Object URLs (not a data: URL) so a multi-MB video doesn't get
      // base64-encoded into a giant string just to preview it.
      setPreview({ kind: 'video', url: URL.createObjectURL(f) })
    } else {
      const reader = new FileReader()
      reader.onload = () => setPreview({ kind: 'image', url: reader.result })
      reader.readAsDataURL(f)
    }
  }

  function resetImage() {
    if (preview?.kind === 'video') URL.revokeObjectURL(preview.url)
    setFile(null)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function createPost() {
    const trimmedCaption = caption.trim()
    if (!file) {
      setError("Add a photo or video of your pet before posting — media-less posts aren't allowed.")
      return
    }

    const isVideo = file.type.startsWith('video/')

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

      let uploadBody, contentType, storagePath
      if (isVideo) {
        uploadBody = file
        contentType = file.type
        const ext = VIDEO_EXT_BY_MIME[file.type] || 'mp4'
        storagePath = `${me.id}/${post.id}-${Date.now()}.${ext}`
      } else {
        uploadBody = await compressImage(file)
        contentType = 'image/jpeg'
        storagePath = `${me.id}/${post.id}-${Date.now()}.jpg`
      }

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(storagePath, uploadBody, { contentType })

      if (uploadError) {
        await supabase.from('posts').delete().eq('id', post.id)
        setError(`Couldn't upload the ${isVideo ? 'video' : 'photo'}: ` + uploadError.message)
        return
      }

      const { error: imageError } = await supabase
        .from('post_images')
        .insert({ post_id: post.id, storage_path: storagePath, position: 0, media_type: isVideo ? 'video' : 'image' })

      if (imageError) {
        await supabase.from('posts').delete().eq('id', post.id)
        setError(`Couldn't attach the ${isVideo ? 'video' : 'photo'}: ` + imageError.message)
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
        <Avatar url={me?.avatar_url} name={me?.display_name || me?.username} size={44} />
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
          {preview.kind === 'video' ? (
            <video src={preview.url} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 12, background: '#000' }} muted />
          ) : (
            <img src={preview.url} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 12 }} />
          )}
          <button onClick={resetImage} className="btn" style={{ background: '#FBF3E9', color: '#3A2E26', padding: '7px 14px', fontSize: 13 }}>
            Remove {preview.kind === 'video' ? 'video' : 'photo'}
          </button>
        </div>
      )}

      <div className="composer-indent" style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 58, flexWrap: 'wrap' }}>
        <label className="btn" style={{ background: '#FBF3E9', color: '#D9784F', padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>
          📷 Add a photo or video
          <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileChange} style={{ display: 'none' }} />
        </label>
        <span style={{ fontSize: 12, color: '#A6927C' }}>Videos up to 45MB</span>
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
      .select('id, username, display_name, avatar_url, is_private')
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
          <Avatar url={p.avatar_url} name={p.display_name || p.username} size={36} />
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
        .select('id, caption, location, created_at, author_id, author:profiles!posts_author_id_fkey(username, display_name, avatar_url), post_images(storage_path, position, media_type)')
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
      <MessageBubble me={me} />
      <AppSidebar active="home" me={me} />

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
          {!feed.loading && !feed.error && feed.posts.map((p, i) => (
            <Fragment key={p.id}>
              <PostCard post={p} me={me} onDelete={p.author_id === me.id ? deletePost : undefined} />
              {/* A pet tip after every 5th post — cycles through the list rather
                  than repeating, so a long scroll doesn't see the same tip twice
                  until it's gone through all of them. */}
              {(i + 1) % 5 === 0 && (
                <TipCard tip={PET_TIPS[Math.floor(i / 5) % PET_TIPS.length]} />
              )}
            </Fragment>
          ))}
        </div>
      </div>

      <div className="right-sidebar" style={{ width: 280, flex: '0 0 280px', padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Link to={`/profile?u=${encodeURIComponent(me.username)}`} className="card plain my-profile-card" style={{ padding: 20, textAlign: 'center', display: 'block' }}>
          <Avatar url={me.avatar_url} name={me.display_name || me.username} size={64} color="#D9784F" style={{ margin: '0 auto 12px' }} />
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
