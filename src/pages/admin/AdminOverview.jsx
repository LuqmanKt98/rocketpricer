import { useMemo } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar,
} from 'recharts';
import { useAnalyticsEvents, useBase44Users, deriveAdminData } from '@/lib/admin/useAdminData';
import { Panel, KpiCard, LoadingPanel, DataErrorNotice, EmptyState, fmtDateTime } from './components';
import { EVENTS } from '@/lib/tracking';

const ORANGE = '#F7931D';
const BLUE = '#6371f0';
const GREEN = '#22c55e';

const tooltipStyle = {
  backgroundColor: '#131F39',
  border: '1px solid rgba(247,147,29,0.3)',
  borderRadius: 10,
  fontSize: 12,
  color: '#f2f2f2',
};

const EVENT_LABELS = {
  [EVENTS.SIGNUP]: { label: 'signed up', icon: '🧑‍🚀' },
  [EVENTS.LOGIN]: { label: 'logged in', icon: '🔑' },
  [EVENTS.LAUNCH_ATTEMPT]: { label: 'attempted a launch', icon: '🚀' },
  [EVENTS.ATTEMPTS_EXHAUSTED]: { label: 'exhausted all attempts', icon: '⛔' },
  [EVENTS.CTA_CLICK]: { label: 'contacted the Chief', icon: '📨' },
  [EVENTS.INVITE_SENT]: { label: 'invite sent', icon: '✉️' },
  [EVENTS.EMAIL_SENT]: { label: 'email delivered', icon: '📤' },
  [EVENTS.EMAIL_FAILED]: { label: 'email failed', icon: '⚠️' },
};

export default function AdminOverview() {
  const { data: events, isLoading, error } = useAnalyticsEvents();
  const { data: base44Users } = useBase44Users();

  const derived = useMemo(
    () => deriveAdminData(events || [], base44Users),
    [events, base44Users]
  );

  if (isLoading) return <LoadingPanel />;
  if (error) return <DataErrorNotice error={error} />;

  const { kpis, series, funnel, stageFailures, recent } = derived;
  const maxFunnel = Math.max(funnel[0]?.value || 0, 1);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-orbitron text-2xl md:text-3xl font-bold text-foreground">
          Mission <span className="text-accent">Overview</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Live telemetry from Rocket Pricer</p>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total users" value={kpis.totalUsers} hint={`+${kpis.newThisWeek} this week`} />
        <KpiCard label="Launch attempts" value={kpis.totalAttempts} hint={`${kpis.totalLaunches} successful`} />
        <KpiCard label="Success rate" value={`${kpis.successRate}%`} hint="valid pricing models" />
        <KpiCard label="CTA clicks" value={kpis.ctaClicks} hint="contacted the Chief" accent />
      </div>

      {/* Activity chart */}
      <Panel title="Activity — last 30 days">
        {kpis.totalUsers === 0 && kpis.totalAttempts === 0 ? (
          <EmptyState>No telemetry yet — events appear here once users start flying.</EmptyState>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="gAttempts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BLUE} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gSignups" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ORANGE} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={ORANGE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={{ fill: '#8b93a7', fontSize: 11 }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fill: '#8b93a7', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="attempts" name="Launch attempts" stroke={BLUE} fill="url(#gAttempts)" strokeWidth={2} />
                <Area type="monotone" dataKey="signups" name="Signups" stroke={ORANGE} fill="url(#gSignups)" strokeWidth={2} />
                <Area type="monotone" dataKey="launches" name="Launches" stroke={GREEN} fill="transparent" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Conversion funnel */}
        <Panel title="Lead funnel">
          <div className="space-y-3">
            {funnel.map((step, i) => (
              <div key={step.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{step.label}</span>
                  <span className="font-bold text-foreground">{step.value}</span>
                </div>
                <div className="h-3 rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max((step.value / maxFunnel) * 100, step.value > 0 ? 4 : 0)}%`,
                      background: i === funnel.length - 1 ? ORANGE : BLUE,
                      opacity: 1 - i * 0.12,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Stage failure distribution */}
        <Panel title="Where pricing models fail">
          {kpis.totalAttempts === 0 ? (
            <EmptyState>No launch attempts recorded yet.</EmptyState>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageFailures} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="stage" tick={{ fill: '#8b93a7', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#8b93a7', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar dataKey="failures" name="Failed margin checks" fill={ORANGE} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground/70 mt-2">
            Counts each stage whose margin was invalid or in the warning zone on a failed attempt.
          </p>
        </Panel>
      </div>

      {/* Recent activity */}
      <Panel title="Recent activity">
        {recent.length === 0 ? (
          <EmptyState>Nothing logged yet.</EmptyState>
        ) : (
          <ul className="divide-y divide-border/30">
            {recent.map((ev) => {
              const spec = EVENT_LABELS[ev.event_type] || { label: ev.event_type, icon: '•' };
              return (
                <li key={ev.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="text-base">{spec.icon}</span>
                  <span className="flex-1 min-w-0 truncate">
                    <span className="font-semibold text-foreground">{ev.email || 'Anonymous'}</span>{' '}
                    <span className="text-muted-foreground">{spec.label}</span>
                    {ev.event_type === EVENTS.LAUNCH_ATTEMPT && ev.data?.result && (
                      <span className={`ml-2 text-[11px] font-bold uppercase ${ev.data.result === 'launched' ? 'text-green-400' : 'text-warning'}`}>
                        {ev.data.result}
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-muted-foreground/60 whitespace-nowrap">{fmtDateTime(ev.created_date)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
