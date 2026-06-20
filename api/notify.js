// POST /api/notify — sends a transactional alert to the admin inbox via
// Resend when a user signs up or logs in.
// GET  /api/notify — returns a redacted config snapshot for the admin UI.

import { config, sendEmail, renderEmail } from './_lib/email.js';

const TYPES = {
  signup: {
    enabled: () => config.signupAlerts,
    subject: (email) => `🚀 New Rocket Pricer signup: ${email}`,
    heading: 'New crew member aboard',
    intro: 'A new user just created a Rocket Pricer account.',
  },
  login: {
    enabled: () => config.loginAlerts,
    subject: (email) => `🔑 Rocket Pricer login: ${email}`,
    heading: 'User logged in',
    intro: 'A returning user just signed in to Rocket Pricer.',
  },
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({
      resendConfigured: Boolean(config.apiKey),
      from: config.from,
      notifyTo: config.notifyTo,
      signupAlerts: config.signupAlerts,
      loginAlerts: config.loginAlerts,
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, email, name, meta } = req.body || {};
  const spec = TYPES[type];
  if (!spec) return res.status(400).json({ error: 'Unknown notification type' });
  if (typeof email !== 'string' || email.length > 254 || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  if (!spec.enabled()) return res.status(200).json({ sent: false, skipped: 'disabled' });

  const rows = [
    ['Email', email],
    ['Name', (typeof name === 'string' && name.slice(0, 120)) || '—'],
    ['When', new Date().toUTCString()],
  ];
  if (meta && typeof meta === 'object') {
    for (const [k, v] of Object.entries(meta).slice(0, 5)) {
      rows.push([String(k).slice(0, 40), String(v).slice(0, 200)]);
    }
  }

  const result = await sendEmail({
    to: config.notifyTo,
    subject: spec.subject(email),
    html: renderEmail({
      heading: spec.heading,
      intro: spec.intro,
      rows,
      ctaLabel: 'Open Mission Control',
      ctaUrl: `${originOf(req)}/admin`,
    }),
  });

  return res.status(result.sent ? 200 : 502).json(result);
}

function originOf(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'rocketpricer.vercel.app';
  return `${proto}://${host}`;
}
