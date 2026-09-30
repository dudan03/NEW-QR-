import React from 'react';
import { SupportedLanguage, UserAccount, SyncStatusState, UsageSummary } from '../types';
import { translations } from '../locales';
import {
  QrCode,
  Languages,
  Sun,
  Moon,
  Plus,
  Sparkles,
  Cloud,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  User,
  Bell,
  ShieldCheck,
  LogOut,
  LogIn,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface TopBarProps {
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  theme: 'light' | 'dark' | 'system';
  onThemeToggle: () => void;
  onOpenCreate: () => void;
  user: UserAccount | null;
  onOpenAuth: () => void;
  onLogout?: () => void;
  syncStatus: SyncStatusState;
  onSyncNow: () => void;
  onOpenLanding?: () => void;
  notificationCount?: number;
  onOpenNotifications?: () => void;
  onOpenSecurity?: () => void;
  isPro?: boolean;
  dailyUsage?: UsageSummary | null;
  onOpenPricing?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  language,
  onLanguageChange,
  theme,
  onThemeToggle,
  onOpenCreate,
  user,
  onOpenAuth,
  onLogout,
  syncStatus,
  onSyncNow,
  onOpenLanding,
  notificationCount = 0,
  onOpenNotifications,
  onOpenSecurity,
  isPro = false,
  dailyUsage,
  onOpenPricing,
}) => {
  const t = translations[language];

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2">
        {/* Brand title */}
        <div
          onClick={onOpenLanding}
          className="flex items-center gap-2 cursor-pointer select-none shrink-0"
          title="View Landing Page"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <QrCode className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-900 dark:text-white leading-none">
              Split UPI <span className="text-blue-600">QR</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Cloud Sync Quick Pill */}
          <button
            type="button"
            onClick={onSyncNow}
            title={
              syncStatus === 'synced'
                ? 'Cloud backup synced. Click to sync now.'
                : syncStatus === 'syncing'
                ? 'Syncing in progress...'
                : syncStatus === 'offline'
                ? 'Offline. Changes stored locally.'
                : 'Sync pending'
            }
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
          >
            {syncStatus === 'syncing' ? (
              <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />
            ) : syncStatus === 'synced' ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            ) : syncStatus === 'offline' ? (
              <Cloud className="w-3 h-3 text-slate-400" />
            ) : (
              <AlertTriangle className="w-3 h-3 text-amber-500" />
            )}
            <span className="hidden md:inline font-mono">
              {syncStatus === 'synced'
                ? 'Synced'
                : syncStatus === 'syncing'
                ? 'Syncing'
                : syncStatus === 'offline'
                ? 'Offline'
                : 'Pending'}
            </span>
          </button>

          {/* PWA Install Button */}
          <div className="hidden sm:block">
            <PWAInstallButton variant="compact" />
          </div>

          {/* Pro Status Badge / Free Usage Indicator & Upgrade Button */}
          {isPro ? (
            <button
              type="button"
              onClick={onOpenPricing}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-black text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition shadow-2xs cursor-pointer"
              title="Split UPI QR Pro Active. Click to view subscription."
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>PRO</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              {/* Mobile/Desktop Free Usage Badge (PRD Section 21) */}
              <button
                type="button"
                onClick={onOpenPricing}
                className="flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 text-[11px] font-bold hover:bg-slate-200 transition shadow-2xs cursor-pointer"
                title={`Free Plan: ${dailyUsage ? dailyUsage.used : 0} of 4 QR requests used today. Click to view details.`}
              >
                <span className="text-slate-500 font-medium">Free</span>
                <span className={dailyUsage && dailyUsage.used >= 4 ? 'text-amber-600 font-black' : 'text-blue-600 dark:text-blue-400 font-black'}>
                  · {dailyUsage ? dailyUsage.used : 0}/4
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenPricing}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-[11px] font-extrabold transition shadow-xs cursor-pointer shrink-0"
                title="Upgrade to Split UPI QR Pro — ₹999 for 6 Months"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span className="hidden sm:inline">Get Pro</span>
                <span className="font-mono">₹999</span>
              </button>
            </div>
          )}

          {/* User Account & Login / Logout Action Group */}
          {user ? (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl">
              <button
                type="button"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 transition cursor-pointer"
                title={`Logged in as ${user.email}. Click to view account info.`}
              >
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                    {user.name.charAt(0)}
                  </div>
                )}
                <span className="hidden md:inline truncate max-w-[80px] text-[11px]">{user.name.split(' ')[0]}</span>
              </button>

              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to log out from this device?')) {
                      onLogout();
                    }
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px] font-bold transition cursor-pointer"
                  title="Log out from session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}

          {/* Language Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => onLanguageChange('en')}
              className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md transition-colors ${
                language === 'en'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('hi')}
              className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md transition-colors ${
                language === 'hi'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              हिं
            </button>
            <button
              type="button"
              onClick={() => onLanguageChange('or')}
              className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md transition-colors ${
                language === 'or'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              ଓଡ଼
            </button>
          </div>

          {/* Notification Center Trigger */}
          {onOpenNotifications && (
            <button
              type="button"
              onClick={onOpenNotifications}
              className="relative w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Due date alerts & notifications"
            >
              <Bell className="w-3.5 h-3.5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center shadow-xs animate-pulse">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
          )}

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={onThemeToggle}
            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Security Architecture Console Trigger */}
          {onOpenSecurity && (
            <button
              type="button"
              onClick={onOpenSecurity}
              className="w-8 h-8 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors"
              title="Security & Architecture Console (Firebase & Cloudflare)"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>
          )}

          {/* Primary CTA */}
          <button
            type="button"
            onClick={onOpenCreate}
            className="h-8 px-2.5 sm:px-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New</span>
          </button>
        </div>
      </div>
    </header>
  );
};
