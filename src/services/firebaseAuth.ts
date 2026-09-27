import { FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  User,
  Auth,
} from 'firebase/auth';
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  ReCaptchaV3Provider,
  AppCheck,
} from 'firebase/app-check';
import { app as defaultApp, appCheck as defaultAppCheck, firebaseConfig as baseFirebaseConfig } from './firebase';

// Client-safe Firebase configuration
// In production, these values are populated from VITE_ environment variables
export const firebaseConfig = {
  ...baseFirebaseConfig,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-EXHTWEYD5K',
  reCaptchaSiteKey: import.meta.env.VITE_RECAPTCHA_SITE_KEY || '',
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '225096409177-umb4hm62eeig172d00olmiov4q6hsoen.apps.googleusercontent.com',
};

// Singleton instances
let appInstance: FirebaseApp = defaultApp;
let authInstance: Auth | null = null;
let appCheckInstance: AppCheck | null = defaultAppCheck;
let recaptchaVerifier: RecaptchaVerifier | null = null;
let activeConfirmationResult: ConfirmationResult | null = null;

/**
 * Initialize Firebase Application
 */
export function getFirebaseApp(): FirebaseApp {
  if (typeof window !== 'undefined' && firebaseConfig.measurementId && appInstance) {
    isSupported().then((supported) => {
      if (supported && appInstance) {
        getAnalytics(appInstance);
      }
    }).catch(() => {});
  }
  return appInstance;
}

/**
 * Initialize Firebase Authentication
 */
export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    const app = getFirebaseApp();
    authInstance = getAuth(app);
    // Set language for SMS OTP (English / Hindi localized SMS)
    authInstance.useDeviceLanguage();
  }
  return authInstance;
}

/**
 * Initialize Firebase App Check with ReCaptchaEnterpriseProvider or ReCaptchaV3Provider
 * Prevents unauthorized API / OTP abuse from bots and unauthorized origins
 */
export function initAppCheck(): AppCheck | null {
  if (typeof window === 'undefined') return null;
  if (appCheckInstance) return appCheckInstance;

  try {
    const app = getFirebaseApp();

    // Enable debug token in development environments
    if (import.meta.env.DEV) {
      // @ts-ignore
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }

    if (firebaseConfig.reCaptchaSiteKey && !firebaseConfig.reCaptchaSiteKey.includes('fake')) {
      appCheckInstance = initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(firebaseConfig.reCaptchaSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
      console.info('[AppCheck] Firebase App Check initialized successfully with ReCaptchaEnterpriseProvider');
    }
  } catch (err) {
    console.error('[AppCheck] Failed to initialize Firebase App Check:', err);
  }

  return appCheckInstance;
}

/**
 * Helper to normalize Indian phone number (+91XXXXXXXXXX)
 */
export function formatIndianPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  if (cleaned.startsWith('+91')) {
    return cleaned;
  }
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+${cleaned}`;
  }
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  return cleaned;
}

/**
 * Setup RecaptchaVerifier on a DOM element (or invisible)
 */
export function setupRecaptchaVerifier(containerId: string): RecaptchaVerifier {
  const auth = getFirebaseAuth();

  // Clear existing verifier if any
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch (_) {}
    recaptchaVerifier = null;
  }

  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      console.info('[Recaptcha] Verification passed');
    },
    'expired-callback': () => {
      console.warn('[Recaptcha] Verification expired. Please try again.');
    },
  });

  return recaptchaVerifier;
}

/**
 * Send Phone OTP via Firebase Authentication
 */
export async function sendFirebasePhoneOtp(
  rawPhoneNumber: string,
  containerId: string = 'recaptcha-container'
): Promise<ConfirmationResult> {
  const auth = getFirebaseAuth();
  const formattedPhone = formatIndianPhoneNumber(rawPhoneNumber);

  if (!/^\+91[6-9]\d{9}$/.test(formattedPhone)) {
    throw new Error('Please enter a valid 10-digit Indian mobile number (+91 6xxxx - 9xxxx)');
  }

  // Ensure DOM container exists
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);
  }

  const verifier = setupRecaptchaVerifier(containerId);
  try {
    const confirmation = await signInWithPhoneNumber(auth, formattedPhone, verifier);
    activeConfirmationResult = confirmation;
    return confirmation;
  } catch (error: any) {
    // Reset verifier on error
    if (verifier) {
      try {
        verifier.clear();
      } catch (_) {}
    }
    recaptchaVerifier = null;
    throw error;
  }
}

/**
 * Verify OTP entered by user
 */
export async function verifyFirebaseOtp(
  otpCode: string,
  confirmationResult?: ConfirmationResult
): Promise<User> {
  const confirmation = confirmationResult || activeConfirmationResult;
  if (!confirmation) {
    throw new Error('No active OTP request found. Please request a new OTP.');
  }

  const result = await confirmation.confirm(otpCode);
  return result.user;
}

/**
 * Sign out user from Firebase and clear tokens
 */
export async function logoutFirebaseUser(): Promise<void> {
  const auth = getFirebaseAuth();
  await firebaseSignOut(auth);
  activeConfirmationResult = null;
}

/**
 * Listen for user auth changes
 */
export function subscribeToAuthChanges(callback: (user: User | null) => void): () => void {
  const auth = getFirebaseAuth();
  return onAuthStateChanged(auth, callback);
}

/**
 * Sign in with Google Auth Provider via Firebase Popup
 */
export async function signInWithGooglePopup(): Promise<User> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account',
  });

  const result = await signInWithPopup(auth, provider);
  return result.user;
}
