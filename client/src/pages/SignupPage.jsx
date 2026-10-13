import { Link } from 'react-router-dom'
import AuthScreen from '../components/AuthScreen.jsx'
import { SignupForm } from '../components/AuthForms.jsx'

export default function SignupPage() {
  return (
    <AuthScreen
      title="Join the pack"
      blobSide="signup"
      footer={<>Already on Pawgram? <Link to="/login">Log in</Link></>}
    >
      <SignupForm />
    </AuthScreen>
  )
}
