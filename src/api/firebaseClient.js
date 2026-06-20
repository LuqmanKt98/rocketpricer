import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Firebase is the backend: Authentication (email/password + Google) and the
// Realtime Database. The web config below is public by design (the API key is
// not a secret — access is controlled by Auth + Database security rules).
// Values can be overridden via VITE_FIREBASE_* env vars if you ever rotate the
// project.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDpx0czntBF5LxdDHXiqMPnrXq3SAJVDoY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'rocket-pricer.firebaseapp.com',
  databaseURL:
    import.meta.env.VITE_FIREBASE_DATABASE_URL ||
    'https://rocket-pricer-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'rocket-pricer',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'rocket-pricer.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '750982782101',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:750982782101:web:6df795370cf5a2d4c0cf9c',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-8QC0WG1GRE',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

// Google sign-in provider (Google Auth is enabled on the project).
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
