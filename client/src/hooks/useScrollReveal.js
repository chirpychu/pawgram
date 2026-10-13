import { useEffect, useRef, useState } from 'react'

/**
 * Fades/slides an element in the first time it enters the viewport, and
 * back out once scrolled past (either direction) — re-playing the
 * entrance each time it re-enters. Respects prefers-reduced-motion by
 * skipping the observer and just staying visible.
 *
 * Usage: const [ref, visible] = useScrollReveal();
 *        <div ref={ref} className={`reveal ${visible ? 'is-visible' : ''}`}>
 */
export function useScrollReveal() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduceMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduceMotion || !('IntersectionObserver' in window)) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return [ref, visible]
}
