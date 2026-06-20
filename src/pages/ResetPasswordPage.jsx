import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  verifyPasswordResetCode,
  confirmPasswordReset,
  applyActionCode,
} from 'firebase/auth';
import StarField from '@/components/StarField';
import { auth } from '@/api/firebaseClient';
import { firebaseAuthErrorMessage } from '@/lib/authErrors';
import { Loader2, Eye, EyeOff, KeyRound } from 'lucide-react';

// Custom Firebase email-action handler. Set this page as the "action URL" in
// Firebase console → Authentication → Templates (optional — if you don't, the
// default Firebase-hosted pages handle resets/verification just fine). It
// handles both password resets and email verification links:
//   /reset-password?mode=resetPassword&oobCode=...
//   /reset-password?mode=verifyEmail&oobCode=...
// Migrated Base44 users use the password-reset flow to set their first password.
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const mode = params.get('mode');
  const oobCode = params.get('oobCode');

  const [ready, setReady] = useState(false);
  const [validLink, setValidLink] = useState(false);
  const [accountEmail, setAccountEmail] = useState('');
  const [verifiedNotice, setVerifiedNotice] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!oobCode) { setReady(true); return; }
      try {
        if (mode === 'verifyEmail') {
          await applyActionCode(auth, oobCode);
          setVerifiedNotice(true);
          setValidLink(true);
        } else {
          // default to resetPassword
          const email = await verifyPasswordResetCode(auth, oobCode);
          setAccountEmail(email);
          setValidLink(true);
        }
      } catch (err) {
        setError(firebaseAuthErrorMessage(err));
      } finally {
        setReady(true);
      }
    })();
  }, [mode, oobCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setDone(true);
      setTimeout(() => navigate('/signin'), 1800);
    } catch (err) {
      setError(firebaseAuthErrorMessage(err));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden font-inter flex flex-col items-center justify-center px-6 py-16">
      <StarField />

      <div className="relative z-10 max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-6"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/15 mx-auto">
            <KeyRound className="w-8 h-8 text-accent" />
          </div>
          <div className="space-y-2">
            <h1 className="font-orbitron text-3xl md:text-4xl font-bold text-foreground">
              {verifiedNotice ? <>Email <span className="text-accent">Verified</span></> : <>Set Your <span className="text-accent">Password</span></>}
            </h1>
            {accountEmail && !done && !verifiedNotice && (
              <p className="text-muted-foreground text-sm">
                for <span className="text-foreground font-semibold">{accountEmail}</span>
              </p>
            )}
          </div>

          {!ready ? (
            <Loader2 className="w-6 h-6 animate-spin text-accent mx-auto" />
          ) : verifiedNotice ? (
            <div className="space-y-4">
              <div className="px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-sm">
                Your email is confirmed. You can sign in now.
              </div>
              <button onClick={() => navigate('/signin')} className="text-accent hover:underline font-semibold text-sm">
                Go to sign in
              </button>
            </div>
          ) : done ? (
            <div className="px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-sm">
              Password updated! Taking you to sign in…
            </div>
          ) : !validLink ? (
            <div className="space-y-4">
              <div className="px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                {error || 'This link is invalid or has expired. Request a new one from the sign-in page.'}
              </div>
              <button onClick={() => navigate('/signin')} className="text-accent hover:underline font-semibold text-sm">
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 pr-12 bg-card/60 border border-border/40 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-card/60 border border-border/40 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all"
              />

              {error && (
                <div className="px-4 py-2 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-accent hover:bg-accent/90 disabled:bg-accent/60 text-primary-foreground font-bold rounded-xl shadow-lg shadow-accent/30 transition-all duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>🚀</span>}
                {loading ? 'Saving…' : 'Save password'}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
