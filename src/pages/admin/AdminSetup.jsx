import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, XCircle } from 'lucide-react';
import { AnalyticsEvent, Invite } from '@/api/entities';
import { getNotifyStatus } from '@/lib/notify';
import { Panel } from './components';

const ENV_VARS = [
  ['VITE_FIREBASE_API_KEY', 'Firebase web API key (Project settings → General → Your apps). Public by design; access is controlled by rules. Optional — a default is baked in.'],
  ['VITE_FIREBASE_DATABASE_URL', 'Realtime Database URL, e.g. https://rocket-pricer-default-rtdb.asia-southeast1.firebasedatabase.app. Optional — default baked in.'],
  ['RESEND_API_KEY', 'Resend API key (resend.com → API Keys). Required for the /api email functions.'],
  ['RESEND_FROM', 'Sender, e.g. "Rocket Pricer <notify@rocketpricer.com>". Default: onboarding@resend.dev (works without domain verification, but verify a domain for inbox delivery).'],
  ['NOTIFY_TO', 'Where signup/login alerts go. Default: admin@rocketpricer.com.'],
  ['NOTIFY_SIGNUP_ENABLED', '"false" disables new-signup alerts. Default: enabled.'],
  ['NOTIFY_LOGIN_ENABLED', '"false" disables login alerts. Default: enabled.'],
  ['ADMIN_API_KEY', 'SHA-256 hash of the admin password — protects /api/invite. Defaults to the hash of the bootstrap password; set this when you rotate credentials.'],
];

function CheckRow({ label, ok, detail }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/20 last:border-0">
      {ok ? (
        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
      ) : (
        <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
      )}
      <div>
        <div className="text-sm font-semibold text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{detail}</div>
      </div>
    </div>
  );
}

export default function AdminSetup() {
  const analyticsCheck = useQuery({
    queryKey: ['setup', 'analytics-entity'],
    queryFn: async () => { await AnalyticsEvent.list('-created_date', 1); return true; },
    retry: false,
  });
  const inviteCheck = useQuery({
    queryKey: ['setup', 'invite-entity'],
    queryFn: async () => { await Invite.list('-created_date', 1); return true; },
    retry: false,
  });
  const apiCheck = useQuery({ queryKey: ['setup', 'api'], queryFn: getNotifyStatus, retry: false });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-orbitron text-2xl md:text-3xl font-bold text-foreground">
          Launch <span className="text-accent">Checklist</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          One-time platform configuration. Full instructions live in <code className="text-accent">MIGRATION.md</code> in the repo.
        </p>
      </header>

      <Panel title="System checks">
        <CheckRow
          label="analytics_events (Realtime Database)"
          ok={analyticsCheck.isSuccess}
          detail={
            analyticsCheck.isSuccess
              ? 'Reachable — analytics are being recorded.'
              : 'Not reachable. Publish the database rules, and make sure you are signed in as an admin (/users/{uid}/role = \'admin\') so the rules allow the read.'
          }
        />
        <CheckRow
          label="invites (Realtime Database)"
          ok={inviteCheck.isSuccess}
          detail={inviteCheck.isSuccess ? 'Reachable — invite history is being recorded.' : 'Not reachable. Publish the database rules and sign in as an admin.'}
        />
        <CheckRow
          label="Email API (/api/notify)"
          ok={Boolean(apiCheck.data?.reachable)}
          detail={
            apiCheck.data?.reachable
              ? apiCheck.data.resendConfigured
                ? 'Deployed and Resend is configured.'
                : 'Deployed, but RESEND_API_KEY is missing — emails will not send.'
              : 'Not reachable. Functions only run on the Vercel deployment (npm run dev does not serve /api).'
          }
        />
      </Panel>

      <Panel title="1 · Publish the Realtime Database rules">
        <p className="text-sm text-muted-foreground leading-relaxed">
          In the Firebase console open <b className="text-foreground">Realtime Database</b> → <b className="text-foreground">Rules</b>,
          paste the contents of <code className="text-accent">database.rules.json</code> from the repo, and click
          <b className="text-foreground"> Publish</b>. These rules let any signed-in user record analytics, restrict reads to admins,
          and prevent users from self-promoting to admin. Enable the
          <b className="text-foreground"> Email/Password</b> and <b className="text-foreground">Google</b> sign-in providers under
          Authentication → Sign-in method.
        </p>
      </Panel>

      <Panel title="2 · Configure env vars (Vercel + local)">
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          The Firebase web config is baked into the app, so the <code className="text-accent">VITE_FIREBASE_*</code> vars are optional
          overrides. The Resend vars below are required for transactional email — add them in Vercel → Project → Settings →
          Environment Variables (mirror any <code className="text-accent">VITE_*</code> overrides in <code className="text-accent">.env.local</code>),
          then redeploy. Create a Resend account, verify your sending domain (SPF + DKIM DNS records keep alerts out of spam), and create an API key:
        </p>
        <div className="space-y-2">
          {ENV_VARS.map(([key, desc]) => (
            <div key={key} className="rounded-lg border border-border/30 bg-background/40 px-4 py-2.5">
              <code className="text-xs font-bold text-accent">{key}</code>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="3 · Make the admin account real (required for dashboard data)">
        <p className="text-sm text-muted-foreground leading-relaxed">
          The bootstrap credential unlocks this dashboard UI, but reading analytics requires an admin role at the database level.
          Create <code className="text-accent">admin@rocketpricer.com</code> in Firebase (Authentication → Users → Add user) and sign
          in once so the app creates its <code className="text-accent">/users/&#123;uid&#125;</code> profile. Then in Realtime Database
          set that user's role to admin:
          <code className="block mt-2 p-2 rounded bg-background/60 text-accent text-[11px]">
            /users/&#123;uid&#125;/role = "admin"
          </code>
          (the migration script does this automatically for the admin email). Signing in with that account then grants Mission
          Control and its reads pass the database rules' admin check.
        </p>
      </Panel>
    </div>
  );
}
