import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import RocketPricer from './pages/RocketPricer';
import LandingPage from './components/LandingPage';
import HowItWorksPage from './components/HowItWorksPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminLeads from './pages/admin/AdminLeads';
import AdminInvites from './pages/admin/AdminInvites';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminSetup from './pages/admin/AdminSetup';
import AdminProfile from './pages/admin/AdminProfile';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin, isAuthenticated } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
  }

  // Show auth routes when not authenticated (covers both auth_required error and public app config)
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    );
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<RocketPricer />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/signin" element={<Navigate to="/" replace />} />
      <Route path="/signup" element={<Navigate to="/" replace />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            {/* Password reset / recovery landing — always reachable regardless of auth state */}
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            {/* Mission Control — admin dashboard; sign-in happens on the app's /signin page */}
            <Route path="/admin/login" element={<Navigate to="/signin" replace />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="leads" element={<AdminLeads />} />
              <Route path="invites" element={<AdminInvites />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="setup" element={<AdminSetup />} />
              <Route path="profile" element={<AdminProfile />} />
            </Route>
            {/* Everything else flows through the Base44-gated app */}
            <Route path="*" element={<AuthenticatedApp />} />
          </Routes>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App