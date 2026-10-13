import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'

/**
 * Redirects to /login if there's no active session. Returns:
 *   { loading, session, me }
 * where `me` is the signed-in user's profiles row. While `loading` is
 * true, neither session nor me should be trusted yet. Pages that need a
 * signed-in user should early-return (render nothing / a spinner) while
 * loading, same as the old requireSession() + getMyProfile() pair did.
 */
export function useAuth() {
  const navigate = useNavigate()
  const [state, setState] = useState({ loading: true, session: null, me: null })

  useEffect(() => {
    let cancelled = false

    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        if (!cancelled) navigate('/login', { replace: true })
        return
      }

      const { data: me, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio, avatar_url, is_private')
        .eq('id', session.user.id)
        .single()

      if (error) {
        console.error('Could not load your profile:', error.message)
        if (!cancelled) setState({ loading: false, session, me: null })
        return
      }

      if (!cancelled) setState({ loading: false, session, me })
    }

    load()
    return () => {
      cancelled = true
    }
  }, [navigate])

  return state
}

export async function logout(navigate) {
  await supabase.auth.signOut()
  navigate('/login')
}
