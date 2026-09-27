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
const hasValidApiKey = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey.trim().length >= 20 &&
  !firebaseConfig.apiKey.includes('YOUR_') &&
  !firebaseConfig.apiKey.includes('placeholder') &&
  !firebaseConfig.apiKey.includes('undefined')
);

export const isFirebaseConfigured = Boolean(
  hasValidApiKey && firebaseConfig.projectId
);

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    appInstance = getApps().length ? getApp() : initializeApp(firebaseConfig);
    authInstance = getAuth(appInstance);
    dbInstance = getFirestore(appInstance);
  } catch (err) {
    console.warn("[Firebase] Initialization safely bypassed due to invalid credentials:", err);
  }
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;
