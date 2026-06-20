import { db } from './firebaseClient';
import {
  ref,
  query,
  orderByChild,
  limitToLast,
  equalTo,
  get,
  push,
  set,
} from 'firebase/database';

// Thin adapter that preserves the Base44 entity API the app already uses —
// `.list(order, limit)`, `.create(record)`, `.filter(criteria, order, limit)` —
// but backed by Firebase Realtime Database nodes. Keeping the same shape means
// the consumers (tracking.js, useAdminData.js, AdminInvites, AdminSetup) needed
// no changes beyond their imports.
//
// Records are stored under /<node>/<pushId>. We expose each record as
// { id: <pushId>, ...value } so existing code that reads `record.id` keeps
// working. Ordering uses the Base44 convention: a leading "-" means descending,
// e.g. list('-created_date', 100). created_date is an ISO string, which sorts
// chronologically under orderByChild.

function snapshotToArray(snap) {
  const rows = [];
  snap.forEach((child) => {
    rows.push({ id: child.key, ...child.val() });
  });
  return rows;
}

function makeEntity(node) {
  return {
    async list(order = '-created_date', limit = 1000) {
      const descending = typeof order === 'string' && order.startsWith('-');
      const column = descending ? order.slice(1) : order;
      // RTDB returns ascending; limitToLast + reverse gives newest-first.
      const snap = await get(query(ref(db, node), orderByChild(column), limitToLast(limit)));
      const rows = snapshotToArray(snap);
      return descending ? rows.reverse() : rows;
    },

    async filter(criteria = {}, order = '-created_date', limit = 1000) {
      const entries = Object.entries(criteria);
      // RTDB can filter on a single child server-side; do that one, filter the rest in memory.
      let snap;
      if (entries.length) {
        const [key, value] = entries[0];
        snap = await get(query(ref(db, node), orderByChild(key), equalTo(value), limitToLast(limit)));
      } else {
        snap = await get(query(ref(db, node), orderByChild(order.replace(/^-/, '')), limitToLast(limit)));
      }
      let rows = snapshotToArray(snap);
      for (const [key, value] of entries.slice(1)) {
        rows = rows.filter((r) => r[key] === value);
      }
      const descending = typeof order === 'string' && order.startsWith('-');
      return descending ? rows.reverse() : rows;
    },

    async create(record) {
      const payload = {
        ...record,
        created_date: record.created_date || new Date().toISOString(),
      };
      const newRef = push(ref(db, node));
      await set(newRef, payload);
      return { id: newRef.key, ...payload };
    },
  };
}

export const AnalyticsEvent = makeEntity('analytics_events');
export const Invite = makeEntity('invites');

// The user roster — backed by /users (mirror written on sign-up/sign-in). Only
// an admin can read the whole node (Realtime Database rules); non-admins get a
// permission error, which useBase44Users() swallows into null.
export const User = makeEntity('users');
