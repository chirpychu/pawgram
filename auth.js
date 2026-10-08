// Pawgram — shared auth/session helpers, used by feed.html and profile.html.
// Requires config.js (for supabaseClient) to be loaded first.

// Redirects to login.html if there's no active session. Returns the
// session object (with session.user.id) when there is one.
async function requireSession() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return session;
}

// Fetches the profiles row for the currently logged-in user.
async function getMyProfile(session) {
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('id, username, display_name, bio, avatar_url, is_private')
    .eq('id', session.user.id)
    .single();
  if (error) {
    console.error('Could not load your profile:', error.message);
    return null;
  }
  return data;
}

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = 'login.html';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

function timeAgo(isoString) {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  const units = [
    ['year', 31536000], ['month', 2592000], ['day', 86400],
    ['hour', 3600], ['minute', 60]
  ];
  for (const [name, secs] of units) {
    const n = Math.floor(seconds / secs);
    if (n >= 1) return `${n} ${name}${n > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}
