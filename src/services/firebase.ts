import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  ReCaptchaV3Provider,
  AppCheck,
} from "firebase/app-check";
// Note: If you are using reCAPTCHA v3, import ReCaptchaV3Provider instead

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBd-4eU8tmwmXgW3f2-bq4x3GWEVxjkd5I',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'qr-india-pay.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'qr-india-pay',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'qr-india-pay.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '225096409177',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:225096409177:web:e76bb2a43382dc0f185148',
};

// 1. Initialize Firebase
export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// 2. Initialize App Check
let appCheckInstance: AppCheck | null = null;

if (typeof window !== "undefined") {
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  if (recaptchaSiteKey && !recaptchaSiteKey.includes("fake")) {
    try {
      if (import.meta.env.DEV) {
        // @ts-ignore
        self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      }

      appCheckInstance = initializeAppCheck(app, {
        // Pass your site key securely using Vite's environment variable
        provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),

        // Set to true so the SDK automatically refreshes tokens in the background
        isTokenAutoRefreshEnabled: true,
      });
      console.info("[AppCheck] Firebase App Check initialized successfully with ReCaptchaEnterpriseProvider");
    } catch (err) {
      console.error("[AppCheck] Failed to initialize Firebase App Check:", err);
    }
  }
}

export const appCheck = appCheckInstance;
