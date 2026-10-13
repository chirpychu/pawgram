// Pawgram — Ticketmaster Discovery API (powers the "Playdates" events search).
// This key is safe to expose client-side — Ticketmaster's Consumer Key is
// designed for direct browser use and only grants read access to public
// event listings.
const TICKETMASTER_API_KEY =
  import.meta.env.VITE_TICKETMASTER_API_KEY || 'C5Xuc6E78XWD2tMtRoNvM3fh4Y2zwFd1'

export function hasTicketmasterKey() {
  return Boolean(TICKETMASTER_API_KEY) && TICKETMASTER_API_KEY !== 'YOUR_TICKETMASTER_API_KEY'
}

/**
 * Searches Ticketmaster's Discovery API for pet-related events.
 * @param {{city?: string, countryCode?: string, size?: number}} opts
 */
export async function searchPetEvents({ city = '', countryCode = '', size = 12 } = {}) {
  const params = new URLSearchParams({
    apikey: TICKETMASTER_API_KEY,
    keyword: 'pet',
    size: String(size),
    sort: 'date,asc',
  })
  if (city) params.set('city', city)
  if (countryCode) params.set('countryCode', countryCode)

  const res = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`)
  if (!res.ok) throw new Error(`Ticketmaster API returned ${res.status}`)
  const data = await res.json()
  return data._embedded?.events || []
}
