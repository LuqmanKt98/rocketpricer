import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { getNotifyStatus } from '@/lib/notify';
import { useAnalyticsEvents } from '@/lib/admin/useAdminData';
import { EVENTS } from '@/lib/tracking';
import { Panel, LoadingPanel, EmptyState, fmtDateTime } from './components';

function StatusRow({ label, ok, okText = 'Active', failText = 'Off', detail }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/20 last:border-0 gap-4">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-foreground">{label}</div>
        {detail && <div className="text-xs text-muted-foreground mt-0.5">{detail}</div>}
      </div>
      {ok ? (
        <span className="inline-flex items-center gap-1.5 text-green-400 text-xs font-bold whitespace-nowrap">
          <CheckCircle2 className="w-4 h-4" /> {okText}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-destructive text-xs font-bold whitespace-nowrap">
          <XCircle className="w-4 h-4" /> {failText}
        </span>
      )}
    </div>
  );
}

export default function AdminNotifications() {
  const { data: status, isLoading } = useQuery({
    queryKey: ['admin', 'notify-status'],
    queryFn: getNotifyStatus,
    staleTime: 60_000,
    retry: false,
  });
  const { data: events } = useAnalyticsEvents();

  const emailLog = useMemo(
    () => (events || []).filter((e) => e.event_type === EVENTS.EMAIL_SENT || e.event_type === EVENTS.EMAIL_FAILED).slice(0, 50),
    [events]
  );

  if (isLoading) return <LoadingPanel label="Checking email systems…" />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-orbitron text-2xl md:text-3xl font-bold text-foreground">
          Email <span className="text-accent">Notifications</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Transactional alerts sent through Resend. Configuration lives in Vercel environment variables.
        </p>
      </header>

      <Panel title="System status">
        {!status?.reachable ? (
          <div className="flex items-start gap-3 text-sm text-muted-foreground py-2">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <p>
              The <code className="text-accent">/api/notify</code> endpoint isn't reachable. Serverless functions only run
              on the Vercel deployment (or <code className="text-accent">vercel dev</code> locally) — they're not served by{' '}
              <code className="text-accent">npm run dev</code>.
            </p>
          </div>
        ) : (
          <div>
            <StatusRow
              label="Resend API key"
              ok={status.resendConfigured}
              okText="Configured"
              failText="Missing"
              detail={status.resendConfigured ? `Sending as: ${status.from}` : 'Set RESEND_API_KEY in Vercel → Project → Settings → Environment Variables'}
            />
            <StatusRow
              label="New signup alerts"
              ok={status.signupAlerts}
              detail={`Delivered to ${status.notifyTo} · toggle with NOTIFY_SIGNUP_ENABLED`}
            />
            <StatusRow
              label="Login alerts"
              ok={status.loginAlerts}
              detail="Deduplicated to one alert per user per 12h · toggle with NOTIFY_LOGIN_ENABLED"
            />
          </div>
        )}
      </Panel>

      <Panel title="Email log">
        {emailLog.length === 0 ? (
          <EmptyState>No emails logged yet. Signup/login alerts and invites will appear here.</EmptyState>
        ) : (
          <ul className="divide-y divide-border/20">
            {emailLog.map((ev) => (
              <li key={ev.id} className="flex items-center gap-3 py-2.5 text-sm">
                {ev.event_type === EVENTS.EMAIL_SENT ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                )}
                <span className="flex-1 min-w-0 truncate">
                  <span className="font-semibold text-foreground">{ev.data?.email_type || 'email'}</span>
                  <span className="text-muted-foreground"> · {ev.email || 'unknown user'}</span>
                  {ev.data?.reason && <span className="text-destructive text-xs"> — {ev.data.reason}</span>}
                </span>
                <span className="text-[11px] text-muted-foreground/60 whitespace-nowrap">{fmtDateTime(ev.created_date)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
