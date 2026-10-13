import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { useElapsedLabel } from '../hooks/useElapsedLabel.js'
import { supabase } from '../services/supabaseClient'
import { escapeLikePattern } from '../utils/search'
import AppSidebar from '../components/AppSidebar.jsx'
import PostCard from '../components/PostCard.jsx'
import NotificationBell from '../components/NotificationBell.jsx'

function PersonRow({ p }) {
  return (
    <Link to={`/profile?u=${encodeURIComponent(p.username)}`} className="card plain" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#6B9080', flex: '0 0 44px' }} />
      <div>
        <div style={{ fontWeight: 600, color: '#3A2E26' }}>{p.display_name || p.username}</div>
        <div style={{ fontSize: 13, color: '#A6927C' }}>@{p.username}</div>
      </div>
    </Link>
  )
}

export default function Search() {
  const navigate = useNavigate()
  const { loading: authLoading, me } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const [input, setInput] = useState(initialQuery)
  const [results, setResults] = useState({ searched: false, loadingPeople: false, loadingPosts: false, people: [], posts: [], peopleError: null, postsError: null })
  const peopleLabel = useElapsedLabel(results.loadingPeople, 'Searching people…')
  const postsLabel = useElapsedLabel(results.loadingPosts, 'Searching posts…')

  async function runSearch(term) {
    setResults((r) => ({ ...r, searched: true, loadingPeople: true, loadingPosts: true }))
    const pattern = `%${escapeLikePattern(term)}%`

    try {
      const [byUsername, byDisplayName] = await Promise.all([
        supabase.from('profiles').select('id, username, display_name').ilike('username', pattern).limit(20),
        supabase.from('profiles').select('id, username, display_name').ilike('display_name', pattern).limit(20),
      ])
      if (byUsername.error || byDisplayName.error) throw new Error((byUsername.error || byDisplayName.error).message)

      const peopleMap = new Map()
      for (const row of [...(byUsername.data || []), ...(byDisplayName.data || [])]) peopleMap.set(row.id, row)
      const people = [...peopleMap.values()].filter((p) => p.id !== me.id)
      setResults((r) => ({ ...r, loadingPeople: false, people, peopleError: null }))
    } catch (err) {
      setResults((r) => ({ ...r, loadingPeople: false, people: [], peopleError: err.message }))
    }

    try {
      const { data: posts, error } = await supabase
        .from('posts')
        .select('id, caption, created_at, author_id, author:profiles!posts_author_id_fkey(username, display_name), post_images(storage_path, position)')
        .ilike('caption', pattern)
        .order('created_at', { ascending: false })
        .limit(30)
      if (error) throw new Error(error.message)
      setResults((r) => ({ ...r, loadingPosts: false, posts: posts || [], postsError: null }))
    } catch (err) {
      setResults((r) => ({ ...r, loadingPosts: false, posts: [], postsError: err.message }))
    }
  }

  useEffect(() => {
    if (authLoading || !me) return
    const q = searchParams.get('q') || ''
    setInput(q)
    if (q) runSearch(q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, me, searchParams])

  function handleSubmit(e) {
    e.preventDefault()
    const q = input.trim()
    if (!q) return
    setSearchParams({ q })
  }

  if (authLoading || !me) return null

  const query = searchParams.get('q') || ''

  return (
    <div className="app-shell" style={{ display: 'flex', maxWidth: 1320, margin: '0 auto', minHeight: '100vh' }}>
      <NotificationBell me={me} />
      <AppSidebar active="explore" me={me} />

      <div className="main-col" style={{ flex: '1 1 auto', minWidth: 0, padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="card" style={{ padding: '18px 22px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              type="text" placeholder="Search people or posts…" autoComplete="off" value={input} onChange={(e) => setInput(e.target.value)}
              style={{ flex: 1, minWidth: 160, padding: '12px 16px', border: '2px solid #E3D6C6', borderRadius: 999, fontSize: 15, outline: 'none' }}
            />
            <button type="submit" className="btn" style={{ background: '#D9784F', color: '#fff', padding: '12px 24px', fontSize: 14 }}>Search</button>
          </form>
        </div>

        {query && <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 18, color: '#3A2E26' }}>Search results for "{query}"</div>}

        {!results.searched && (
          <div className="card" style={{ padding: 32, textAlign: 'center', color: '#A6927C' }}>
            Search for a username, or a word from someone's post.
          </div>
        )}

        {results.searched && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 16, color: '#3A2E26', marginBottom: 10 }}>People</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {results.loadingPeople && <div className="card" style={{ padding: '18px 20px', color: '#A6927C', fontSize: 14 }}>{peopleLabel}</div>}
                {!results.loadingPeople && results.peopleError && <div className="card" style={{ padding: '18px 20px', color: '#C0392B' }}>Couldn't search people: {results.peopleError}</div>}
                {!results.loadingPeople && !results.peopleError && results.people.length === 0 && <div className="card" style={{ padding: '18px 20px', color: '#A6927C', fontSize: 14 }}>No matching people found.</div>}
                {!results.loadingPeople && !results.peopleError && results.people.map((p) => <PersonRow key={p.id} p={p} />)}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 16, color: '#3A2E26', marginBottom: 10 }}>Posts</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {results.loadingPosts && <div className="card" style={{ padding: '18px 20px', color: '#A6927C', fontSize: 14 }}>{postsLabel}</div>}
                {!results.loadingPosts && results.postsError && <div className="card" style={{ padding: '18px 20px', color: '#C0392B' }}>Couldn't search posts: {results.postsError}</div>}
                {!results.loadingPosts && !results.postsError && results.posts.length === 0 && <div className="card" style={{ padding: '18px 20px', color: '#A6927C', fontSize: 14 }}>No matching posts found.</div>}
                {!results.loadingPosts && !results.postsError && results.posts.map((p) => <PostCard key={p.id} post={p} me={me} imageMaxHeight={360} />)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
