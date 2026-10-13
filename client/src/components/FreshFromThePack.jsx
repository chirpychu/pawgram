import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, getPostImageUrl } from '../services/supabaseClient'
import { useScrollReveal } from '../hooks/useScrollReveal.js'

function PostTile({ post }) {
  const images = (post.post_images || []).slice().sort((a, b) => a.position - b.position)
  const url = getPostImageUrl(images[0].storage_path)
  const name = post.author?.display_name || post.author?.username || 'A Pawgram pet'
  const profileUrl = post.author?.username ? `/profile?u=${encodeURIComponent(post.author.username)}` : '/'
  return (
    <Link to={profileUrl} style={{ position: 'relative', display: 'block', background: '#EFE3D2', borderRadius: 16, height: 200, overflow: 'hidden', textDecoration: 'none' }}>
      <img src={url} alt={`A pet shared by ${name}`} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '10px 12px', background: 'linear-gradient(0deg,rgba(40,28,20,.65),transparent)', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: "'Figtree',sans-serif" }}>{name}</div>
    </Link>
  )
}

function CtaTile() {
  return (
    <div style={{ background: '#D9784F', borderRadius: 16, height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', textAlign: 'center', padding: 16 }}>
      <div style={{ fontSize: 30, marginBottom: 8 }}>🐾</div>
      <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 16, marginBottom: 12 }}>Add your pet to the pack</div>
      <Link to="/signup" className="btn" style={{ background: '#fff', color: '#D9784F', padding: '10px 20px', fontSize: 14 }}>Join free</Link>
    </div>
  )
}

export default function FreshFromThePack() {
  const [state, setState] = useState({ loading: true, posts: [], error: null })
  const [ref, visible] = useScrollReveal()

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const { data: posts, error } = await supabase
          .from('posts')
          .select('id, caption, created_at, author:profiles!posts_author_id_fkey!inner(username, display_name, is_private), post_images(storage_path, position)')
          .eq('author.is_private', false)
          .order('created_at', { ascending: false })
          .limit(8)

        if (error) throw error
        const withPhotos = (posts || []).filter((p) => p.post_images?.length > 0).slice(0, 3)
        if (!cancelled) setState({ loading: false, posts: withPhotos, error: null })
      } catch (err) {
        console.error('Could not load fresh-from-the-pack posts:', err.message)
        if (!cancelled) setState({ loading: false, posts: [], error: err })
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <div ref={ref} className={`feed-preview-row reveal ${visible ? 'is-visible' : ''}`} style={{ padding: '16px 48px 72px' }}>
      <h2 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 28, color: '#3A2E26', margin: '0 0 24px' }}>Fresh from the pack</h2>
      <div className="fresh-pack-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 20 }}>
        {state.loading && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 30, color: '#A6927C', fontSize: 14 }}>Loading recent posts…</div>
        )}
        {!state.loading && state.error && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 30, color: '#A6927C', fontSize: 14 }}>Couldn't load recent posts right now.</div>
        )}
        {!state.loading && !state.error && state.posts.length === 0 && (
          <div style={{ gridColumn: '1/-1', background: '#fff', borderRadius: 16, padding: '40px 24px', textAlign: 'center', color: '#6B5E54' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🐾</div>
            <p style={{ margin: '0 0 18px', fontSize: 15 }}>No public posts yet — be the first to share your pet's moment!</p>
            <Link to="/signup" className="btn" style={{ background: '#D9784F', color: '#fff', padding: '12px 26px', fontSize: 15 }}>Join free</Link>
          </div>
        )}
        {!state.loading && !state.error && state.posts.length > 0 && (
          <>
            {state.posts.map((p) => <PostTile key={p.id} post={p} />)}
            <CtaTile />
          </>
        )}
      </div>
    </div>
  )
}
