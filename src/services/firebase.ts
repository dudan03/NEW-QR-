import { FirebaseApp } from "firebase/app";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  AppCheck,
} from "firebase/app-check";
import { app as configuredApp, firebaseConfig, isFirebaseConfigured } from "./firebaseConfig";

export { firebaseConfig };

// 1. Initialize Firebase App (null if unconfigured)
export const app: FirebaseApp | null = configuredApp;

// 2. Initialize App Check
let appCheckInstance: AppCheck | null = null;

if (typeof window !== "undefined" && app && isFirebaseConfigured) {
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  if (recaptchaSiteKey && !recaptchaSiteKey.includes("fake") && !recaptchaSiteKey.includes("YOUR_")) {
    try {
      if (import.meta.env.DEV) {
        // @ts-ignore
        self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
      }

      appCheckInstance = initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
      console.info("[AppCheck] Firebase App Check initialized successfully");
    } catch (err) {
      console.warn("[AppCheck] Firebase App Check safely bypassed:", err);
    }
  }
}

export const appCheck = appCheckInstance;
