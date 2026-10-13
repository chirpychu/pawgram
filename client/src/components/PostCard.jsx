import { Link } from 'react-router-dom'
import { getPostImageUrl } from '../services/supabaseClient'
import { timeAgo } from '../utils/timeAgo'

/**
 * Renders one post. `showAuthor` controls whether the author's name/avatar
 * header is shown (feed/search show it; a profile's own post list doesn't
 * need it since you're already looking at that person's page).
 * `onDelete`, when provided, shows a delete (✕) button for posts you own.
 */
export default function PostCard({ post, showAuthor = true, onDelete, imageMaxHeight = 520 }) {
  const images = (post.post_images || []).slice().sort((a, b) => a.position - b.position)
  const image = images[0]
  const name = post.author?.display_name || post.author?.username || 'Someone'
  const uname = post.author?.username || ''
  const meta = timeAgo(post.created_at) + (post.location ? ' · ' + post.location : '')

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {showAuthor ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 22px' }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#D9784F', flex: '0 0 42px' }} />
          <div>
            <Link to={`/profile?u=${encodeURIComponent(uname)}`} style={{ fontWeight: 600, fontSize: 15, color: '#3A2E26' }}>{name}</Link>
            <div style={{ fontSize: 13, color: '#A6927C' }}>{meta}</div>
          </div>
          {onDelete && (
            <button
              onClick={() => onDelete(post.id)}
              title="Delete post"
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#A6927C', fontSize: 13, padding: 6 }}
            >✕</button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 22px' }}>
          <div style={{ fontSize: 13, color: '#A6927C' }}>{meta}</div>
          {onDelete && (
            <button
              onClick={() => onDelete(post.id)}
              title="Delete post"
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#A6927C', fontSize: 13, padding: 6 }}
            >✕</button>
          )}
        </div>
      )}

      {image && (
        <img
          src={getPostImageUrl(image.storage_path)}
          loading="lazy"
          decoding="async"
          alt=""
          style={{ width: '100%', maxHeight: imageMaxHeight, objectFit: 'cover', display: 'block', background: '#EFE3D2' }}
        />
      )}

      {post.caption && (
        <div style={{ padding: '16px 22px', fontSize: 15, color: '#3A2E26', whiteSpace: 'pre-wrap' }}>{post.caption}</div>
      )}
    </div>
  )
}
