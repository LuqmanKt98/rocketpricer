import { useState, useEffect } from 'react';
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { ref, update } from 'firebase/database';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { auth, db } from '@/api/firebaseClient';
import { refreshAdminSession } from '@/lib/adminAuth';
import { firebaseAuthErrorMessage } from '@/lib/authErrors';
import { Panel } from './components';

function PasswordInput({ value, onChange, placeholder, id }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 pr-10 bg-background/60 border border-border/40 rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all"
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        tabIndex={-1}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

function StatusMsg({ error, success }) {
  if (success) return (
    <div className="flex items-center gap-2 text-green-400 text-sm">
      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
      {success}
    </div>
  );
  if (error) return (
    <p className="text-sm text-destructive">{error}</p>
  );
  return null;
}

export default function AdminProfile() {
  // auth.currentUser may be null on first render while Firebase restores session —
  // subscribe so we re-render once the state is resolved.
  const [user, setUser] = useState(auth.currentUser);
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  const isFirebaseUser = !!user;

  // ── Change email ─────────────────────────────────────────────────────────
  const [emailForm, setEmailForm] = useState({ newEmail: '', currentPassword: '' });
  const [emailState, setEmailState] = useState({ loading: false, error: '', success: '' });

  const handleEmailChange = async (e) => {
    e.preventDefault();
    const { newEmail, currentPassword } = emailForm;
    if (!newEmail || !currentPassword) return;
    setEmailState({ loading: true, error: '', success: '' });
    try {
      // Reauthenticate first (Firebase requires recent sign-in for sensitive ops)
      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, cred);
      await updateEmail(user, newEmail.trim().toLowerCase());
      // Mirror new email into RTDB profile
      await update(ref(db, `users/${user.uid}`), {
        email: newEmail.trim().toLowerCase(),
        updated_date: new Date().toISOString(),
      });
      // Refresh the dashboard session so sidebar shows the new email
      await refreshAdminSession(newEmail.trim().toLowerCase());
      setEmailState({ loading: false, error: '', success: `Email updated to ${newEmail.trim().toLowerCase()}.` });
      setEmailForm({ newEmail: '', currentPassword: '' });
    } catch (err) {
      setEmailState({ loading: false, error: firebaseAuthErrorMessage(err), success: '' });
    }
  };

  // ── Change password ───────────────────────────────────────────────────────
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passState, setPassState] = useState({ loading: false, error: '', success: '' });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passForm;
    if (!currentPassword || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      setPassState({ loading: false, error: 'New passwords do not match.', success: '' });
      return;
    }
    if (newPassword.length < 6) {
      setPassState({ loading: false, error: 'New password must be at least 6 characters.', success: '' });
      return;
    }
    setPassState({ loading: true, error: '', success: '' });
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPassword);
      // Refresh session key so /api/invite X-Admin-Key stays valid
      await refreshAdminSession(null, newPassword);
      setPassState({ loading: false, error: '', success: 'Password updated successfully.' });
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPassState({ loading: false, error: firebaseAuthErrorMessage(err), success: '' });
    }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <header>
        <h1 className="font-orbitron text-2xl md:text-3xl font-bold text-foreground">
          Admin <span className="text-accent">Profile</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Update your Mission Control login credentials.
        </p>
      </header>

      {!isFirebaseUser && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm text-yellow-300">
          You are signed in with the bootstrap credential, not a real Firebase account.
          Sign in at <strong>/signin</strong> with <code>admin@rocketpricer.com</code> to change credentials here.
        </div>
      )}

      {/* Current account info */}
      <Panel title="Current account">
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-border/20">
            <span className="text-muted-foreground">Email</span>
            <span className="text-foreground font-medium">{user?.email ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">Account type</span>
            <span className="text-foreground font-medium">{isFirebaseUser ? 'Firebase' : 'Bootstrap (local)'}</span>
          </div>
        </div>
      </Panel>

      {/* Change email */}
      <Panel title="Change email">
        <form onSubmit={handleEmailChange} className="space-y-3">
          <div>
            <label htmlFor="new-email" className="block text-xs text-muted-foreground mb-1.5">New email</label>
            <input
              id="new-email"
              type="email"
              value={emailForm.newEmail}
              onChange={e => setEmailForm(f => ({ ...f, newEmail: e.target.value }))}
              placeholder="new@example.com"
              disabled={!isFirebaseUser}
              className="w-full px-4 py-2.5 bg-background/60 border border-border/40 rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="email-current-pass" className="block text-xs text-muted-foreground mb-1.5">Current password (to confirm)</label>
            <PasswordInput
              id="email-current-pass"
              value={emailForm.currentPassword}
              onChange={e => setEmailForm(f => ({ ...f, currentPassword: e.target.value }))}
              placeholder="Your current password"
            />
          </div>
          <StatusMsg error={emailState.error} success={emailState.success} />
          <button
            type="submit"
            disabled={!isFirebaseUser || emailState.loading || !emailForm.newEmail || !emailForm.currentPassword}
            className="w-full px-4 py-2.5 bg-accent hover:bg-accent/90 disabled:bg-accent/40 disabled:cursor-not-allowed text-primary-foreground text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2"
          >
            {emailState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Update Email
          </button>
        </form>
      </Panel>

      {/* Change password */}
      <Panel title="Change password">
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div>
            <label htmlFor="pass-current" className="block text-xs text-muted-foreground mb-1.5">Current password</label>
            <PasswordInput
              id="pass-current"
              value={passForm.currentPassword}
              onChange={e => setPassForm(f => ({ ...f, currentPassword: e.target.value }))}
              placeholder="Current password"
            />
          </div>
          <div>
            <label htmlFor="pass-new" className="block text-xs text-muted-foreground mb-1.5">New password</label>
            <PasswordInput
              id="pass-new"
              value={passForm.newPassword}
              onChange={e => setPassForm(f => ({ ...f, newPassword: e.target.value }))}
              placeholder="Min 6 characters"
            />
          </div>
          <div>
            <label htmlFor="pass-confirm" className="block text-xs text-muted-foreground mb-1.5">Confirm new password</label>
            <PasswordInput
              id="pass-confirm"
              value={passForm.confirmPassword}
              onChange={e => setPassForm(f => ({ ...f, confirmPassword: e.target.value }))}
              placeholder="Repeat new password"
            />
          </div>
          <StatusMsg error={passState.error} success={passState.success} />
          <button
            type="submit"
            disabled={!isFirebaseUser || passState.loading || !passForm.currentPassword || !passForm.newPassword || !passForm.confirmPassword}
            className="w-full px-4 py-2.5 bg-accent hover:bg-accent/90 disabled:bg-accent/40 disabled:cursor-not-allowed text-primary-foreground text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2"
          >
            {passState.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Update Password
          </button>
        </form>
      </Panel>
    </div>
  );
}
