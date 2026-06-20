import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Send, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Invite } from '@/api/entities';
import { useAnalyticsEvents, useInvites } from '@/lib/admin/useAdminData';
import { sendInviteEmail } from '@/lib/notify';
import { track, EVENTS } from '@/lib/tracking';
import { getAdminSession } from '@/lib/adminAuth';
import { Panel, LoadingPanel, DataErrorNotice, EmptyState, fmtDate } from './components';

export default function AdminInvites() {
  const queryClient = useQueryClient();
  const { data: invites, isLoading, error } = useInvites();
  const { data: events } = useAnalyticsEvents();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null); // { ok, text }

  // an invite counts as accepted once that email signs up
  const signupEmails = useMemo(
    () => new Set((events || []).filter((e) => e.event_type === EVENTS.SIGNUP && e.email).map((e) => e.email.toLowerCase())),
    [events]
  );

  const handleInvite = async (e) => {
    e.preventDefault();
    setSending(true);
    setFeedback(null);
    const target = email.trim().toLowerCase();
    const session = getAdminSession();

    // 1. Send the branded Resend email — this is the part the user sees.
    const result = await sendInviteEmail({ email: target, name, message, adminKey: session?.key });

    // 2. Record the invite (best effort — entity may not exist yet).
    let recorded = true;
    try {
      await Invite.create({
        email: target,
        name: name || null,
        message: message || null,
        status: result.ok ? 'sent' : 'failed',
        invited_by: session?.email || 'admin',
      });
    } catch {
      recorded = false;
    }

    // The invitee creates their own Supabase account via the signup link in the
    // email (no platform-side pre-registration needed).

    if (result.ok) {
      track(EVENTS.INVITE_SENT, { invited: target }, { email: session?.email });
      setFeedback({
        ok: true,
        text: `Invite sent to ${target}.${recorded ? '' : ' (Not logged — Invite entity missing, see Setup.)'}`,
      });
      setEmail('');
      setName('');
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'invites'] });
    } else {
      setFeedback({ ok: false, text: `Email failed: ${result.error}` });
    }
    setSending(false);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-orbitron text-2xl md:text-3xl font-bold text-foreground">
          Crew <span className="text-accent">Invites</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Invite new users by email — sent via Resend with a branded template.</p>
      </header>

      <Panel title="Send an invite">
        <form onSubmit={handleInvite} className="space-y-3 max-w-xl">
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              type="email"
              required
              placeholder="Email address *"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-card/60 border border-border/40 rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all"
            />
            <input
              type="text"
              placeholder="Name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-card/60 border border-border/40 rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all"
            />
          </div>
          <textarea
            placeholder="Personal note to include in the email (optional)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            maxLength={500}
            className="w-full px-4 py-2.5 bg-card/60 border border-border/40 rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all resize-none"
          />

          {feedback && (
            <div
              className={`px-4 py-2 rounded-lg text-sm border ${
                feedback.ok
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-destructive/10 border-destructive/30 text-destructive'
              }`}
            >
              {feedback.text}
            </div>
          )}

          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent hover:bg-accent/90 disabled:opacity-60 text-primary-foreground text-sm font-bold transition-colors"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? 'Sending…' : 'Send invite'}
          </button>
        </form>
      </Panel>

      <Panel title="Invite history">
        {isLoading ? (
          <LoadingPanel label="Loading invites…" />
        ) : error ? (
          <DataErrorNotice error={error} entityName="Invite" />
        ) : !invites?.length ? (
          <EmptyState>No invites sent yet.</EmptyState>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/40">
                  <th className="py-2.5 pr-4 font-semibold">Invitee</th>
                  <th className="py-2.5 pr-4 font-semibold">Sent</th>
                  <th className="py-2.5 pr-4 font-semibold">By</th>
                  <th className="py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((inv) => {
                  const accepted = signupEmails.has((inv.email || '').toLowerCase());
                  return (
                    <tr key={inv.id} className="border-b border-border/20">
                      <td className="py-3 pr-4">
                        <div className="font-semibold text-foreground">{inv.name || '—'}</div>
                        <div className="text-xs text-muted-foreground">{inv.email}</div>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">{fmtDate(inv.created_date)}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{inv.invited_by || '—'}</td>
                      <td className="py-3">
                        {accepted ? (
                          <span className="inline-flex items-center gap-1.5 text-green-400 text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
                          </span>
                        ) : inv.status === 'failed' ? (
                          <span className="inline-flex items-center gap-1.5 text-destructive text-xs font-bold">
                            <XCircle className="w-3.5 h-3.5" /> Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-warning text-xs font-bold">
                            <Clock className="w-3.5 h-3.5" /> Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
