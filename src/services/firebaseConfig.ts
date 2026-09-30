import { initializeApp, FirebaseApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// Check if valid production Firebase API key is configured
const isPlaceholderKey = (key: string): boolean => {
  if (!key) return true;
  const k = key.trim().toLowerCase();
  return (
    k.length < 30 ||
    k.includes('your') ||
    k.includes('placeholder') ||
    k.includes('clientapi') ||
    k.includes('example') ||
    k.includes('fake') ||
    k.includes('undefined') ||
    k === 'aizasyyourclientapikey'
  );
};

const hasValidApiKey = Boolean(
  firebaseConfig.apiKey &&
  !isPlaceholderKey(firebaseConfig.apiKey)
);

export const isFirebaseConfigured = Boolean(
  hasValidApiKey &&
  firebaseConfig.projectId &&
  !firebaseConfig.projectId.includes('placeholder') &&
  !firebaseConfig.projectId.includes('example')
);

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    appInstance = getApps().length ? getApp() : initializeApp(firebaseConfig);
    authInstance = getAuth(appInstance);
    dbInstance = getFirestore(appInstance);
  } catch {
    // If initialization fails due to credentials, fallback safely to local storage mode
    appInstance = null;
    authInstance = null;
    dbInstance = null;
  }
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;
