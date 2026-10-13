import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthScreen from '../components/AuthScreen.jsx'
import { supabase } from '../services/supabaseClient'

/**
 * Covers both "forgot username" and "forgot password" with one form:
 * the person only has to remember their email. Supabase sends the reset
 * email itself; once they click it they land on /reset-password already
 * signed in via the recovery link, where their username is shown right
 * alongside the new-password form.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    // Same message whether or not the email is on file — this avoids
    // letting the form be used to probe which emails have accounts.
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}reset-password`,
    })
    setBusy(false)
    setSent(true)
  }

  return (
    <AuthScreen
      title="Forgot username or password?"
      blobSide="login"
      footer={<>Remembered it after all? <Link to="/login">Log in</Link></>}
    >
      {sent ? (
        <div className="auth-form">
          <div className="msg success">
            If that email has a Pawgram account, we've sent a link to reset your password — it'll also remind you of your username.
          </div>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          <div style={{ fontSize: 13, color: 'var(--ink-faint)', margin: '0 0 18px' }}>
            Enter the email you signed up with and we'll send you a link to reset your password and see your username.
          </div>
          <label htmlFor="forgot-email">Email</label>
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" className="btn submit-btn" disabled={busy}>
            {busy ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthScreen>
  )
}
