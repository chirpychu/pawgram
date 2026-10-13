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

    const { error } = await supabase.auth.signInWithPassword({
      email: `${username.trim()}@pawgram-users.com`,
      password,
    })

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
    <form onSubmit={handleSubmit}>
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

    // Supabase Auth needs an email, so we generate a private one behind the
    // scenes and store the real username in the user's metadata + profiles row.
    const { error } = await supabase.auth.signUp({
      email: `${username.trim()}@pawgram-users.com`,
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
    <form onSubmit={handleSubmit}>
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
