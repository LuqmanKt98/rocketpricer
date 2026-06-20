import { useMemo, useState } from 'react';
import { Search, Download, Mail, X } from 'lucide-react';
import { useAnalyticsEvents, useBase44Users, deriveAdminData, exportUsersCsv } from '@/lib/admin/useAdminData';
import { Panel, LeadBadge, LoadingPanel, DataErrorNotice, EmptyState, fmtDate, fmtDateTime } from './components';

export default function AdminUsers() {
  const { data: events, isLoading, error } = useAnalyticsEvents();
  const { data: base44Users } = useBase44Users();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);

  const { users } = useMemo(
    () => deriveAdminData(events || [], base44Users),
    [events, base44Users]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.email?.includes(q) || u.name?.toLowerCase().includes(q)
    );
  }, [users, query]);

  if (isLoading) return <LoadingPanel />;
  if (error) return <DataErrorNotice error={error} />;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-orbitron text-2xl md:text-3xl font-bold text-foreground">
            Crew <span className="text-accent">Roster</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{users.length} registered users</p>
        </div>
        <button
          onClick={() => exportUsersCsv(filtered)}
          disabled={!filtered.length}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent hover:bg-accent/90 disabled:opacity-50 text-primary-foreground text-sm font-bold transition-colors"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </header>

      <Panel>
        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by email or name…"
            className="w-full pl-10 pr-4 py-2.5 bg-card/60 border border-border/40 rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all"
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState>
            {users.length === 0
              ? 'No users tracked yet — signups will appear here.'
              : 'No users match that search.'}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/40">
                  <th className="py-2.5 pr-4 font-semibold">User</th>
                  <th className="py-2.5 pr-4 font-semibold">Joined</th>
                  <th className="py-2.5 pr-4 font-semibold">Last seen</th>
                  <th className="py-2.5 pr-4 font-semibold text-center">Logins</th>
                  <th className="py-2.5 pr-4 font-semibold text-center">Attempts</th>
                  <th className="py-2.5 pr-4 font-semibold text-center">Launched</th>
                  <th className="py-2.5 pr-4 font-semibold text-center">CTA</th>
                  <th className="py-2.5 font-semibold">Lead</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr
                    key={u.email}
                    onClick={() => setSelected(u)}
                    className="border-b border-border/20 hover:bg-card/60 cursor-pointer transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <div className="font-semibold text-foreground">{u.name || '—'}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">{fmtDate(u.firstSeen)}</td>
                    <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">{fmtDate(u.lastSeen)}</td>
                    <td className="py-3 pr-4 text-center">{u.logins}</td>
                    <td className="py-3 pr-4 text-center">{u.attempts}</td>
                    <td className="py-3 pr-4 text-center">{u.launches > 0 ? '✅' : '—'}</td>
                    <td className="py-3 pr-4 text-center">{u.ctaClicks > 0 ? `📨 ${u.ctaClicks}` : '—'}</td>
                    <td className="py-3"><LeadBadge tier={u.leadTier} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {selected && <UserDetail user={selected} events={events || []} onClose={() => setSelected(null)} />}
    </div>
  );
}

function UserDetail({ user, events, onClose }) {
  const timeline = events.filter((e) => e.email?.toLowerCase() === user.email).slice(0, 50);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-accent/30 bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground" aria-label="Close">
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1 mb-4 pr-8">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-orbitron text-lg font-bold text-foreground">{user.name || user.email}</h2>
            <LeadBadge tier={user.leadTier} />
          </div>
          <a
            href={`mailto:${user.email}`}
            className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 font-semibold"
          >
            <Mail className="w-3.5 h-3.5" /> {user.email}
          </a>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            ['Logins', user.logins],
            ['Attempts', user.attempts],
            ['Launches', user.launches],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-border/40 bg-background/60 p-3 text-center">
              <div className="font-orbitron text-xl font-bold text-foreground">{value}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>

        {user.lastAttempt?.prices && (
          <div className="rounded-xl border border-border/40 bg-background/60 p-4 mb-5">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
              Last pricing model tested
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {['Factory', 'Distributor', 'Wholesale', 'SRRP'].map((label, i) => (
                <div key={label}>
                  <div className="text-sm font-bold text-foreground">
                    ${user.lastAttempt.prices[i] ?? '—'}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Activity</div>
        <ul className="space-y-1.5">
          {timeline.map((ev) => (
            <li key={ev.id} className="flex justify-between gap-3 text-xs py-1 border-b border-border/20">
              <span className="text-foreground">
                {ev.event_type.replace(/_/g, ' ')}
                {ev.data?.result ? ` — ${ev.data.result}` : ''}
                {ev.data?.source ? ` (${ev.data.source.replace(/_/g, ' ')})` : ''}
              </span>
              <span className="text-muted-foreground/70 whitespace-nowrap">{fmtDateTime(ev.created_date)}</span>
            </li>
          ))}
          {timeline.length === 0 && <li className="text-xs text-muted-foreground/70">No events for this user.</li>}
        </ul>
      </div>
    </div>
  );
}
