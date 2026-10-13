/**
 * A "Pet Tip" card inserted into the feed between posts — visually
 * distinct from a PostCard (no author header, tinted background) so it
 * reads as promoted content rather than a user's post.
 */
export default function TipCard({ tip }) {
  return (
    <div className="card" style={{ padding: '20px 22px', background: '#FBF3E9', border: '1px solid #F2E3CE', display: 'flex', gap: 16 }}>
      <div style={{ fontSize: 28, lineHeight: 1 }}>{tip.icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: '#D9784F' }}>Pet tip</span>
        </div>
        <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 16, color: '#3A2E26', marginBottom: 6 }}>{tip.title}</div>
        <div style={{ fontSize: 14, color: '#6B5E54', lineHeight: 1.55 }}>{tip.body}</div>
        <div style={{ fontSize: 12, color: '#A6927C', marginTop: 8 }}>Source: {tip.source}</div>
      </div>
    </div>
  )
}
