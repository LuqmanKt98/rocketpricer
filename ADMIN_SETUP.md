# Rocket Pricer — Admin Dashboard ("Mission Control") Setup

The admin dashboard lives at **`/admin`** and is fully built into the app. Most of it
works out of the box, but three one-time platform steps unlock everything:
creating two Base44 entities, configuring Resend on Vercel, and (recommended)
making the admin account a real Base44 admin user.

The dashboard's **Setup page (`/admin/setup`) runs live health checks** for all of
this — open it first.

---

## 1. Admin access

| | |
|---|---|
| Dashboard URL | `https://<your-domain>/admin` |
| Sign-in page | the app's regular `/signin` page |
| Bootstrap email | `admin@rocketpricer.com` |
| Bootstrap password | `Test@123` |

There is no separate admin login screen — sign in at **`/signin`** with admin
credentials and you land in Mission Control automatically (visiting `/admin`
while locked redirects there). Two kinds of credentials work:

1. **Bootstrap credential** (above) — verified locally against a SHA-256 hash.
   Unlocks the dashboard UI immediately, with no Base44 account needed.
2. **Base44 admin account** — any Base44 user whose `role` is `admin` (or whose
   email is `admin@rocketpricer.com`). Signing in routes straight to `/admin`,
   and an already-signed-in admin can just open `/admin`. **This is the
   recommended long-term path** because entity reads then carry a real
   admin token, which matters once entity permissions are locked down.

### Rotating the credentials

1. Pick a new password and compute its SHA-256 hex (PowerShell):
   ```powershell
   $sha=[Security.Cryptography.SHA256]::Create();($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes('NewPassword'))|%{$_.ToString('x2')})-join''
   ```
2. Set build-time env vars (Vercel → Settings → Environment Variables):
   - `VITE_ADMIN_EMAIL` — new admin email
   - `VITE_ADMIN_PASSWORD_SHA256` — hash from step 1
   - `ADMIN_API_KEY` — **same hash** (protects the `/api/invite` endpoint)
3. Redeploy.

> ⚠️ Frontend-only gating is convenience, not security. The real security
> boundary is Base44 entity permissions (step 2) — set those so only admins can
> *read* analytics data.

## 2. Create the Base44 entities

In [base44.com](https://base44.com) open the app (`69c37219f83ff2b34462675d`) →
**Data** → create these two entities. The JSON schemas are also available with
copy buttons on `/admin/setup`.

**AnalyticsEvent** — every tracked event (signups, logins, launch attempts with
the actual prices entered, CTA clicks, emails):

| Field | Type | Notes |
|---|---|---|
| `event_type` | string, required | `signup`, `login`, `launch_attempt`, `attempts_exhausted`, `cta_click`, `invite_sent`, `email_sent`, `email_failed` |
| `email` | string | user email, null for anonymous |
| `name` | string | user full name |
| `session_id` | string | browser session id |
| `data` | object | event payload (prices, stages, result, source…) |

**Invite** — invite history for the Invites page:

| Field | Type | Notes |
|---|---|---|
| `email` | string, required | invitee |
| `name` | string | invitee name |
| `message` | string | personal note |
| `status` | string | `sent` / `failed` |
| `invited_by` | string | admin email |

**Permissions** (entity security rules): any logged-in user may **create**;
only **admins** may read/update/delete. The app only ever creates events from
the client; all reading happens in the admin dashboard.

> Until these entities exist, the app still works perfectly — tracking calls
> fail silently, and the dashboard shows a "entity not found" notice pointing
> at the Setup page.

## 3. Resend email notifications

1. Create an account at [resend.com](https://resend.com).
2. **Verify the sending domain** (Resend → Domains → Add Domain → add the
   SPF + DKIM DNS records they show you). This is the step that keeps alerts
   out of spam. Until then the default `onboarding@resend.dev` sender works for
   testing but has weak deliverability.
3. Create an API key.
4. In Vercel → Project → Settings → Environment Variables, add:

| Variable | Required | Purpose |
|---|---|---|
| `RESEND_API_KEY` | ✅ | Resend API key — nothing sends without it |
| `RESEND_FROM` | recommended | e.g. `Rocket Pricer <notify@rocketpricer.com>` (must be on the verified domain) |
| `NOTIFY_TO` | recommended | who receives signup/login alerts (default `admin@rocketpricer.com`; likely `mike.todd@dearinassociates.com`) |
| `NOTIFY_SIGNUP_ENABLED` | optional | `false` to disable new-signup alerts |
| `NOTIFY_LOGIN_ENABLED` | optional | `false` to disable login alerts |
| `ADMIN_API_KEY` | when rotating creds | SHA-256 of the admin password; guards `/api/invite` |

5. Redeploy. The Notifications page (`/admin/notifications`) shows live status.

**What gets sent:**

- **New signup alert** → `NOTIFY_TO`, fired when a user completes OTP verification.
- **Login alert** → `NOTIFY_TO`, deduplicated client-side to one per user per 12 h.
- **Invite email** → the invitee, branded template with a personal note and a
  prefilled signup link (`/signup?invited=1&email=…`).

> Serverless functions only run on the Vercel deployment. `npm run dev` does
> not serve `/api/*` — use `vercel dev` if you need to test emails locally.

## 4. What's in the dashboard

| Page | What it does |
|---|---|
| **Overview** | KPIs (users, attempts, success rate, CTA clicks), 30-day activity chart, lead funnel, stage-failure analysis, live activity feed |
| **Users** | Searchable roster with per-user stats, click-through to a full activity timeline incl. the last pricing model they tested, CSV export |
| **Hot Leads** | Lead-scored list of users showing buying signals (CTA clicks, valid pricing, exhausted attempts) with one-click follow-up emails |
| **Invites** | Send branded invite emails via Resend, invite history with accepted/pending status |
| **Notifications** | Live Resend/env config status + log of sent/failed emails |
| **Setup** | Live health checks + copy-paste entity schemas and env var reference |

## 5. Also fixed in this release

- **LinkedIn preview**: proper 1200×630 OG card at `public/og-image.png` with
  full OG/Twitter meta tags. After deploying, paste the URL into
  [LinkedIn's Post Inspector](https://www.linkedin.com/post-inspector/) once to
  bust LinkedIn's cache. If a custom domain is added later, update the
  `og:url` / `og:image` / `twitter:image` URLs in `index.html`.
- **Favicon**: rocket icon (`public/favicon.svg` + PNG fallbacks + apple-touch icon).
- **PWA manifest**: brand colors + icons.
- Regenerate any of these with `node scripts/generate-assets.mjs`.
