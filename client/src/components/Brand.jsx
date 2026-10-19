/**
 * The "🐾 Pawgram" wordmark, standardized so every page (landing nav,
 * the logged-in sidebar, the auth card, the slide-in auth drawer) shows
 * the exact same icon and size instead of each place picking its own.
 * Renders inline content only (a <span>) so callers can wrap it in
 * whatever element fits their layout (a <Link>, a plain <div>, etc.)
 * and add their own margin/padding around it.
 */
export default function Brand({ style } = {}) {
  return (
    <span
      className="brand-mark"
      style={{
        fontFamily: "'Fredoka',sans-serif",
        fontWeight: 700,
        fontSize: 24,
        color: '#3A2E26',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        ...style,
      }}
    >
      <span aria-hidden="true">🐾</span>
      <span>Pawgram</span>
    </span>
  )
}
