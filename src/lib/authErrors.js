// Maps Firebase Auth error codes to friendly, user-facing messages.
const MESSAGES = {
  'auth/invalid-email': 'That email address looks invalid.',
  'auth/user-disabled': 'This account has been disabled. Contact the administrator.',
  'auth/user-not-found': 'No account found with that email. Create one instead.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/invalid-login-credentials': 'Incorrect email or password.',
  'auth/email-already-in-use': 'An account with that email already exists. Try signing in.',
  'auth/weak-password': 'Password is too weak — use at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
  'auth/cancelled-popup-request': 'Google sign-in was cancelled.',
  'auth/popup-blocked': 'Your browser blocked the Google sign-in popup. Allow popups and retry.',
  'auth/account-exists-with-different-credential':
    'An account already exists with this email using a different sign-in method.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/expired-action-code': 'This link has expired. Request a new one.',
  'auth/invalid-action-code': 'This link is invalid or has already been used.',
};

export function firebaseAuthErrorMessage(err) {
  if (!err) return 'Something went wrong. Please try again.';
  const code = err.code || '';
  return MESSAGES[code] || err.message?.replace(/^Firebase:\s*/, '') || 'Something went wrong. Please try again.';
}
