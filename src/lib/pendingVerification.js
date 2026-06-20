const STORAGE_KEY = 'rocketpricer_pending_verification_email';

export function setPendingVerificationEmail(email) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    if (email) {
      window.localStorage.setItem(STORAGE_KEY, email);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export function getPendingVerificationEmail() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearPendingVerificationEmail() {
  setPendingVerificationEmail(null);
}

// Heuristic: does this error indicate the user's email is unverified / pending OTP?
export function isUnverifiedEmailError(err) {
  if (!err) return false;
  const message = (err.message || '').toLowerCase();
  const detail = (err.data?.detail || err.data?.message || err.response?.data?.detail || '').toLowerCase();
  const haystack = `${message} ${detail}`;
  return (
    haystack.includes('verif') ||
    haystack.includes('not activated') ||
    haystack.includes('pending') ||
    haystack.includes('otp')
  );
}

// Heuristic: does this register error mean the account already exists?
export function isAlreadyRegisteredError(err) {
  if (!err) return false;
  const message = (err.message || '').toLowerCase();
  const detail = (err.data?.detail || err.data?.message || err.response?.data?.detail || '').toLowerCase();
  const status = err.status || err.response?.status;
  const haystack = `${message} ${detail}`;
  return (
    status === 409 ||
    haystack.includes('already exists') ||
    haystack.includes('already registered') ||
    haystack.includes('email exists') ||
    haystack.includes('duplicate')
  );
}
