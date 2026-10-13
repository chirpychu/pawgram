import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'

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

    // Supabase Auth itself only knows email+password; this app logs in by
    // username, so resolve it to the account's real email via the locked-
    // down RPC first (see the username_to_email_lookup migration).
    const { data: email, error: lookupError } = await supabase.rpc('username_to_email', {
      p_username: username.trim(),
    })

    if (lookupError || !email) {
      setMsg({ text: 'Incorrect username or password.', type: 'error' })
      setBusy(false)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })

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
      <input
        id="login-password"
        type="password"
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

    const { data: existing, error: lookupError } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username.trim())
      .maybeSingle()

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
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { username: username.trim(), display_name: displayName.trim() } },
    })

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
      <input
        id="signup-password"
        type="password"
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
