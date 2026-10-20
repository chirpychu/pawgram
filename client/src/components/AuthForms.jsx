import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import PasswordInput from './PasswordInput.jsx'

// Races a Supabase call against a timeout so a stalled request (flaky
// connection, a backgrounded mobile tab resuming into a bad state) can't
// leave a form stuck on its "working…" message forever with the submit
// button disabled and no way to recover short of reloading the page.
function withTimeout(promise, ms = 15000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])
}

/** Login form. Calls onSuccess() right before navigating to /feed. */
export function LoginForm({ onSuccess }) {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState({ text: '', type: '' })
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setMsg({ text: 'Logging in…', type: '' })

    try {
      // Supabase Auth itself only knows email+password; this app logs in by
      // username, so resolve it to the account's real email via the locked-
      // down RPC first (see the username_to_email_lookup migration).
      // Wrapped in a timeout — without one, a stalled request (flaky mobile
      // connection, a backgrounded tab that comes back confused) leaves the
      // form stuck on "Logging in…" forever with no way to recover short of
      // reloading the page.
      const { data: email, error: lookupError } = await withTimeout(
        supabase.rpc('username_to_email', { p_username: username.trim() })
      )

      if (lookupError || !email) {
        setMsg({ text: 'Incorrect username or password.', type: 'error' })
        setBusy(false)
        return
      }

      const { error } = await withTimeout(supabase.auth.signInWithPassword({ email, password }))

      if (error) {
        setMsg({ text: 'Incorrect username or password.', type: 'error' })
        setBusy(false)
        return
      }

      setMsg({ text: 'Welcome back! Redirecting…', type: 'success' })
      setTimeout(() => {
        onSuccess?.()
        navigate('/feed')
      }, 800)
    } catch (err) {
      setMsg({
        text: err?.message === 'timeout'
          ? "That's taking too long — check your connection and try again."
          : 'Something went wrong logging in. Please try again.',
        type: 'error',
      })
      setBusy(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label htmlFor="login-username">Username</label>
      <input
        id="login-username"
        type="text"
        autoComplete="username"
        required
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <label htmlFor="login-password">Password</label>
      <PasswordInput
        id="login-password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit" className="btn submit-btn" disabled={busy}>Log in</button>
      {msg.text && <div className={`msg ${msg.type}`}>{msg.text}</div>}
    </form>
  )
}

/** Signup form. Calls onSuccess() right before navigating to /feed. */
export function SignupForm({ onSuccess }) {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState({ text: '', type: '' })
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setMsg({ text: 'Creating your account…', type: '' })

    try {
      const { data: existing, error: lookupError } = await withTimeout(
        supabase.from('profiles').select('username').eq('username', username.trim()).maybeSingle()
      )

      if (lookupError) {
        setMsg({ text: 'Something went wrong checking that username. Try again.', type: 'error' })
        setBusy(false)
        return
      }
      if (existing) {
        setMsg({ text: 'That username is already taken.', type: 'error' })
        setBusy(false)
        return
      }

      // The real email is what makes "forgot username/password" possible
      // later — Supabase's own reset-password email goes straight to it,
      // and the username -> email RPC used at login resolves to it too.
      const { error } = await withTimeout(
        supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { username: username.trim(), display_name: displayName.trim() } },
        })
      )

      if (error) {
        setMsg({ text: error.message, type: 'error' })
        setBusy(false)
        return
      }

      setMsg({ text: 'Account created! Redirecting…', type: 'success' })
      setTimeout(() => {
        onSuccess?.()
        navigate('/feed')
      }, 1200)
    } catch (err) {
      setMsg({
        text: err?.message === 'timeout'
          ? "That's taking too long — check your connection and try again."
          : 'Something went wrong signing up. Please try again.',
        type: 'error',
      })
      setBusy(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label htmlFor="signup-username">Username</label>
      <input
        id="signup-username"
        type="text"
        autoComplete="username"
        minLength={3}
        maxLength={24}
        pattern="[a-zA-Z0-9_]+"
        title="Letters, numbers, and underscores only"
        required
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ marginBottom: 6 }}
      />
      <div style={{ fontSize: 12, color: 'var(--ink-faint)', margin: '0 0 18px' }}>
        This is what you'll use to log in — keep it handy.
      </div>

      <label htmlFor="signup-display-name">Display name</label>
      <input
        id="signup-display-name"
        type="text"
        autoComplete="nickname"
        minLength={1}
        maxLength={40}
        placeholder="e.g. Milo the Golden"
        required
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        style={{ marginBottom: 6 }}
      />
      <div style={{ fontSize: 12, color: 'var(--ink-faint)', margin: '0 0 18px' }}>
        This is the name shown on your profile and posts — change it anytime.
      </div>

      <label htmlFor="signup-email">Email</label>
      <input
        id="signup-email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ marginBottom: 6 }}
      />
      <div style={{ fontSize: 12, color: 'var(--ink-faint)', margin: '0 0 18px' }}>
        Only used to recover your username or password — never shown on your profile.
      </div>

      <label htmlFor="signup-password">Password</label>
      <PasswordInput
        id="signup-password"
        autoComplete="new-password"
        minLength={6}
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit" className="btn submit-btn" disabled={busy}>Sign up</button>
      {msg.text && <div className={`msg ${msg.type}`}>{msg.text}</div>}
    </form>
  )
}
