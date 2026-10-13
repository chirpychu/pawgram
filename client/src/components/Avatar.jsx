import { getAvatarUrl } from '../services/supabaseClient'

/**
 * Renders a profile picture if `url` (the profiles.avatar_url storage
 * path) is set, otherwise falls back to the same colored-circle-with-
 * initial placeholder used everywhere before avatars existed.
 */
export default function Avatar({ url, name, size = 42, color = '#6B9080', style }) {
  const src = getAvatarUrl(url)
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?'

  if (src) {
    return (
      <img
        src={src}
        alt=""
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flex: `0 0 ${size}px`,
          background: '#EFE3D2',
          ...style,
        }}
      />
    )
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        flex: `0 0 ${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 700,
        fontSize: Math.round(size * 0.4),
        fontFamily: "'Fredoka',sans-serif",
        ...style,
      }}
    >
      {initial}
    </div>
  )
}
