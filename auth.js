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

// Updates a placeholder element with an elapsed-seconds counter so a slow
// request (e.g. a cold Supabase database waking up) doesn't look frozen.
function startElapsedPlaceholder(container, label) {
  const start = Date.now();
  const render = (text) => {
    container.innerHTML = `<div class="card" style="padding:32px;text-align:center;color:#A6927C">${text}</div>`;
  };
  render(label);
  return setInterval(() => {
    const secs = Math.floor((Date.now() - start) / 1000);
    render(secs > 0 ? `${label} (${secs}s)` : label);
  }, 500);
}

// Wires up the "Explore" nav item's search dropdown, shared by every logged-in
// page's sidebar (feed.html, profile.html, search.html). Expects the markup:
//   <div id="explore-wrap"><a id="explore-toggle">...</a>
//     <div id="explore-dropdown"><form id="explore-form">
//       <input id="explore-input">...</form></div></div>
// Submitting the form always navigates to search.html?q=... — even from
// search.html itself, so a fresh search re-triggers that page's own load.
function initExploreDropdown() {
  const wrap = document.getElementById('explore-wrap');
  const toggle = document.getElementById('explore-toggle');
  const dropdown = document.getElementById('explore-dropdown');
  const form = document.getElementById('explore-form');
  const input = document.getElementById('explore-input');
  if (!wrap || !toggle || !dropdown || !form || !input) return;

  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    const isOpen = dropdown.style.display === 'block';
    if (isOpen) {
      dropdown.style.display = 'none';
      return;
    }
    // Positioned as fixed (not absolute) so it isn't clipped by the mobile
    // top bar's overflow-x: auto, which also clips the y-axis.
    const rect = toggle.getBoundingClientRect();
    dropdown.style.top = (rect.bottom + 6) + 'px';
    dropdown.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - 256)) + 'px';
    dropdown.style.display = 'block';
    input.focus();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    window.location.href = 'search.html?q=' + encodeURIComponent(q);
  });

  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) dropdown.style.display = 'none';
  });
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
