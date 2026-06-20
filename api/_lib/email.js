// Shared helpers for the Resend-backed serverless functions.
// Files under api/_lib are not deployed as functions by Vercel.

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export const config = {
  apiKey: process.env.RESEND_API_KEY || '',
  // onboarding@resend.dev works without domain verification — swap for a
  // verified domain sender to reach inboxes reliably (see ADMIN_SETUP.md).
  from: process.env.RESEND_FROM || 'Rocket Pricer <onboarding@resend.dev>',
  notifyTo: process.env.NOTIFY_TO || 'admin@rocketpricer.com',
  signupAlerts: process.env.NOTIFY_SIGNUP_ENABLED !== 'false',
  loginAlerts: process.env.NOTIFY_LOGIN_ENABLED !== 'false',
  // Defaults to sha256('Test@123') so the dashboard works out of the box.
  // Set ADMIN_API_KEY to sha256(<new admin password>) when rotating creds.
  adminApiKey:
    process.env.ADMIN_API_KEY ||
    '8776f108e247ab1e2b323042c049c266407c81fbad41bde1e8dfc1bb66fd267e',
};

export async function sendEmail({ to, subject, html }) {
  if (!config.apiKey) {
    return { sent: false, error: 'RESEND_API_KEY is not configured' };
  }
  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: config.from, to: [to], subject, html }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { sent: false, error: body?.message || `Resend error ${res.status}` };
  }
  const body = await res.json().catch(() => ({}));
  return { sent: true, id: body?.id };
}

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Branded email shell — navy/orange to match the app.
export function renderEmail({ heading, intro, rows = [], ctaLabel, ctaUrl, footnote }) {
  const rowsHtml = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 16px;color:#8b93a7;font-size:13px;border-bottom:1px solid #243456;white-space:nowrap;">${esc(label)}</td>
          <td style="padding:10px 16px;color:#f2f2f2;font-size:13px;border-bottom:1px solid #243456;">${esc(value)}</td>
        </tr>`
    )
    .join('');

  const cta =
    ctaLabel && ctaUrl
      ? `<a href="${esc(ctaUrl)}" style="display:inline-block;margin-top:24px;background:#F7931D;color:#131F39;font-weight:700;font-size:14px;text-decoration:none;padding:13px 28px;border-radius:10px;">${esc(ctaLabel)}</a>`
      : '';

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0d1628;font-family:'Segoe UI',Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0d1628;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
          <tr><td style="padding:0 8px 18px;">
            <span style="font-size:22px;">🚀</span>
            <span style="color:#f2f2f2;font-size:18px;font-weight:800;letter-spacing:2px;vertical-align:middle;"> ROCKET <span style="color:#F7931D;">PRICER</span></span>
          </td></tr>
          <tr><td style="background:#131F39;border:1px solid #243456;border-radius:14px;padding:32px;">
            <h1 style="margin:0 0 12px;color:#ffffff;font-size:20px;">${esc(heading)}</h1>
            <p style="margin:0 0 20px;color:#c7cddb;font-size:14px;line-height:1.6;">${intro}</p>
            ${rows.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f1930;border:1px solid #243456;border-radius:10px;overflow:hidden;">${rowsHtml}</table>` : ''}
            ${cta}
          </td></tr>
          <tr><td style="padding:18px 8px;color:#5b6478;font-size:11px;line-height:1.6;">
            ${footnote ? esc(footnote) : 'Rocket Pricer™ — International Pricing Validation Tool · A Two Deck Consulting product'}
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}
