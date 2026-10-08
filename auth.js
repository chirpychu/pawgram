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

// Builds the public URL for a file in the post-images storage bucket.
function getPostImageUrl(storagePath) {
  const { data } = supabaseClient.storage.from('post-images').getPublicUrl(storagePath);
  return data.publicUrl;
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

// Keeps a button's label updating with an elapsed-seconds counter so a
// slow request (e.g. a cold Supabase database waking up) doesn't look frozen.
function startProgress(btn, label) {
  const start = Date.now();
  btn.disabled = true;
  btn.dataset.originalText = btn.textContent;
  const tick = () => {
    const secs = Math.floor((Date.now() - start) / 1000);
    btn.textContent = secs > 0 ? `${label} (${secs}s)` : label;
  };
  tick();
  return setInterval(tick, 500);
}

function stopProgress(btn, timer) {
  clearInterval(timer);
  btn.disabled = false;
  btn.textContent = btn.dataset.originalText || btn.textContent;
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
