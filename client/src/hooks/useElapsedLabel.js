import { useEffect, useRef, useState } from 'react'

/**
 * Returns a label that appends an elapsed-seconds counter once `active`
 * has been true for over a second, so a slow request (e.g. a cold
 * Supabase database waking up) doesn't look frozen. Mirrors the old
 * startProgress()/startElapsedPlaceholder() helpers.
 */
export function useElapsedLabel(active, label) {
  const [text, setText] = useState(label)
  const startRef = useRef(null)

  useEffect(() => {
    if (!active) {
      setText(label)
      return
    }
    startRef.current = Date.now()
    setText(label)
    const id = setInterval(() => {
      const secs = Math.floor((Date.now() - startRef.current) / 1000)
      setText(secs > 0 ? `${label} (${secs}s)` : label)
    }, 500)
    return () => clearInterval(id)
  }, [active, label])

  return text
}
