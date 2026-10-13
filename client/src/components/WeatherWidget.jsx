import { useEffect, useState } from 'react'

/**
 * Small sidebar widget: current local weather (via the browser's own
 * geolocation + the free, keyless Open-Meteo API — no backend, no cost)
 * plus a one-line "is it a good time to walk your pet" advisory based on
 * temperature, rain chance in the next few hours, and storms.
 *
 * Fails quietly: if location is denied/unsupported or the fetch errors,
 * it shows a small "enable location" prompt (retryable) rather than
 * breaking the sidebar layout.
 */
const CACHE_KEY = 'pawgram_weather_cache_v1'
const CACHE_MS = 15 * 60 * 1000 // 15 minutes — avoids re-prompting/re-fetching on every page nav

const STORM_CODES = new Set([95, 96, 99])
const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99])

function describe(code) {
  if (STORM_CODES.has(code)) return { icon: '⛈️', label: 'Thunderstorms' }
  if (RAIN_CODES.has(code)) return { icon: '🌧️', label: 'Rainy' }
  if (code === 45 || code === 48) return { icon: '🌫️', label: 'Foggy' }
  if (code === 0) return { icon: '☀️', label: 'Clear' }
  if (code >= 71 && code <= 86) return { icon: '❄️', label: 'Snowy' }
  if (code >= 1 && code <= 3) return { icon: '⛅', label: 'Partly cloudy' }
  return { icon: '☁️', label: 'Cloudy' }
}

function advisory({ code, temp, rainChance }) {
  if (STORM_CODES.has(code)) return { icon: '⛈️', text: 'Storms nearby — keep walks indoors for now.' }
  if (RAIN_CODES.has(code) || rainChance >= 60) return { icon: '🌧️', text: 'Rain likely soon — maybe skip the walk.' }
  if (temp >= 32) return { icon: '🌡️', text: "It's hot out — stick to early morning or evening walks." }
  if (temp <= 5) return { icon: '🧊', text: 'Very cold — short walks, watch for paw sensitivity.' }
  return { icon: '✅', text: 'Good conditions for a walk!' }
}

export default function WeatherWidget() {
  const [state, setState] = useState({ status: 'loading' })

  function requestLocation() {
    setState({ status: 'loading' })

    if (!navigator.geolocation) {
      setState({ status: 'unsupported' })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => loadWeather(pos.coords.latitude, pos.coords.longitude),
      () => setState({ status: 'denied' }),
      { timeout: 8000 }
    )
  }

  async function loadWeather(lat, lon) {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&hourly=precipitation_probability,weather_code&timezone=auto&forecast_days=1`
      const res = await fetch(url)
      if (!res.ok) throw new Error('weather fetch failed')
      const json = await res.json()
      const temp = Math.round(json.current.temperature_2m)
      const code = json.current.weather_code
      const nowIndex = json.hourly.time.indexOf(json.current.time)
      const startIdx = nowIndex >= 0 ? nowIndex : 0
      const nextProbs = json.hourly.precipitation_probability.slice(startIdx, startIdx + 3)
      const rainChance = nextProbs.length ? Math.max(...nextProbs) : 0
      const result = { temp, code, rainChance, fetchedAt: Date.now() }
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(result)) } catch { /* ignore */ }
      setState({ status: 'ready', ...result })
    } catch {
      setState({ status: 'error' })
    }
  }

  useEffect(() => {
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null')
      if (cached && Date.now() - cached.fetchedAt < CACHE_MS) {
        setState({ status: 'ready', ...cached })
        return
      }
    } catch { /* ignore, fall through to a fresh request */ }

    requestLocation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (state.status === 'loading') {
    return (
      <div style={wrapStyle}>
        <div style={{ fontSize: 12, color: '#A6927C' }}>Checking local weather…</div>
      </div>
    )
  }

  if (state.status === 'denied' || state.status === 'unsupported' || state.status === 'error') {
    return (
      <button
        onClick={requestLocation}
        style={{ ...wrapStyle, border: '1px dashed #D9C7A8', cursor: 'pointer', textAlign: 'left', width: '100%', font: 'inherit' }}
      >
        <div style={{ fontSize: 12, color: '#6B5E54' }}>📍 Enable location to see local weather &amp; walk conditions</div>
      </button>
    )
  }

  const { icon: condIcon, label } = describe(state.code)
  const adv = advisory(state)

  return (
    <div style={wrapStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 22 }}>{condIcon}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#3A2E26' }}>{state.temp}°C</div>
          <div style={{ fontSize: 11, color: '#A6927C' }}>{label}</div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#6B5E54', marginTop: 8, lineHeight: 1.4 }}>
        {adv.icon} {adv.text}
      </div>
    </div>
  )
}

const wrapStyle = {
  background: '#FBF3E9',
  border: '1px solid #F2E3CE',
  borderRadius: 14,
  padding: '12px 14px',
  margin: '6px 0 10px',
}
