import { useQuery } from '@tanstack/react-query';
import { AnalyticsEvent, Invite, User } from '@/api/entities';
import { EVENTS } from '@/lib/tracking';

export function isMissingEntityError(err) {
  const msg = `${err?.message || ''} ${err?.data?.detail || ''}`.toLowerCase();
  return err?.status === 404 || msg.includes('not found') || msg.includes('does not exist');
}

export function useAnalyticsEvents() {
  return useQuery({
    queryKey: ['admin', 'events'],
    queryFn: () => AnalyticsEvent.list('-created_date', 5000),
    retry: false,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

export function useInvites() {
  return useQuery({
    queryKey: ['admin', 'invites'],
    queryFn: () => Invite.list('-created_date', 1000),
    retry: false,
    staleTime: 60_000,
  });
}

// Base44's built-in User entity is only listable with an admin-role token.
// Treat failure as "not available" rather than an error.
export function useBase44Users() {
  return useQuery({
    queryKey: ['admin', 'base44-users'],
    queryFn: async () => {
      try {
        return await User.list('-created_date', 1000);
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 300_000,
  });
}

const DAY = 24 * 3600 * 1000;
const dayKey = (d) => new Date(d).toISOString().slice(0, 10);

// Turns the raw event stream (+ optional Base44 user list) into everything the
// dashboard renders: per-user profiles, KPIs, time series, funnel, lead scores.
export function deriveAdminData(events = [], base44Users = null) {
  const users = new Map();

  const ensure = (email, name) => {
    const key = (email || 'anonymous').toLowerCase();
    if (!users.has(key)) {
      users.set(key, {
        email: key === 'anonymous' ? null : key,
        name: name || null,
        firstSeen: null,
        lastSeen: null,
        signups: 0,
        logins: 0,
        attempts: 0,
        launches: 0,
        ctaClicks: 0,
        exhausted: 0,
        lastAttempt: null,
        role: null,
        verified: null,
        disabled: null,
      });
    }
    const u = users.get(key);
    if (name && !u.name) u.name = name;
    return u;
  };

  // events arrive newest-first; walk oldest-first for first/last seen
  const ordered = [...events].reverse();
  for (const ev of ordered) {
    const u = ensure(ev.email, ev.name);
    const ts = ev.created_date;
    if (!u.firstSeen) u.firstSeen = ts;
    u.lastSeen = ts;
    switch (ev.event_type) {
      case EVENTS.SIGNUP: u.signups += 1; break;
      case EVENTS.LOGIN: u.logins += 1; break;
      case EVENTS.LAUNCH_ATTEMPT:
        u.attempts += 1;
        u.lastAttempt = ev.data || null;
        if (ev.data?.result === 'launched') u.launches += 1;
        break;
      case EVENTS.ATTEMPTS_EXHAUSTED: u.exhausted += 1; break;
      case EVENTS.CTA_CLICK: u.ctaClicks += 1; break;
      default: break;
    }
  }

  if (Array.isArray(base44Users)) {
    for (const bu of base44Users) {
      if (bu.is_service) continue;
      const u = ensure(bu.email, bu.full_name);
      u.role = bu.role || u.role;
      u.verified = bu.is_verified ?? u.verified;
      u.disabled = bu.disabled ?? u.disabled;
      if (!u.firstSeen) u.firstSeen = bu.created_date;
      if (!u.lastSeen) u.lastSeen = bu.updated_date || bu.created_date;
    }
  }

  const userList = [...users.values()]
    .filter((u) => u.email)
    .map((u) => ({ ...u, leadScore: leadScore(u), leadTier: leadTier(leadScore(u)) }))
    .sort((a, b) => new Date(b.lastSeen || 0).getTime() - new Date(a.lastSeen || 0).getTime());

  const now = Date.now();
  const weekAgo = now - 7 * DAY;
  const attempts = events.filter((e) => e.event_type === EVENTS.LAUNCH_ATTEMPT);
  const launches = attempts.filter((e) => e.data?.result === 'launched');

  const kpis = {
    totalUsers: userList.length,
    newThisWeek: userList.filter((u) => u.firstSeen && new Date(u.firstSeen).getTime() > weekAgo).length,
    activeThisWeek: userList.filter((u) => u.lastSeen && new Date(u.lastSeen).getTime() > weekAgo).length,
    totalAttempts: attempts.length,
    totalLaunches: launches.length,
    successRate: attempts.length ? Math.round((launches.length / attempts.length) * 100) : 0,
    ctaClicks: events.filter((e) => e.event_type === EVENTS.CTA_CLICK).length,
  };

  // last 30 days, oldest → newest
  const series = [];
  for (let i = 29; i >= 0; i--) {
    const key = dayKey(now - i * DAY);
    series.push({ date: key.slice(5), signups: 0, attempts: 0, launches: 0 });
  }
  const byDay = new Map(series.map((row) => [row.date, row]));
  for (const ev of events) {
    const row = byDay.get(dayKey(ev.created_date).slice(5));
    if (!row) continue;
    if (ev.event_type === EVENTS.SIGNUP) row.signups += 1;
    if (ev.event_type === EVENTS.LAUNCH_ATTEMPT) {
      row.attempts += 1;
      if (ev.data?.result === 'launched') row.launches += 1;
    }
  }

  const funnel = [
    { label: 'Signed up', value: userList.length },
    { label: 'Attempted launch', value: userList.filter((u) => u.attempts > 0).length },
    { label: 'Launched (valid pricing)', value: userList.filter((u) => u.launches > 0).length },
    { label: 'Contacted the Chief', value: userList.filter((u) => u.ctaClicks > 0).length },
  ];

  // which stage blocks failed attempts most often
  const stageFailures = [1, 2, 3, 4].map((n) => ({ stage: `Stage ${n}`, failures: 0 }));
  for (const ev of attempts) {
    if (ev.data?.result === 'launched') continue;
    (ev.data?.stages || []).forEach((s, i) => {
      if (s === 'invalid' || s === 'warning') stageFailures[i].failures += 1;
    });
  }

  return { users: userList, kpis, series, funnel, stageFailures, recent: events.slice(0, 12) };
}

function leadScore(u) {
  return (
    Math.min(u.ctaClicks, 3) * 40 +
    (u.launches > 0 ? 25 : 0) +
    (u.exhausted > 0 ? 20 : 0) +
    Math.min(u.logins, 5) * 3 +
    Math.min(u.attempts, 10)
  );
}

function leadTier(score) {
  if (score >= 40) return 'hot';
  if (score >= 15) return 'warm';
  return 'cold';
}

export function exportUsersCsv(users) {
  const cols = ['email', 'name', 'firstSeen', 'lastSeen', 'logins', 'attempts', 'launches', 'ctaClicks', 'leadTier'];
  const header = ['Email', 'Name', 'First seen', 'Last seen', 'Logins', 'Attempts', 'Launches', 'CTA clicks', 'Lead tier'];
  const cell = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [header.join(','), ...users.map((u) => cols.map((c) => cell(u[c])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rocketpricer-users-${dayKey(Date.now())}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
