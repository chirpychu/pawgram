import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import ResetPasswordPage from './pages/ResetPasswordPage.jsx'
import Feed from './pages/Feed.jsx'
import Profile from './pages/Profile.jsx'
import Explore from './pages/Explore.jsx'
import AuthDrawer from './components/AuthDrawer.jsx'

export default function App() {
  const location = useLocation()
  // When Landing opens /login or /signup via a <Link state={{ backgroundLocation }}>,
  // the "real" routed page underneath stays Landing, and the auth drawer renders
  // as an overlay on top — same slide-in-from-the-right UX as before, but now
  // backed by a real route so a direct visit/refresh at /login still works
  // (it just renders LoginPage full-page, with no backgroundLocation set).
  const backgroundLocation = location.state?.backgroundLocation

  return (
    <>
      <Routes location={backgroundLocation || location}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/explore" element={<Explore />} />
        {/* Old dropdown-search link shape — keep it working, just hand off to /explore. */}
        <Route path="/search" element={<Navigate to={{ pathname: '/explore', search: location.search }} replace />} />
      </Routes>

      {backgroundLocation && (
        <Routes>
          <Route path="/login" element={<AuthDrawer initialTab="login" />} />
          <Route path="/signup" element={<AuthDrawer initialTab="signup" />} />
        </Routes>
      )}
    </>
  )
}
