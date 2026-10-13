import { Link } from 'react-router-dom'

/** Shared background/card chrome for the full-page Login and Signup screens. */
export default function AuthScreen({ title, blobSide = 'login', footer, children }) {
  const isLogin = blobSide === 'login'
  return (
    <div className="auth-screen">
      <div className="bg-decor" aria-hidden="true">
        <div className="blob" style={{
          width: 360, height: 360,
          background: isLogin ? '#6B908030' : '#D9784F2b',
          top: -110, [isLogin ? 'left' : 'right']: -90,
        }} />
        <div className="blob" style={{
          width: 420, height: 420,
          background: isLogin ? '#D9784F2b' : '#6B908030',
          bottom: -140, [isLogin ? 'right' : 'left']: -110,
        }} />
        <div className="blob" style={{
          width: 260, height: 260, background: '#F2C85433',
          top: isLogin ? '40%' : '42%', [isLogin ? 'left' : 'right']: '44%',
        }} />
        <span className="floaty" style={{ top: '8%', [isLogin ? 'left' : 'right']: '10%', fontSize: 40, '--r': isLogin ? '-10deg' : '8deg', animationDelay: '0s' }}>{isLogin ? '🐶' : '🐱'}</span>
        <span className="floaty" style={{ top: '16%', [isLogin ? 'right' : 'left']: '12%', fontSize: 34, '--r': isLogin ? '8deg' : '-8deg', animationDelay: '.8s' }}>{isLogin ? '🐱' : '🐶'}</span>
        <span className="floaty" style={{ bottom: '14%', [isLogin ? 'left' : 'right']: '14%', fontSize: 36, '--r': isLogin ? '6deg' : '-6deg', animationDelay: '1.4s' }}>{isLogin ? '🐰' : '🐹'}</span>
        <span className="floaty" style={{ bottom: '22%', [isLogin ? 'right' : 'left']: '9%', fontSize: 32, '--r': isLogin ? '-6deg' : '6deg', animationDelay: '.4s' }}>🐾</span>
        <span className="floaty spin-paw" style={{ top: '44%', [isLogin ? 'left' : 'right']: '4%', fontSize: 26, animationDelay: '1.1s' }}>🐾</span>
        <span className="floaty spin-paw" style={{ top: isLogin ? '38%' : '36%', [isLogin ? 'right' : 'left']: '5%', fontSize: 24, animationDelay: '1.9s' }}>🦴</span>
        <span className="floaty" style={{ top: '6%', [isLogin ? 'left' : 'right']: '46%', fontSize: 22, '--r': isLogin ? '4deg' : '-4deg', animationDelay: '2.2s' }}>✨</span>
      </div>

      <div className="auth-card">
        <Link to="/" className="auth-logo">🐾 Pawgram</Link>
        <h1>{title}</h1>
        {children}
        <div className="auth-foot">{footer}</div>
      </div>
    </div>
  )
}
