import { createClient } from '@supabase/supabase-js'

// These two values are safe to expose in client-side code — the anon key
// only grants whatever the Row Level Security policies on the Supabase
// project allow. They're baked in (not secret), same as the old config.js,
// but read from Vite env vars first so a .env file can override them
// locally without touching source.
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://bdpgwaeaubsxbxydjvfo.supabase.co'
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkcGd3YWVhdWJzeGJ4eWRqdmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NzA1NjksImV4cCI6MjEwNzA0NjU2OX0.LWry_M73He_GePXzIE4NaR1P24gA-aRTFuTtFa0WvE8'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/** Builds the public URL for a file in the post-images storage bucket. */
export function getPostImageUrl(storagePath) {
  const { data } = supabase.storage.from('post-images').getPublicUrl(storagePath)
  return data.publicUrl
}
