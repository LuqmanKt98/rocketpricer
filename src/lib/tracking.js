// Lightweight product analytics on top of the Base44 `AnalyticsEvent` entity.
// Every call is fire-and-forget: tracking must never break the user experience,
// so failures (entity missing, offline, no auth) are swallowed after one
// console.debug.

import { AnalyticsEvent } from '@/api/entities';

export const EVENTS = {
  SIGNUP: 'signup',
  LOGIN: 'login',
  LAUNCH_ATTEMPT: 'launch_attempt',
  ATTEMPTS_EXHAUSTED: 'attempts_exhausted',
  CTA_CLICK: 'cta_click',
  INVITE_SENT: 'invite_sent',
  EMAIL_SENT: 'email_sent',
  EMAIL_FAILED: 'email_failed',
};

const SESSION_KEY = 'rp_session_id';

let identity = { email: null, name: null };

// Called from AuthContext whenever the authenticated user changes.
export function setTrackingIdentity(user) {
  identity = {
    email: user?.email || null,
    name: user?.full_name || null,
  };
}

export function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return 'unknown';
  }
}

export function track(eventType, data = {}, overrides = {}) {
  const record = {
    event_type: eventType,
    email: overrides.email || identity.email,
    name: overrides.name || identity.name,
    session_id: getSessionId(),
    data,
  };

  try {
    AnalyticsEvent.create(record).catch((err) => {
      console.debug('[tracking] event not recorded:', eventType, err?.message);
    });
  } catch (err) {
    console.debug('[tracking] event not recorded:', eventType, err?.message);
  }
}
