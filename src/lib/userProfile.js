import { db } from '@/api/firebaseClient';
import { ref, get, set, update } from 'firebase/database';

// Mirrors a Firebase Auth user into /users/{uid} so the admin dashboard can
// read a roster and so we have a place to store role / full_name. Firebase Auth
// itself can only be listed server-side (Admin SDK), hence this mirror.
//
// IMPORTANT: role is only ever written as 'user' here. Admins are promoted
// out-of-band (the migration script via the Admin SDK, or by editing
// /users/{uid}/role in the Firebase console) — the Realtime Database rules
// forbid a user from self-elevating to admin. Merges never clobber an existing
// role or created_date.
export async function ensureUserProfile(user, extra = {}) {
  if (!user) return null;
  const uref = ref(db, `users/${user.uid}`);
  const now = new Date().toISOString();

  let existing = null;
  try {
    const snap = await get(uref);
    existing = snap.exists() ? snap.val() : null;
  } catch {
    // read denied / offline — fall through and return a best-effort shape
  }

  const merged = {
    email: user.email || null,
    full_name: extra.full_name || existing?.full_name || user.displayName || null,
    is_verified: !!user.emailVerified,
    updated_date: now,
  };

  try {
    if (!existing) {
      const created = { ...merged, role: 'user', disabled: false, created_date: now };
      await set(uref, created);
      return created;
    }
    await update(uref, merged); // does not touch role / created_date
    return { ...existing, ...merged };
  } catch {
    // write denied — return what we know so auth still works
    return existing ? { ...existing, ...merged } : { ...merged, role: 'user' };
  }
}
