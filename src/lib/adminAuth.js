// Admin access for the Mission Control dashboard. Login happens on the app's
// regular /signin page; this module decides who is an admin and holds the
// dashboard session.
//
// Two ways in:
//  1. A real Firebase account whose email is in ADMIN_EMAILS (or whose
//     /users/{uid}/role === 'admin'). This is the recommended path — Realtime
//     Database reads/writes then pass the rules' admin check.
//  2. The bootstrap credential (default admin@rocketpricer.com / Test@123),
//     checked locally against a SHA-256 hash. This unlocks the UI even before
//     the Firebase account exists; data access depends on the DB role.
//
// Override via env: VITE_ADMIN_EMAIL, VITE_ADMIN_PASSWORD_SHA256.

const SESSION_KEY = 'rp_admin_session';
const SESSION_HOURS = 8;

export const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || 'admin@rocketpricer.com').toLowerCase();

// sha256('Test@123')
const ADMIN_PASSWORD_SHA256 =
  import.meta.env.VITE_ADMIN_PASSWORD_SHA256 ||
  '8776f108e247ab1e2b323042c049c266407c81fbad41bde1e8dfc1bb66fd267e';

export const ADMIN_EMAILS = [ADMIN_EMAIL];

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function isAdminUser(user) {
  if (!user) return false;
  return user.role === 'admin' || ADMIN_EMAILS.includes((user.email || '').toLowerCase());
}

export function getAdminSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session.exp || session.exp < Date.now()) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function grantSession(email, mode, key) {
  const session = {
    email,
    mode, // 'firebase' | 'local'
    key, // sha256 of the password — doubles as the X-Admin-Key for /api/invite
    exp: Date.now() + SESSION_HOURS * 3600 * 1000,
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

// Bootstrap credential check — used by the /signin page when Base44 login
// fails (the bootstrap admin isn't a Base44 account). Returns true and grants
// a dashboard session on a match.
export async function localAdminLogin(email, password) {
  const normalized = (email || '').trim().toLowerCase();
  if (normalized !== ADMIN_EMAIL) return false;
  const key = await sha256Hex(password);
  if (key !== ADMIN_PASSWORD_SHA256) return false;
  grantSession(normalized, 'local', key);
  return true;
}

// Grant a dashboard session to an authenticated Firebase admin. When the
// password is available (fresh /signin), its hash doubles as the X-Admin-Key
// for /api/invite.
export async function adminSessionFromUser(user, password = null) {
  if (!isAdminUser(user)) return null;
  const key = password ? await sha256Hex(password) : null;
  return grantSession((user.email || '').toLowerCase(), 'firebase', key);
}

export function adminLogout() {
  sessionStorage.removeItem(SESSION_KEY);
}

// Refresh the stored session after the admin changes their email or password.
// Call after a successful Firebase Auth update so the X-Admin-Key stays in sync.
export async function refreshAdminSession(newEmail, newPassword = null) {
  const existing = getAdminSession();
  if (!existing) return null;
  const key = newPassword ? await sha256Hex(newPassword) : existing.key;
  return grantSession(
    (newEmail || existing.email).toLowerCase(),
    existing.mode,
    key,
  );
}
