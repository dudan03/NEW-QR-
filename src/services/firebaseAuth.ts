import { getAnalytics, isSupported } from 'firebase/analytics';
import {
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
  AppCheck,
} from 'firebase/app-check';
import { app, auth, db, isFirebaseConfigured, firebaseConfig } from './firebaseConfig';

export { isFirebaseConfigured, firebaseConfig };

// Re-export auth instance (null if unconfigured)
export const getFirebaseAuth = (): Auth | null => auth;

// Client-safe configuration for non-sensitive data
const clientConfig = {
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  reCaptchaSiteKey: import.meta.env.VITE_RECAPTCHA_SITE_KEY,
};

let appCheckInstance: AppCheck | null = null;
let recaptchaVerifier: RecaptchaVerifier | null = null;
let activeConfirmationResult: ConfirmationResult | null = null;

/**
 * Initialize Firebase Application Analytics
 */
export function initAnalytics() {
  if (typeof window !== 'undefined' && clientConfig.measurementId && app) {
    isSupported().then((supported) => {
      if (supported && app) {
        getAnalytics(app);
      }
    }).catch(() => {});
  }
}

/**
 * Initialize Firebase App Check with ReCaptchaEnterpriseProvider
 */
export function initAppCheck(): AppCheck | null {
  if (typeof window === 'undefined' || !app || !isFirebaseConfigured) return null;
  if (appCheckInstance) return appCheckInstance;

  try {
    if (import.meta.env.DEV) {
      // @ts-ignore
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }

    if (clientConfig.reCaptchaSiteKey && !clientConfig.reCaptchaSiteKey.includes('fake')) {
      appCheckInstance = initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(clientConfig.reCaptchaSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
      console.info('[AppCheck] Firebase App Check initialized successfully');
    }
  } catch (err) {
    console.warn('[AppCheck] Firebase App Check skipped:', err);
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
export function setupRecaptchaVerifier(containerId: string): RecaptchaVerifier | null {
  const currentAuth = getFirebaseAuth();
  if (!currentAuth) return null;

  // Clear existing verifier if any
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch (_) {}
    recaptchaVerifier = null;
  }

  // Clear existing inner HTML of container to prevent re-rendering issues
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '';
  }

  try {
    recaptchaVerifier = new RecaptchaVerifier(currentAuth, containerId, {
      size: 'invisible',
      callback: () => {
        console.info('[Recaptcha] Verification passed');
      },
      'expired-callback': () => {
        console.warn('[Recaptcha] Verification expired. Please try again.');
      },
    });
    return recaptchaVerifier;
  } catch (err) {
    console.warn('[Recaptcha] Could not initialize recaptcha verifier:', err);
    return null;
  }
}

/**
 * Send Phone OTP via Firebase Authentication with graceful simulation fallback
 */
export async function sendFirebasePhoneOtp(
  rawPhoneNumber: string,
  containerId: string = 'recaptcha-container'
): Promise<ConfirmationResult | null> {
  const currentAuth = getFirebaseAuth();
  const formattedPhone = formatIndianPhoneNumber(rawPhoneNumber);

  if (!/^\+91[6-9]\d{9}$/.test(formattedPhone)) {
    throw new Error('Please enter a valid 10-digit Indian mobile number (+91 6xxxx - 9xxxx)');
  }

  if (!currentAuth) {
    // Return null to indicate client-side simulated OTP verification
    return null;
  }

  // Ensure DOM container exists
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);
  }

  const verifier = setupRecaptchaVerifier(containerId);
  if (!verifier) {
    return null;
  }

  try {
    const confirmation = await signInWithPhoneNumber(currentAuth, formattedPhone, verifier);
    activeConfirmationResult = confirmation;
    return confirmation;
  } catch (error: any) {
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
  confirmationResult?: ConfirmationResult | null
): Promise<User | null> {
  const confirmation = confirmationResult || activeConfirmationResult;
  if (!confirmation) {
    return null;
  }

  const result = await confirmation.confirm(otpCode);
  return result.user;
}

/**
 * Sign out user from Firebase and clear tokens
 */
export async function logoutFirebaseUser(): Promise<void> {
  const currentAuth = getFirebaseAuth();
  if (currentAuth) {
    try {
      await firebaseSignOut(currentAuth);
    } catch (_) {}
  }
  activeConfirmationResult = null;
}

/**
 * Listen for user auth changes
 */
export function subscribeToAuthChanges(callback: (user: User | null) => void): () => void {
  const currentAuth = getFirebaseAuth();
  if (currentAuth) {
    return onAuthStateChanged(currentAuth, callback);
  }
  callback(null);
  return () => {};
}

/**
 * Sign in with Google Auth Provider via Firebase Popup
 */
export async function signInWithGooglePopup(): Promise<User> {
  const currentAuth = getFirebaseAuth();
  if (!currentAuth) {
    throw new Error('Firebase Auth is not configured.');
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account',
  });

  const result = await signInWithPopup(currentAuth, provider);
  return result.user;
}
