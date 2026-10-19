import { Link } from 'react-router-dom'
import LegalPageLayout from '../components/LegalPageLayout.jsx'

const CONTACT_EMAIL = 'chirpychu@gmail.com'

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service" updated="20 October 2026">
      <p>
        Pawgram is an independent, personal project built for pet owners to share photos and connect with other
        pet owners. By creating an account, you're agreeing to the terms below. This is a plain-language summary
        rather than a formal legal contract.
      </p>

      <h2>What Pawgram is for</h2>
      <p>
        Pawgram is meant for sharing content about pets and animals — photos, videos, and posts about your own
        pets, and connecting with other pet owners. Please keep posts, messages, and profiles on-topic and
        appropriate for a general audience.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>You're responsible for keeping your password private and for anything posted from your account.</li>
        <li>You need to provide a real, working email address so account recovery (forgot username/password) works.</li>
        <li>One person, one account — don't impersonate someone else or create an account on someone else's behalf without permission.</li>
      </ul>

      <h2>Your content</h2>
      <p>
        You keep ownership of the photos, videos, and captions you post. By posting them, you're giving Pawgram a
        license to store and display that content back to you and (depending on your account's privacy setting)
        to other users, purely so the app can function — we don't use your content for anything beyond that, like
        advertising or selling it to anyone else.
      </p>
      <p>You're responsible for making sure you have the right to post whatever you share — photos should be your own or ones you have permission to post.</p>

      <h2>Not allowed</h2>
      <ul>
        <li>Content unrelated to pets/animals that doesn't fit the spirit of the app.</li>
        <li>Harassment, hate speech, or targeting other users.</li>
        <li>Spam, scams, or impersonation.</li>
        <li>Uploading anything illegal, or content that infringes someone else's rights.</li>
        <li>Attempting to break, abuse, or gain unauthorized access to the app or other users' accounts.</li>
      </ul>
      <p>Accounts that clearly violate these may be removed at the owner's discretion.</p>

      <h2>No warranty</h2>
      <p>
        Pawgram is a small, independently run project, provided as-is, without guarantees of uptime, data backup,
        or that it will always be available. Please don't treat it as the only copy of photos or messages you
        care about.
      </p>

      <h2>Changes</h2>
      <p>These terms may be updated from time to time; continuing to use Pawgram after a change means you accept the updated terms.</p>

      <h2>Contact</h2>
      <p>
        Questions about these terms? Reach out at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. See
        also the <Link to="/privacy">Privacy Policy</Link> for how your data is handled.
      </p>
    </LegalPageLayout>
  )
}
