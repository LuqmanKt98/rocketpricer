import React, { createContext, useState, useContext, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/api/firebaseClient';
import { ensureUserProfile } from '@/lib/userProfile';
import { setTrackingIdentity } from '@/lib/tracking';

const AuthContext = createContext();

// Build the app-facing user from a Firebase user + its /users profile row.
// Flattens full_name / role so existing consumers (isAdminUser, the user pill,
// useAdminData) keep reading user.full_name and user.role unchanged.
function normalizeUser(fbUser, profile) {
  if (!fbUser) return null;
  return {
    id: fbUser.uid,
    email: fbUser.email,
    full_name: profile?.full_name || fbUser.displayName || null,
    role: profile?.role || 'user',
    is_verified: !!fbUser.emailVerified,
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  // Retained for API compatibility with the old Base44 flow — Firebase has no
  // separate "public settings" step, so this is always resolved.
  const [isLoadingPublicSettings] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings] = useState(null);

  const applyAuthUser = async (fbUser) => {
    if (!fbUser) {
      setUser(null);
      setIsAuthenticated(false);
      setTrackingIdentity(null);
      return null;
    }
    const profile = await ensureUserProfile(fbUser);
    const normalized = normalizeUser(fbUser, profile);
    setUser(normalized);
    setIsAuthenticated(true);
    setTrackingIdentity(normalized);
    return normalized;
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      await applyAuthUser(fbUser);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    });
    return () => unsub();
  }, []);

  // Re-read the current user (used right after a login attempt). Returns the
  // normalized user, or throws if there is no session.
  const checkUserAuth = async () => {
    setIsLoadingAuth(true);
    try {
      const fbUser = auth.currentUser;
      if (!fbUser) throw new Error('Not authenticated');
      const normalized = await applyAuthUser(fbUser);
      setAuthError(null);
      return normalized;
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  // Kept for compatibility with code that called it on the old flow.
  const checkAppState = async () => {
    try {
      await checkUserAuth();
    } catch {
      /* not signed in — fine */
    }
  };

  const logout = async (shouldRedirect = true) => {
    await signOut(auth);
    setUser(null);
    setIsAuthenticated(false);
    setTrackingIdentity(null);
    if (shouldRedirect) {
      window.location.href = '/';
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/signin';
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authChecked,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState,
      checkUserAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
