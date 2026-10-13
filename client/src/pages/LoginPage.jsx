import { Link } from 'react-router-dom'
import AuthScreen from '../components/AuthScreen.jsx'
import { LoginForm } from '../components/AuthForms.jsx'

export default function LoginPage() {
  return (
    <AuthScreen
      title="Welcome back"
      blobSide="login"
      footer={<>New to Pawgram? <Link to="/signup">Sign up</Link></>}
    >
      <LoginForm />
    </AuthScreen>
  )
}
