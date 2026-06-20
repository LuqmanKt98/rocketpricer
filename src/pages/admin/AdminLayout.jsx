import { useEffect, useState } from 'react';
import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Flame, MailPlus, BellRing, Wrench, LogOut, Rocket, ExternalLink, Loader2, UserCog,
} from 'lucide-react';
import StarField from '@/components/StarField';
import { useAuth } from '@/lib/AuthContext';
import { getAdminSession, adminLogout, adminSessionFromUser, isAdminUser } from '@/lib/adminAuth';

const NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/leads', label: 'Hot Leads', icon: Flame },
  { to: '/admin/invites', label: 'Invites', icon: MailPlus },
  { to: '/admin/notifications', label: 'Notifications', icon: BellRing },
  { to: '/admin/setup', label: 'Setup', icon: Wrench },
  { to: '/admin/profile', label: 'Profile', icon: UserCog },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, isLoadingAuth, logout } = useAuth();
  const [session, setSession] = useState(getAdminSession);

  // An app-authenticated admin gets a dashboard session without re-entering
  // credentials (e.g. deep-linking to /admin while signed in).
  useEffect(() => {
    if (!session && isAdminUser(user)) {
      adminSessionFromUser(user).then((granted) => granted && setSession(granted));
    }
  }, [session, user]);

  if (!session) {
    // Wait for the auth check (or the pending auto-grant) before bouncing to /signin.
    if (isLoadingAuth || isAdminUser(user)) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      );
    }
    return <Navigate to="/signin" replace />;
  }

  const handleLogout = () => {
    adminLogout();
    setSession(null);
    if (session.mode === 'firebase') logout(false); // also clear the app session
    navigate('/signin');
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
      isActive
        ? 'bg-accent/15 text-accent'
        : 'text-muted-foreground hover:text-foreground hover:bg-card/80'
    }`;

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden font-inter">
      <StarField />

      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar — desktop */}
        <aside className="hidden md:flex w-60 flex-col border-r border-border/40 bg-card/30 backdrop-blur-sm p-4 sticky top-0 h-screen">
          <div className="flex items-center gap-2.5 px-2 py-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-accent/15 flex items-center justify-center">
              <Rocket className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="font-orbitron text-sm font-bold text-foreground tracking-wide leading-tight">
                MISSION<br />CONTROL
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={linkClass}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="space-y-1 pt-3 border-t border-border/40">
            <div className="px-3 py-1 text-[11px] text-muted-foreground/70 truncate" title={session.email}>
              {session.email}
            </div>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-card/80 transition-colors"
            >
              <ExternalLink className="w-4 h-4" /> View app
            </a>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Log out
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Mobile header */}
          <div className="md:hidden sticky top-0 z-20 border-b border-border/40 bg-background/90 backdrop-blur-sm">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-accent" />
                <span className="font-orbitron text-sm font-bold tracking-wide">MISSION CONTROL</span>
              </div>
              <button onClick={handleLogout} title="Log out" className="text-muted-foreground hover:text-destructive">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex gap-1 px-3 pb-2 overflow-x-auto">
              {NAV.map(({ to, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                      isActive ? 'bg-accent/15 text-accent' : 'text-muted-foreground hover:text-foreground'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>

          <main className="p-4 md:p-8 max-w-6xl mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
