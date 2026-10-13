import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AuthScreen from '../components/AuthScreen.jsx'
import PasswordInput from '../components/PasswordInput.jsx'
import { supabase } from '../services/supabaseClient'

/**
 * Landed on from the email link sent by ForgotPasswordPage. Supabase's
 * client parses the recovery token in the URL itself and sets up a
 * signed-in session for that user before this page even renders, so we
 * just read that session, show the username it belongs to (this is the
 * "forgot username" half of the flow), and let them set a new password.
 */
export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [state, setState] = useState({ loading: true, username: null, error: null })
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState({ text: '', type: '' })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      // The recovery link's token exchange can land fractionally after
      // first render, so give supabase-js a moment, then check once.
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return

      if (!session) {
        setState({ loading: false, username: null, error: 'That reset link is invalid or has expired.' })
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', session.user.id)
        .maybeSingle()

      if (!cancelled) setState({ loading: false, username: profile?.username || null, error: null })
    }

    load()
    return () => { cancelled = true }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) {
      setMsg({ text: "Passwords don't match.", type: 'error' })
      return
    }
    setBusy(true)
    setMsg({ text: '', type: '' })

    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) {
      setMsg({ text: error.message, type: 'error' })
      return
    }

    setMsg({ text: 'Password updated! Redirecting…', type: 'success' })
    setTimeout(() => navigate('/feed'), 1200)
  }

  return (
    <AuthScreen
      title="Reset your password"
      blobSide="login"
      footer={<>Changed your mind? <Link to="/login">Log in</Link></>}
    >
      {state.loading && <div className="auth-form"><div className="msg">Checking your link…</div></div>}

      {!state.loading && state.error && (
        <div className="auth-form">
          <div className="msg error">{state.error}</div>
          <Link to="/forgot-password" className="btn submit-btn" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            Request a new link
          </Link>
        </div>
      )}

      {!state.loading && !state.error && (
        <form className="auth-form" onSubmit={handleSubmit}>
          {state.username && (
            <div style={{ fontSize: 13, color: 'var(--ink-faint)', margin: '0 0 18px' }}>
              Resetting the password for <strong>@{state.username}</strong>.
            </div>
          )}
          <label htmlFor="reset-password">New password</label>
          <PasswordInput
            id="reset-password"
            autoComplete="new-password"
            minLength={6}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <label htmlFor="reset-password-confirm">Confirm new password</label>
          <PasswordInput
            id="reset-password-confirm"
            autoComplete="new-password"
            minLength={6}
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <button type="submit" className="btn submit-btn" disabled={busy}>Set new password</button>
          {msg.text && <div className={`msg ${msg.type}`}>{msg.text}</div>}
        </form>
      )}
    </AuthScreen>
  )
}
