import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  sendEmailVerification,
  getAdditionalUserInfo,
} from 'firebase/auth';
import StarField from '@/components/StarField';
import { useAuth } from '@/lib/AuthContext';
import { auth, googleProvider } from '@/api/firebaseClient';
import { firebaseAuthErrorMessage } from '@/lib/authErrors';
import { track, EVENTS } from '@/lib/tracking';
import { notifyAdmin } from '@/lib/notify';
import { isAdminUser, adminSessionFromUser, localAdminLogin } from '@/lib/adminAuth';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export default function SignInPage() {
  const navigate = useNavigate();
  const { checkUserAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [needsVerify, setNeedsVerify] = useState(false);

  const finishLogin = async (password = null) => {
    const loggedInUser = await checkUserAuth();
    // Admins go straight to Mission Control; their logins aren't tracked.
    if (isAdminUser(loggedInUser)) {
      await adminSessionFromUser(loggedInUser, password);
      navigate('/admin');
      return;
    }
    track(EVENTS.LOGIN, {}, { email: loggedInUser?.email, name: loggedInUser?.full_name });
    notifyAdmin('login', { email: loggedInUser?.email, name: loggedInUser?.full_name });
    navigate('/');
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setNeedsVerify(false);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      await finishLogin(password);
    } catch (err) {
      // The bootstrap admin isn't a Firebase account — check it locally so the
      // dashboard UI is reachable. (Reading dashboard data still needs a real
      // Firebase admin account; see MIGRATION.md.)
      if (await localAdminLogin(email, password)) {
        navigate('/admin');
        return;
      }
      setError(firebaseAuthErrorMessage(err));
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const isNew = getAdditionalUserInfo(result)?.isNewUser;
      const loggedInUser = await checkUserAuth();
      if (isAdminUser(loggedInUser)) {
        await adminSessionFromUser(loggedInUser);
        navigate('/admin');
        return;
      }
      if (isNew) {
        track(EVENTS.SIGNUP, { provider: 'google' }, { email: loggedInUser?.email, name: loggedInUser?.full_name });
        notifyAdmin('signup', { email: loggedInUser?.email, name: loggedInUser?.full_name });
        navigate('/how-it-works');
      } else {
        track(EVENTS.LOGIN, { provider: 'google' }, { email: loggedInUser?.email, name: loggedInUser?.full_name });
        notifyAdmin('login', { email: loggedInUser?.email, name: loggedInUser?.full_name });
        navigate('/');
      }
    } catch (err) {
      setError(firebaseAuthErrorMessage(err));
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError('');
    setInfo('');
    if (!auth.currentUser) {
      setError('Sign in first, then resend the verification email.');
      return;
    }
    setLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setInfo(`Verification email re-sent to ${auth.currentUser.email}.`);
    } catch (err) {
      setError(firebaseAuthErrorMessage(err));
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Enter your email above first, then click "Forgot password".');
      return;
    }
    setError('');
    setInfo('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setInfo(`Password reset link sent to ${email}. Check your inbox.`);
    } catch (err) {
      setError(firebaseAuthErrorMessage(err));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden font-inter flex flex-col items-center justify-center px-6 py-16">
      <StarField />

      {/* Two Deck Logo — top left */}
      <div className="absolute top-4 left-4 z-20">
        <a href="https://twodeck.com/" target="_blank" rel="noopener noreferrer">
          <img
            src="https://media.base44.com/images/public/69c37219f83ff2b34462675d/7ac152773_Two_Deck_Logo_RGB_Reversed.png"
            alt="Two Deck Consulting"
            className="h-14 md:h-24 w-auto"
          />
        </a>
      </div>

      {/* Dearin & Associates Logo — top right */}
      <div className="absolute top-4 right-4 z-20">
        <a href="https://dearinassociates.com/our-team-international-business-consultants/mike/" target="_blank" rel="noopener noreferrer">
          <img
            src="https://media.base44.com/images/public/69c37219f83ff2b34462675d/8ec2678f1_DALogo300dpi.jpg"
            alt="Dearin & Associates"
            className="h-10 md:h-16 w-auto rounded"
          />
        </a>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-6"
        >
          {/* Heading */}
          <div className="space-y-2">
            <h1 className="font-orbitron text-3xl md:text-4xl font-bold text-foreground">
              Mission <span className="text-accent">Control</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              Sign in to test your pricing model
            </p>
          </div>

          {/* Info message */}
          {info && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-sm text-center"
            >
              {info}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSignIn} className="space-y-4">
            {/* Email Input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-card/60 border border-border/40 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all"
              />
            </motion.div>

            {/* Password Input */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-12 bg-card/60 border border-border/40 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </motion.div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="px-4 py-2 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm text-left space-y-2"
              >
                <div>{error}</div>
                {needsVerify && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    className="text-accent hover:underline font-semibold"
                  >
                    Resend verification email
                  </button>
                )}
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-accent hover:bg-accent/90 disabled:bg-accent/60 text-primary-foreground font-bold rounded-xl shadow-lg shadow-accent/30 transition-all duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Launching...
                </>
              ) : (
                <>
                  <span>🚀</span>
                  Launch In
                </>
              )}
            </motion.button>

            {/* Forgot password */}
            <div className="text-right">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs text-muted-foreground hover:text-accent hover:underline transition-colors"
              >
                Forgot password?
              </button>
            </div>
          </form>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="flex items-center gap-3"
          >
            <div className="flex-1 h-px bg-border/30" />
            <span className="text-xs text-muted-foreground/60 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-border/30" />
          </motion.div>

          {/* Google Sign-In Button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full px-6 py-3 bg-white hover:bg-gray-50 disabled:opacity-70 text-gray-700 font-semibold rounded-xl border border-gray-200 shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </motion.button>

          {/* Footer Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="text-sm text-muted-foreground text-center"
          >
            No account?{' '}
            <button
              onClick={() => navigate('/signup')}
              className="text-accent hover:underline font-semibold transition-colors"
            >
              Create one
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="absolute bottom-6 text-center z-10"
      >
        <span className="text-[11px] text-muted-foreground/50">
          Rocket Pricer™ — International Pricing Validation Tool
        </span>
      </motion.div>
    </div>
  );
}
