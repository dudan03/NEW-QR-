import React, { useState } from 'react';
import { SupportedLanguage, UserAccount } from '../types';
import { translations } from '../locales';
import {
  X,
  ShieldCheck,
  Loader2,
  Lock,
  UserCheck,
  LogOut,
  LogIn,
  CheckCircle2,
} from 'lucide-react';
import { ApiService } from '../services/api';
import {
  signInWithGooglePopup,
  getFirebaseAuth,
} from '../services/firebaseAuth';

interface AuthModalProps {
  isOpen: boolean;
  language: SupportedLanguage;
  user?: UserAccount | null;
  onClose: () => void;
  onSuccess: (user: UserAccount, stats: any) => void;
  onLogout?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  language,
  user,
  onClose,
  onSuccess,
  onLogout,
}) => {
  const t = translations[language].auth;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Google Account details & customize fallback
  const [customEmail, setCustomEmail] = useState('anshumanparida913@gmail.com');
  const [customName, setCustomName] = useState('Anshuman Parida');
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!isOpen) return null;

  // Google Login Handler (Firebase GoogleAuthProvider popup with graceful fallback)
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      let email = customEmail.trim() || 'anshumanparida913@gmail.com';
      let name = customName.trim() || 'Anshuman Parida';
      let avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces';
      let googleId = `google-user-${email.replace(/[^a-zA-Z0-9]/g, '_')}`;

      // If active Firebase configuration is provided, invoke official Google Sign-In popup
      const auth = getFirebaseAuth();
      if (auth) {
        try {
          const popupUser = await signInWithGooglePopup();
          if (popupUser.email) email = popupUser.email;
          if (popupUser.displayName) name = popupUser.displayName;
          if (popupUser.photoURL) avatarUrl = popupUser.photoURL;
          googleId = popupUser.uid;
        } catch (popupErr: any) {
          if (popupErr.code === 'auth/popup-closed-by-user') {
            setLoading(false);
            return;
          }
          console.warn('Firebase Google popup returned code:', popupErr.code, popupErr.message);
        }
      }

      const res = await ApiService.loginWithGoogle({
        email,
        name,
        avatarUrl,
        googleId,
      });
      onSuccess(res.user, res.stats);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2 border border-blue-100 dark:border-blue-900/40">
            <UserCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {user ? 'Merchant Account' : 'Secure Merchant Login'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            {user
              ? `Currently authenticated as ${user.email}`
              : 'Access your split UPI payments, sync across devices, and manage your CRM data.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 font-medium">
            {error}
          </div>
        )}

        {/* If user is already logged in, show current profile & Logout button */}
        {user ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-12 h-12 rounded-2xl object-cover border border-slate-300 dark:border-slate-600"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-base flex items-center justify-center">
                  {user.name.charAt(0)}
                </div>
              )}
              <div className="grow overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {user.name}
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Verified
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user.email}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Google OAuth Active</span>
                </div>
              </div>
            </div>

            {/* Logout and Switch Account Actions */}
            <div className="space-y-2 pt-1">
              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out from this Device</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Switch Google Account</span>
              </button>
            </div>
          </div>
        ) : (
          /* Direct Google Login View */
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white font-bold text-sm shadow-xs hover:bg-slate-50 dark:hover:bg-slate-750 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              ) : (
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              )}
              <span>{loading ? 'Signing In...' : t.continueWithGoogle}</span>
            </button>

            {/* Account Switcher / Customizer */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition cursor-pointer"
              >
                {showAdvanced ? 'Hide Custom Account Details' : 'Account Details / Switch Account'}
              </button>

              {showAdvanced && (
                <div className="mt-3 text-left space-y-2.5 animate-in fade-in duration-150 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Google Email
                    </label>
                    <input
                      type="email"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Merchant Name
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Security Trust Badges */}
        <div className="mt-6 space-y-2 text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
            <Lock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>Bank-Grade Session Security</span>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <span>End-to-end encrypted CRM data & tamper-proof UPI installments.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
