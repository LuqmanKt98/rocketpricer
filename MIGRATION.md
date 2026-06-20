# RocketPricer — Base44 → Firebase migration

This app's backend was migrated from **Base44** to **Firebase** (Authentication +
Realtime Database). This document is the complete runbook: what changed, how to
finish configuring Firebase, and how to migrate your existing data.

---

## 1. What changed in the code

| Concern | Before (Base44) | After (Firebase) |
| --- | --- | --- |
| Auth | `@base44/sdk` `auth.*` | `firebase/auth` (email+password **and** Google) |
| Current user | `base44.auth.me()` | `onAuthStateChanged` in `src/lib/AuthContext.jsx` |
| Database | Base44 entities | Realtime Database via `src/api/entities.js` adapter |
| User roster | built-in `User` entity | `/users/{uid}` node (mirror written on sign-in) |
| Analytics | `AnalyticsEvent` entity | `/analytics_events` node |
| Invites | `Invite` entity | `/invites` node |
| Password reset | n/a | `sendPasswordResetEmail` + `/reset-password` handler |

New / changed files:

- `src/api/firebaseClient.js` — Firebase app, Auth, RTDB, Google provider
- `src/api/entities.js` — RTDB-backed `AnalyticsEvent` / `Invite` / `User`
- `src/lib/AuthContext.jsx` — Firebase auth state
- `src/lib/userProfile.js` — mirrors auth users into `/users/{uid}`
- `src/lib/authErrors.js` — friendly Firebase error messages
- `src/pages/SignInPage.jsx`, `SignUpPage.jsx`, `ResetPasswordPage.jsx`
- `database.rules.json` — Realtime Database security rules (see §5)
- `scripts/base44-export.mjs`, `scripts/firebase-import.mjs` — data migration

Removed: all `@base44/*` packages from runtime deps, `src/api/base44Client.js`,
`src/lib/app-params.js`, and the Supabase files from the earlier attempt.

> The Two Deck / Dearin logos still load from `media.base44.com` (public CDN). They
> keep working, but to fully cut the cord you can download them into `public/` and
> swap the `src=` URLs. Optional — not required for the migration.

---

## 2. One-time Firebase setup

You already have the `rocket-pricer` project with Realtime Database, and
Email/Password + Google sign-in enabled. Remaining steps:

1. **Publish the database rules** — Firebase console → Realtime Database → Rules
   → paste `database.rules.json` → **Publish**. (Final rules are also printed at
   the bottom of this file.)
2. **Authorized domains** — Authentication → Settings → Authorized domains →
   make sure `localhost`, `rocketpricer.vercel.app`, and any custom domain are
   listed (needed for Google popup + email links).
3. **(Optional) Branded email action page** — Authentication → Templates → (edit
   any template) → "Customize action URL" → set it to
   `https://rocketpricer.vercel.app/reset-password`. This routes password-reset
   and verification links through the in-app `ResetPasswordPage`. If you skip
   this, Firebase's own hosted pages handle them — both work.

---

## 3. Environment variables

The Firebase **web** config is baked into `src/api/firebaseClient.js`, so the app
runs with no env vars. Optionally override via `.env.local` / Vercel using the
`VITE_FIREBASE_*` keys in `.env.example`.

Still required for transactional email (unchanged from before, server-side only):
`RESEND_API_KEY`, `RESEND_FROM`, `NOTIFY_TO`, `ADMIN_API_KEY`. Set these in
Vercel → Settings → Environment Variables.

---

## 4. Migrating your data from Base44

Requires **Node 20+** (for `--env-file`). Run from the project root.

### 4a. Prepare
```bash
npm install
cp .env.migration.example .env.migration
```
Keep the service-account JSON (`rocket-pricer-firebase-adminsdk-...json`) in the
project root — it's already git-ignored.

### 4b. Get a Base44 admin token
1. Open your live Base44 app and sign in as an admin.
2. DevTools (F12) → Application → Local Storage → copy the value of
   `base44_access_token`.
3. Paste it into `.env.migration` as `BASE44_TOKEN`.

### 4c. Export from Base44
```bash
npm run migrate:export
```
Writes `migration/users.json`, `analytics_events.json`, `invites.json` (plus a
summary). It exports whatever exists and skips anything missing — so it's safe
even though you weren't sure which entities are populated. **Review the JSON.**

### 4d. Import into Firebase
First do a dry run *without* sending emails or wiping:
```bash
npm run migrate:import
```
This recreates users in Firebase Auth, writes `/users/{uid}` profiles (forcing
`admin@rocketpricer.com` to role `admin`), and pushes analytics + invites into
the Realtime Database, preserving `created_date`.

When you're happy, send everyone a "set your password" link — set in
`.env.migration`:
```
SEND_RESET_EMAILS=true
WIPE_BEFORE_IMPORT=true   # clears analytics_events + invites so the re-run doesn't duplicate them
```
then run `npm run migrate:import` again.

> **Why password resets?** Base44 stores password hashes that cannot be exported.
> Migrated users keep their email/name/role/signup-date and just set a new
> password on first use (or sign in with Google). This is unavoidable for any
> auth-provider migration.

> Firebase's built-in email sender is rate-limited. For more than a few dozen
> users, configure a custom SMTP provider in the Firebase console, or generate
> links with the Admin SDK and send them via Resend.

---

## 5. After migration

- Sign in as `admin@rocketpricer.com` → you should land on `/admin` (Mission
  Control) with data loading. If the dashboard is empty, confirm
  `/users/{your-uid}/role` is `"admin"` in the Realtime Database.
- Verify a normal signup, a Google sign-in, "Forgot password", and that a launch
  attempt shows up under Admin → Overview.
- Once everything checks out you can remove the temporary migration tooling:
  `@base44/sdk` and `firebase-admin` from `devDependencies`, the `scripts/` files,
  and the service-account JSON.

---

## 6. Realtime Database rules (paste these into Firebase → RTDB → Rules)

These are also in `database.rules.json`. They: let any signed-in user record an
analytics event, restrict all reads to admins, only let admins create invites,
let users manage their own `/users/{uid}` profile, and block self-promotion to
admin.

```json
{
  "rules": {
    "users": {
      ".read": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin'",
      ".indexOn": ["created_date"],
      "$uid": {
        ".read": "auth != null && (auth.uid === $uid || root.child('users').child(auth.uid).child('role').val() === 'admin')",
        ".write": "auth != null && (auth.uid === $uid || root.child('users').child(auth.uid).child('role').val() === 'admin')",
        ".validate": "newData.hasChildren(['email'])",
        "role": {
          ".validate": "newData.val() === 'user' || newData.val() === 'admin' || root.child('users').child(auth.uid).child('role').val() === 'admin'"
        }
      }
    },
    "analytics_events": {
      ".read": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin'",
      ".indexOn": ["created_date", "event_type"],
      "$id": {
        ".write": "auth != null && !data.exists()",
        ".validate": "newData.hasChildren(['event_type', 'created_date'])"
      }
    },
    "invites": {
      ".read": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin'",
      ".indexOn": ["created_date"],
      "$id": {
        ".write": "auth != null && root.child('users').child(auth.uid).child('role').val() === 'admin'",
        ".validate": "newData.hasChildren(['email', 'created_date'])"
      }
    }
  }
}
```
