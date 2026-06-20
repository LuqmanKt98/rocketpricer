// One-shot script: create (or reset) the admin Firebase Auth account and write
// its /users/{uid} profile with role: 'admin' in the Realtime Database.
//
// Usage:  node --env-file=.env.migration scripts/create-admin.mjs
//   or:   npm run create:admin
//
// Env (all have built-in defaults):
//   FIREBASE_SERVICE_ACCOUNT   path to service-account JSON
//   FIREBASE_DATABASE_URL      RTDB URL
//   ADMIN_EMAIL                email to create / update
//   ADMIN_PASSWORD             password to set
//   ADMIN_DISPLAY_NAME         display name for the profile

import admin from 'firebase-admin';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const SA_PATH = process.env.FIREBASE_SERVICE_ACCOUNT || 'rocket-pricer-firebase-adminsdk-fbsvc-7f8bc90bc7.json';
const DB_URL  = process.env.FIREBASE_DATABASE_URL    || 'https://rocket-pricer-default-rtdb.asia-southeast1.firebasedatabase.app';
const EMAIL   = (process.env.ADMIN_EMAIL             || 'admin@rocketpricer.com').toLowerCase();
const PASS    = process.env.ADMIN_PASSWORD           || 'Test@123';
const NAME    = process.env.ADMIN_DISPLAY_NAME       || 'Admin';

const sa = JSON.parse(await readFile(resolve(process.cwd(), SA_PATH), 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(sa), databaseURL: DB_URL });

const auth = admin.auth();
const db   = admin.database();

async function main() {
  let uid;

  // --- 1. Create or update the Firebase Auth user -------------------------
  try {
    const u = await auth.createUser({
      email: EMAIL, password: PASS, emailVerified: true, displayName: NAME,
    });
    uid = u.uid;
    console.log(`✅ Created Firebase Auth user  uid=${uid}`);
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      const u = await auth.getUserByEmail(EMAIL);
      uid = u.uid;
      await auth.updateUser(uid, { password: PASS, emailVerified: true, displayName: NAME });
      console.log(`ℹ️  User already existed (uid=${uid}) — password updated.`);
    } else {
      throw err;
    }
  }

  // --- 2. Write / patch the RTDB profile with role: admin -----------------
  const snap = await db.ref(`users/${uid}`).once('value');
  const existing = snap.val();
  const now = new Date().toISOString();

  await db.ref(`users/${uid}`).update({
    email:        EMAIL,
    full_name:    NAME,
    role:         'admin',
    is_verified:  true,
    disabled:     false,
    updated_date: now,
    // Only set created_date on first write
    ...(existing?.created_date ? {} : { created_date: now }),
  });

  console.log(`✅ RTDB /users/${uid}/role = "admin"`);
  console.log(`\n✔  Admin account ready:`);
  console.log(`   Email:    ${EMAIL}`);
  console.log(`   Password: ${PASS}`);
  console.log(`\nSign in at /signin to access Mission Control with live dashboard data.`);
  process.exit(0);
}

main().catch(e => {
  console.error('❌', e.message || e);
  process.exit(1);
});
