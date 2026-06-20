// ============================================================================
// firebase-import.mjs — load the exported Base44 JSON into Firebase.
// ----------------------------------------------------------------------------
// 1. Recreates each user in Firebase Authentication (no password — they set one
//    via the reset link), and mirrors them into /users/{uid} with role + date.
// 2. Optionally emails every user a password-reset link so they can set a
//    password (Base44 password hashes can't be migrated).
// 3. Pushes analytics_events and invites into the Realtime Database, preserving
//    created_date.
//
// Run:   npm run migrate:import
// Needs (in .env.migration):
//   FIREBASE_SERVICE_ACCOUNT   path to the service-account JSON (default below)
//   FIREBASE_DATABASE_URL      RTDB URL (default below)
//   ADMIN_EMAIL                whose /users role is forced to 'admin'
//   SEND_RESET_EMAILS          "true" to email everyone a set-password link
//   WIPE_BEFORE_IMPORT         "true" to clear analytics_events + invites first
// ============================================================================

import admin from 'firebase-admin';
import { initializeApp as initClientApp } from 'firebase/app';
import { getAuth as getClientAuth, sendPasswordResetEmail } from 'firebase/auth';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const SERVICE_ACCOUNT_PATH =
  process.env.FIREBASE_SERVICE_ACCOUNT || 'rocket-pricer-firebase-adminsdk-fbsvc-7f8bc90bc7.json';
const DATABASE_URL =
  process.env.FIREBASE_DATABASE_URL ||
  'https://rocket-pricer-default-rtdb.asia-southeast1.firebasedatabase.app';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@rocketpricer.com').toLowerCase();
const SEND_RESET = process.env.SEND_RESET_EMAILS === 'true';
const WIPE = process.env.WIPE_BEFORE_IMPORT === 'true';
const DIR = resolve(process.cwd(), 'migration');

const serviceAccount = JSON.parse(await readFile(resolve(process.cwd(), SERVICE_ACCOUNT_PATH), 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount), databaseURL: DATABASE_URL });
const auth = admin.auth();
const db = admin.database();

// Client app — only used to actually send password-reset emails via Firebase.
const clientApp = SEND_RESET
  ? initClientApp({
      apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyDpx0czntBF5LxdDHXiqMPnrXq3SAJVDoY',
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'rocket-pricer.firebaseapp.com',
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'rocket-pricer',
    })
  : null;
const clientAuth = clientApp ? getClientAuth(clientApp) : null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function load(name) {
  try {
    return JSON.parse(await readFile(resolve(DIR, `${name}.json`), 'utf8'));
  } catch {
    console.warn(`⚠ migration/${name}.json not found — skipping.`);
    return [];
  }
}

async function importUsers() {
  const users = await load('users');
  if (!users.length) return;
  console.log(`\n→ Importing ${users.length} user(s)…`);
  const now = new Date().toISOString();
  let created = 0, profiles = 0, reset = 0;

  for (const u of users) {
    const email = (u.email || '').trim().toLowerCase();
    if (!email || u.is_service) continue;

    let uid;
    try {
      const rec = await auth.createUser({ email, emailVerified: true, displayName: u.full_name || undefined });
      uid = rec.uid;
      created += 1;
    } catch (err) {
      if (err.code === 'auth/email-already-exists') {
        const rec = await auth.getUserByEmail(email);
        uid = rec.uid;
      } else {
        console.warn(`  ⚠ ${email}: create failed — ${err.message}`);
        continue;
      }
    }

    const role = (u.role === 'admin' || email === ADMIN_EMAIL) ? 'admin' : 'user';
    try {
      await db.ref(`users/${uid}`).update({
        email,
        full_name: u.full_name || null,
        role,
        is_verified: true,
        disabled: !!u.disabled,
        created_date: u.created_date || now,
        updated_date: now,
      });
      profiles += 1;
    } catch (err) {
      console.warn(`  ⚠ ${email}: profile write failed — ${err.message}`);
    }

    if (SEND_RESET && clientAuth) {
      try {
        await sendPasswordResetEmail(clientAuth, email);
        reset += 1;
        await sleep(600); // stay under Firebase's email rate limit
      } catch (err) {
        console.warn(`  ⚠ ${email}: reset email failed — ${err.message}`);
      }
    }
  }
  console.log(`  users: ${created} created, ${profiles} profiles written${SEND_RESET ? `, ${reset} reset emails sent` : ''}.`);
}

async function importNode(node, mapRow) {
  const rows = await load(node);
  if (!rows.length) return;
  console.log(`\n→ Importing ${rows.length} ${node}…`);

  if (WIPE) {
    await db.ref(node).set(null);
    console.log(`  wiped existing ${node}.`);
  }

  let inserted = 0;
  for (const r of rows) {
    try {
      await db.ref(node).push(mapRow(r));
      inserted += 1;
    } catch (err) {
      console.warn(`  ⚠ ${node} insert failed — ${err.message}`);
    }
  }
  console.log(`  ${node}: ${inserted} inserted.`);
}

async function main() {
  console.log(`Importing into Firebase RTDB ${DATABASE_URL}`);
  if (SEND_RESET && !clientAuth) console.warn('⚠ SEND_RESET_EMAILS=true but the client app failed to init — reset emails skipped.');

  await importUsers();

  await importNode('analytics_events', (r) => ({
    event_type: r.event_type,
    email: r.email || null,
    name: r.name || null,
    session_id: r.session_id || null,
    data: r.data || {},
    created_date: r.created_date || new Date().toISOString(),
  }));

  await importNode('invites', (r) => ({
    email: r.email,
    name: r.name || null,
    message: r.message || null,
    status: r.status || 'sent',
    invited_by: r.invited_by || null,
    created_date: r.created_date || new Date().toISOString(),
  }));

  console.log('\n✔ Import complete.');
  if (!SEND_RESET) console.log('Tip: re-run with SEND_RESET_EMAILS=true to email users a set-password link.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Import failed:', err?.message || err);
  process.exit(1);
});
