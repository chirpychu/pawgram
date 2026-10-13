import { useEffect, useRef, useState } from 'react'
import { hasTicketmasterKey, searchPetEvents } from '../services/ticketmaster'
import { useScrollReveal } from '../hooks/useScrollReveal.js'

function EventCard({ ev }) {
  const venue = ev._embedded?.venues?.[0]
  const city = venue?.city?.name || ''
  const country = venue?.country?.name || venue?.country?.countryCode || ''
  const location = [city, country].filter(Boolean).join(', ') || 'Location TBA'
  const dateStr = ev.dates?.start?.localDate
    ? new Date(ev.dates.start.localDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Date TBA'
  const image = (ev.images || []).find((img) => img.ratio === '16_9' && img.width >= 500) || ev.images?.[0]

  return (
    <a href={ev.url || '#'} target="_blank" rel="noopener noreferrer" style={{ display: 'block', background: '#fff', borderRadius: 16, overflow: 'hidden', textDecoration: 'none', color: '#3A2E26', boxShadow: '0 2px 10px rgba(0,0,0,.04)' }}>
      <div style={{ height: 150, background: '#EFE3D2' }}>
        {image && <img src={image.url} alt={ev.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#D9784F', marginBottom: 6 }}>{dateStr}</div>
        <div style={{ fontFamily: "'Fredoka',sans-serif", fontWeight: 600, fontSize: 16, marginBottom: 6 }}>{ev.name}</div>
        <div style={{ fontSize: 13, color: '#6B5E54' }}>📍 {location}</div>
      </div>
    </a>
  )
}

export default function PlaydatesSearch() {
  const [city, setCity] = useState('')
  const [countryCode, setCountryCode] = useState('')
  const [state, setState] = useState({ loading: true, events: [], error: null, searched: false })
  const resultsRef = useRef(null)
  const [sectionRef, sectionVisible] = useScrollReveal()

  async function runSearch(c, cc, size = 12) {
    if (!hasTicketmasterKey()) {
      setState({ loading: false, events: [], error: 'not-configured', searched: Boolean(c || cc) })
      return
    }
    setState((s) => ({ ...s, loading: true, searched: Boolean(c || cc) }))
    try {
      const events = await searchPetEvents({ city: c, countryCode: cc, size })
      setState({ loading: false, events, error: null, searched: Boolean(c || cc) })
    } catch (err) {
      console.error('Could not load playdate events:', err.message)
      setState({ loading: false, events: [], error: 'fetch-failed', searched: Boolean(c || cc) })
    }
  }

  useEffect(() => {
    runSearch('', '', 4)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    await runSearch(city.trim(), countryCode.trim().toUpperCase())
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div id="playdates-section" ref={sectionRef} className={`playdates-row reveal ${sectionVisible ? 'is-visible' : ''}`} style={{ padding: '16px 48px 72px', scrollMarginTop: 24 }}>
      <h2 style={{ fontFamily: "'Fredoka',sans-serif", fontSize: 28, color: '#3A2E26', margin: '0 0 8px' }}>Find a playdate near you</h2>
      <p style={{ margin: '0 0 24px', color: '#6B5E54', fontSize: 15, maxWidth: 560 }}>Search pet-friendly events, meetups and expos happening around the world, powered by Ticketmaster.</p>

      <form className="playdates-form" onSubmit={handleSubmit} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
        <input
          type="text" placeholder="City (e.g. Singapore)" autoComplete="off" value={city} onChange={(e) => setCity(e.target.value)}
          style={{ flex: '1 1 220px', padding: '13px 16px', border: '2px solid #E3D6C6', borderRadius: 12, fontSize: 15, outline: 'none' }}
        />
        <input
          type="text" placeholder="Country code (e.g. SG, US, GB)" maxLength={2} autoComplete="off" value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
          style={{ flex: '0 1 220px', padding: '13px 16px', border: '2px solid #E3D6C6', borderRadius: 12, fontSize: 15, outline: 'none', textTransform: 'uppercase' }}
        />
        <button type="submit" className="btn" style={{ background: '#D9784F', color: '#fff', padding: '14px 30px', fontSize: 16 }}>Search events</button>
      </form>

      <div ref={resultsRef} className="playdates-results" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20, scrollMarginTop: 24 }}>
        {state.loading && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 30, color: '#A6927C', fontSize: 14 }}>
            {state.searched ? 'Searching for events…' : 'Loading events…'}
          </div>
        )}
        {!state.loading && state.error === 'not-configured' && (
          <div style={{ gridColumn: '1/-1', background: '#fff', borderRadius: 16, padding: '32px 24px', textAlign: 'center', color: '#6B5E54' }}>
            <p style={{ margin: 0, fontSize: 15 }}>Event search isn't set up yet — add a Ticketmaster API key to enable this.</p>
          </div>
        )}
        {!state.loading && state.error === 'fetch-failed' && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 30, color: '#A6927C', fontSize: 14 }}>Couldn't load events right now. Try again in a moment.</div>
        )}
        {!state.loading && !state.error && state.events.length === 0 && (
          <div style={{ gridColumn: '1/-1', background: '#fff', borderRadius: 16, padding: '32px 24px', textAlign: 'center', color: '#6B5E54' }}>
            <div style={{ fontSize: 30, marginBottom: 8 }}>🐾</div>
            <p style={{ margin: 0, fontSize: 15 }}>{state.searched ? 'No pet events found there right now — try a nearby city or a different country code.' : 'No pet events to show right now — check back soon.'}</p>
          </div>
        )}
        {!state.loading && !state.error && state.events.map((ev) => <EventCard key={ev.id} ev={ev} />)}
      </div>
    </div>
  )
}
