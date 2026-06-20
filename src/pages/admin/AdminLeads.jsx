import { useMemo } from 'react';
import { Flame, Mail, Rocket, Ban } from 'lucide-react';
import { useAnalyticsEvents, useBase44Users, deriveAdminData } from '@/lib/admin/useAdminData';
import { Panel, LeadBadge, LoadingPanel, DataErrorNotice, EmptyState, fmtDate } from './components';

// Pre-filled outreach email for following up with a hot lead.
const followUpHref = (u) => {
  const subject = encodeURIComponent('Your Rocket Pricer results — ready to go international?');
  const body = encodeURIComponent(
    `Hi ${u.name?.split(' ')[0] || 'there'},\n\nI saw you've been testing your international pricing on Rocket Pricer. ` +
      `I'd love to walk through your numbers and what a market entry strategy could look like for your brand.\n\n` +
      `Do you have 20 minutes this week?\n\nMike Todd\nTwo Deck Consulting`
  );
  return `mailto:${u.email}?subject=${subject}&body=${body}`;
};

export default function AdminLeads() {
  const { data: events, isLoading, error } = useAnalyticsEvents();
  const { data: base44Users } = useBase44Users();

  const { users } = useMemo(
    () => deriveAdminData(events || [], base44Users),
    [events, base44Users]
  );

  const leads = users.filter((u) => u.leadTier !== 'cold').sort((a, b) => b.leadScore - a.leadScore);

  if (isLoading) return <LoadingPanel />;
  if (error) return <DataErrorNotice error={error} />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-orbitron text-2xl md:text-3xl font-bold text-foreground">
          Hot <span className="text-accent">Leads</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Users showing buying signals — contacted the Chief, validated their pricing, or hit the attempt limit.
        </p>
      </header>

      {leads.length === 0 ? (
        <Panel>
          <EmptyState>
            No qualified leads yet. Users move here when they click a CTA, launch successfully, or exhaust their attempts.
          </EmptyState>
        </Panel>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {leads.map((u) => (
            <Panel key={u.email} className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-foreground truncate">{u.name || u.email}</div>
                  <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                </div>
                <LeadBadge tier={u.leadTier} />
              </div>

              <div className="flex flex-wrap gap-2 text-[11px]">
                {u.ctaClicks > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10 text-accent border border-accent/30">
                    <Mail className="w-3 h-3" /> Contacted Chief ×{u.ctaClicks}
                  </span>
                )}
                {u.launches > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/30">
                    <Rocket className="w-3 h-3" /> Valid pricing model
                  </span>
                )}
                {u.exhausted > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/10 text-red-400 border border-destructive/30">
                    <Ban className="w-3 h-3" /> Exhausted attempts
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted/40 text-muted-foreground border border-border/40">
                  <Flame className="w-3 h-3" /> Score {u.leadScore}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-muted-foreground/70">
                  Last active {fmtDate(u.lastSeen)} · {u.attempts} attempts
                </span>
                <a
                  href={followUpHref(u)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent hover:bg-accent/90 text-primary-foreground text-xs font-bold transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" /> Follow up
                </a>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
