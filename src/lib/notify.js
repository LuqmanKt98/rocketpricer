// Client for the Resend-backed transactional email endpoints (/api/*,
// deployed as Vercel serverless functions). Fire-and-forget: email problems
// must never block the UI.

import { track, EVENTS } from '@/lib/tracking';

const LOGIN_ALERT_DEDUPE_HOURS = 12;

// Notify the admin of a signup/login. Login alerts are deduped per email so a
// user bouncing between pages doesn't flood the admin inbox.
export async function notifyAdmin(type, { email, name, meta } = {}) {
  if (type === 'login' && !shouldSendLoginAlert(email)) return;

  try {
    const res = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, email, name, meta }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body.sent) {
      track(EVENTS.EMAIL_SENT, { email_type: type, to: 'admin' }, { email, name });
    } else if (!res.ok) {
      track(EVENTS.EMAIL_FAILED, { email_type: type, reason: body.error || `HTTP ${res.status}` }, { email, name });
    }
  } catch (err) {
    console.debug('[notify] skipped:', err?.message);
  }
}

function shouldSendLoginAlert(email) {
  if (!email) return true;
  const key = `rp_login_alert_${email.toLowerCase()}`;
  try {
    const last = Number(localStorage.getItem(key) || 0);
    if (Date.now() - last < LOGIN_ALERT_DEDUPE_HOURS * 3600 * 1000) return false;
    localStorage.setItem(key, String(Date.now()));
  } catch {
    // storage unavailable — send anyway
  }
  return true;
}

// Send a branded invite email. Requires the admin key header; returns
// { ok, error } so the admin UI can surface the result.
export async function sendInviteEmail({ email, name, message, adminKey }) {
  try {
    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': adminKey || '',
      },
      body: JSON.stringify({ email, name, message, origin: window.location.origin }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: body.error || `HTTP ${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err?.message || 'Network error — is the app deployed to Vercel?' };
  }
}

// Read-only config snapshot for the admin Notifications page.
export async function getNotifyStatus() {
  try {
    const res = await fetch('/api/notify');
    if (!res.ok) return { reachable: false };
    return { reachable: true, ...(await res.json()) };
  } catch {
    return { reachable: false };
  }
}
