import LegalPageLayout from '../components/LegalPageLayout.jsx'

const CONTACT_EMAIL = 'chirpychu@gmail.com'

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" updated="20 October 2026">
      <p>
        Pawgram is an independent, personal project — not a company. This page explains, in plain language,
        what information the app collects, why, and where it's stored. It isn't a substitute for formal legal
        advice; if you need a legally binding privacy policy for a commercial product, a lawyer should review one.
      </p>

      <h2>What we collect</h2>
      <p>When you create an account and use Pawgram, the following is stored:</p>
      <ul>
        <li><strong>Account info:</strong> your username, the email address you sign up with (used only for login and password resets), and your password (never stored in plain text — handled by our backend provider, Supabase, using industry-standard hashing).</li>
        <li><strong>Profile info:</strong> your display name, bio, and profile picture, if you add them.</li>
        <li><strong>Content you post:</strong> photos, videos, and captions you share, and any comments or reactions you leave.</li>
        <li><strong>Social connections:</strong> who you follow and who follows you.</li>
        <li><strong>Messages:</strong> direct messages you send to other users.</li>
      </ul>

      <h2>Location &amp; weather</h2>
      <p>
        If you allow it, the feed sidebar shows local weather and a walk-safety tip. Your browser sends your
        location directly to Open-Meteo, a free third-party weather service, to fetch that forecast — it does not
        pass through or get stored on Pawgram's own servers at all. You can decline the location prompt, or revoke
        it later in your browser's site settings, and the rest of the app works normally.
      </p>

      <h2>What we don't do</h2>
      <ul>
        <li>We don't run any analytics, advertising, or tracking scripts — there is no Google Analytics or similar tool on this site.</li>
        <li>We don't sell or share your data with third parties for marketing.</li>
        <li>We don't show ads.</li>
      </ul>

      <h2>Where data is stored</h2>
      <p>
        Pawgram's data (accounts, posts, images, messages) is stored with Supabase, a third-party backend
        provider. Photos and videos are kept in cloud storage and served over a public URL once posted — anyone
        with the link can view a file, the same way most photo-sharing sites work, so don't post anything you
        wouldn't want to be publicly reachable by link. Setting your account to <strong>private</strong> hides
        your posts from the app's Explore/search pages and from anyone who isn't an approved follower, but the
        underlying file link itself isn't a secret.
      </p>

      <h2>Cookies &amp; local storage</h2>
      <p>
        Pawgram uses your browser's local storage only to keep you signed in between visits, and briefly to cache
        your local weather so it doesn't have to ask your location again every few minutes. Nothing here is used
        for tracking or advertising.
      </p>

      <h2>Deleting your data</h2>
      <p>
        You can delete any of your own posts at any time from the feed or your profile. There isn't yet a
        self-service "delete my account" button — if you'd like your account and data removed entirely, email{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and it will be handled manually.
      </p>

      <h2>Children</h2>
      <p>Pawgram isn't directed at children, and isn't knowingly used to collect information from anyone under 13.</p>

      <h2>Changes to this policy</h2>
      <p>
        If what Pawgram collects or how it's used changes meaningfully, this page will be updated and the date
        above will reflect it.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about your data, or anything on this page? Reach out at{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </LegalPageLayout>
  )
}
