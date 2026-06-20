// Shared building blocks for the Mission Control admin UI.
// Visual idiom matches the app: bg-card/40 + border-border/40 + backdrop-blur,
// Orbitron uppercase section headers, orange accent.

import { Loader2, AlertTriangle, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { isMissingEntityError } from '@/lib/admin/useAdminData';

export function Panel({ title = null, action = null, children, className = '' }) {
  return (
    <div className={`rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm p-5 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4 gap-3">
          {title && (
            <h2 className="font-orbitron text-xs font-bold text-muted-foreground tracking-widest uppercase">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function KpiCard({ label, value, hint, accent = false }) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm p-4">
      <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</div>
      <div className={`font-orbitron text-2xl md:text-3xl font-bold mt-1.5 ${accent ? 'text-accent' : 'text-foreground'}`}>
        {value}
      </div>
      {hint && <div className="text-[11px] text-muted-foreground/70 mt-1">{hint}</div>}
    </div>
  );
}

const TIER_STYLES = {
  hot: 'bg-accent/15 text-accent border-accent/40',
  warm: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  cold: 'bg-secondary/20 text-blue-300 border-secondary/40',
};

export function LeadBadge({ tier }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${TIER_STYLES[tier] || TIER_STYLES.cold}`}>
      {tier === 'hot' ? '🔥 hot' : tier}
    </span>
  );
}

export function LoadingPanel({ label = 'Loading telemetry…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin text-accent" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

// Shown when the AnalyticsEvent / Invite entities aren't reachable yet —
// points the operator at the Setup page instead of rendering a broken screen.
export function DataErrorNotice({ error, entityName = 'AnalyticsEvent' }) {
  const missing = isMissingEntityError(error);
  return (
    <div className="rounded-xl border border-warning/30 bg-warning/5 p-6 flex flex-col items-start gap-3">
      <div className="flex items-center gap-2 text-warning">
        <AlertTriangle className="w-5 h-5" />
        <span className="font-orbitron text-sm font-bold tracking-wide">
          {missing ? `${entityName} entity not found` : `Couldn't load ${entityName} data`}
        </span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
        {missing
          ? `The "${entityName}" entity hasn't been created in the Base44 app yet (or this session lacks permission to read it). Analytics will start flowing as soon as it exists.`
          : error?.message || 'Unknown error.'}
      </p>
      <Link
        to="/admin/setup"
        className="inline-flex items-center gap-2 text-xs font-bold text-accent hover:text-accent/80 transition-colors"
      >
        <Wrench className="w-3.5 h-3.5" /> Open the Setup checklist →
      </Link>
    </div>
  );
}

export function EmptyState({ children }) {
  return (
    <div className="py-12 text-center text-sm text-muted-foreground/70">{children}</div>
  );
}

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
