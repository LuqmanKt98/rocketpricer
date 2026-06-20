// POST /api/invite — sends a branded invitation email via Resend.
// Protected by X-Admin-Key (sha256 of the admin password; the dashboard sends
// it automatically after admin login).

import { config, sendEmail, renderEmail } from './_lib/email.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const key = req.headers['x-admin-key'];
  if (!key || key !== config.adminApiKey) {
    return res.status(401).json({ error: 'Unauthorized — invalid admin key' });
  }

  const { email, name, message, origin } = req.body || {};
  if (typeof email !== 'string' || email.length > 254 || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const appOrigin = sanitizeOrigin(origin) || originOf(req);
  const signupUrl = `${appOrigin}/signup?invited=1&email=${encodeURIComponent(email)}`;
  const personalNote =
    typeof message === 'string' && message.trim()
      ? `<br/><br/><em style="color:#FFB85C;">“${escapeHtml(message.trim().slice(0, 500))}”</em>`
      : '';

  const result = await sendEmail({
    to: email,
    subject: "🚀 You're invited to Rocket Pricer — will your pricing fly or fail?",
    html: renderEmail({
      heading: `${name ? escapeHtml(String(name).slice(0, 80)) + ', you' : 'You'}'ve been invited to Mission Control`,
      intro:
        'Rocket Pricer validates your international pricing model in seconds — enter your Factory, Distributor, Wholesale and SRRP prices, and see if your rocket launches.' +
        personalNote,
      ctaLabel: 'Accept invite & launch',
      ctaUrl: signupUrl,
      footnote: 'You received this because someone at Two Deck Consulting invited you to try Rocket Pricer. No account will be created unless you sign up.',
    }),
  });

  return res.status(result.sent ? 200 : 502).json(result);
}

function sanitizeOrigin(origin) {
  if (typeof origin !== 'string') return null;
  try {
    const url = new URL(origin);
    if (url.protocol !== 'https:' && url.hostname !== 'localhost') return null;
    return url.origin;
  } catch {
    return null;
  }
}

function originOf(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'rocketpricer.vercel.app';
  return `${proto}://${host}`;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
