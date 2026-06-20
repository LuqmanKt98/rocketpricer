# Rocket Pricer™

> International pricing validation tool for brands entering the US market.  
> Built for **Mike Todd / Two Deck Consulting** — hosted at [rocketpricer.vercel.app](https://rocketpricer.vercel.app)

---

## What it does

Enter four prices across the international distribution chain — Factory → Distributor → Wholesale → SRRP — and find out instantly whether your margins are aligned for a US market entry. If all four stages clear their targets, the rocket launches. If not, you get four attempts to fix the model before being connected with the Chief Engineer.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS + Framer Motion |
| Auth | Firebase Authentication (Email/Password + Google OAuth) |
| Database | Firebase Realtime Database (asia-southeast1) |
| Deployment | Vercel (SPA + serverless functions) |
| Email | Resend (transactional — signup/login alerts + branded invites) |

## Project structure

```
src/
  api/          firebaseClient.js, entities.js (RTDB adapter)
  components/   StarField, RocketVisual, AlienRefueler, LandingPage, …
  lib/          AuthContext, adminAuth, tracking, userProfile, authErrors, …
  pages/        RocketPricer, SignInPage, SignUpPage, ResetPasswordPage
  pages/admin/  Mission Control — Overview, Users, Leads, Invites, Profile, …
api/            Vercel serverless functions (notify.js, invite.js)
scripts/        create-admin.mjs, firebase-import.mjs, base44-export.mjs
```

## Getting started

```bash
npm install
npm run dev
```

The Firebase web config is baked in — no env vars needed to run locally.  
For transactional email copy `.env.example` → `.env.local` and fill in `RESEND_*` keys.

## Admin dashboard (Mission Control)

Sign in at `/signin` with `admin@rocketpricer.com`.  
Provision the account with:

```bash
npm run create:admin
```

The dashboard is at `/admin` — Overview, Users, Hot Leads, Invites, Notifications, Setup, Profile.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start local dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm run create:admin` | Provision/reset the Firebase admin account |
| `npm run migrate:export` | Export data from Base44 → `migration/` |
| `npm run migrate:import` | Import `migration/` data into Firebase |

## One-time Firebase setup

See [MIGRATION.md](./MIGRATION.md) for:
- Publishing the Realtime Database security rules (`database.rules.json`)
- Setting up Vercel environment variables
- Data migration from Base44

## Deployment

Push to `main` → Vercel deploys automatically.  
Required Vercel environment variables:

```
RESEND_API_KEY      Resend API key
RESEND_FROM         Sender address
NOTIFY_TO           Alert destination email
ADMIN_API_KEY       SHA-256 of admin password (protects /api/invite)
```

---

*Rocket Pricer™ — Will It Fly… or Fail?*
