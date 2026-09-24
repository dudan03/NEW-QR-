import React, { useState } from 'react';
import {
  BusinessProfile,
  AppSettings,
  SupportedLanguage,
  SplitMethod,
  UserAccount,
  SyncStatusState,
} from '../types';
import { translations } from '../locales';
import { StorageService } from '../services/storage';
import {
  Store,
  User,
  CreditCard,
  Languages,
  Moon,
  Sun,
  Shield,
  Download,
  Upload,
  Trash2,
  Sparkles,
  HelpCircle,
  Check,
  AlertTriangle,
  FileText,
  Cloud,
  LogOut,
  Smartphone,
  ExternalLink,
  Bell,
  BellRing,
} from 'lucide-react';
import { SyncStatusBadge } from '../components/SyncStatusBadge';
import { PWAInstallButton } from '../components/PWAInstallButton';

interface SettingsScreenProps {
  user: UserAccount | null;
  profile: BusinessProfile;
  settings: AppSettings;
  language: SupportedLanguage;
  syncStatus: SyncStatusState;
  lastSyncTime: string | null;
  onSaveProfile: (profile: BusinessProfile) => void;
  onSaveSettings: (settings: AppSettings) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenDeleteAccount: () => void;
  onOpenLegal: (tab: 'privacy' | 'terms' | 'data') => void;
  onSyncNow: () => void;
  onResetDemo: () => void;
  onClearAllData: () => void;
  onOpenOnboarding: () => void;
  onRestoreBackup: (jsonStr: string) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  user,
  profile,
  settings,
  language,
  syncStatus,
  lastSyncTime,
  onSaveProfile,
  onSaveSettings,
  onOpenAuth,
  onLogout,
  onOpenDeleteAccount,
  onOpenLegal,
  onSyncNow,
  onResetDemo,
  onClearAllData,
  onOpenOnboarding,
  onRestoreBackup,
}) => {
  const t = translations[language];

  // Business profile form state
  const [businessName, setBusinessName] = useState(profile.businessName);
  const [upiId, setUpiId] = useState(profile.upiId);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [phone, setPhone] = useState(profile.phone || '');
  const [email, setEmail] = useState(profile.email || '');
  const [address, setAddress] = useState(profile.address || '');
  const [invoicePrefix, setInvoicePrefix] = useState(profile.invoicePrefix || 'INV');
  const [receiptFooter, setReceiptFooter] = useState(profile.receiptFooter || '');
  const [profileSaved, setProfileSaved] = useState(false);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      ...profile,
      businessName: businessName.trim(),
      upiId: upiId.trim(),
      displayName: displayName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      invoicePrefix: invoicePrefix.trim(),
      receiptFooter: receiptFooter.trim(),
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleExportJson = () => {
    const backup = StorageService.exportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `QR-SplitPay-Backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSessionsCsv = () => {
    const csv = StorageService.exportSessionsCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `QR-SplitPay-Sessions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCustomersCsv = () => {
    const csv = StorageService.exportCustomersCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `QR-SplitPay-Customers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onRestoreBackup(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 pb-24 max-w-xl mx-auto">
      {/* Title */}
      <div className="pt-2">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {t.settings.title}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Account, business profile, cloud backup, and data preferences
        </p>
      </div>

      {/* Google Account / Authentication Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {user ? user.name : 'Account & Sync'}
              </h3>
              <p className="text-xs text-slate-500">
                {user ? user.email : 'Not signed in with Google'}
              </p>
            </div>
          </div>

          <div>
            {user ? (
              <button
                type="button"
                onClick={onLogout}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.auth.signOut}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-95 transition"
              >
                {t.auth.signIn}
              </button>
            )}
          </div>
        </div>

        {/* Subscription Plan Preview */}
        <div className="mt-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">
              {t.subscription.currentPlan}
            </span>
            <p className="font-extrabold text-slate-900 dark:text-white">
              {user?.plan === 'PRO' ? t.subscription.pro : t.subscription.free}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenLegal('terms')}
            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
          >
            {t.subscription.upgrade}
          </button>
        </div>
      </div>

      {/* Cloud Backup & Sync Section (PRD Section 13) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t.settings.backupSection}
            </h3>
          </div>
        </div>

        <SyncStatusBadge
          status={syncStatus}
          onSyncNow={onSyncNow}
          language={language}
          lastSyncTime={lastSyncTime}
        />

        <p className="text-[11px] text-slate-500 leading-relaxed">
          {t.auth.googleDriveNote}
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
          <button
            type="button"
            onClick={handleExportJson}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-blue-500" />
            <span>Export Backup (JSON)</span>
          </button>

          <label className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer transition">
            <Upload className="w-3.5 h-3.5 text-emerald-500" />
            <span>Restore Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={handleExportSessionsCsv}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-600 dark:text-slate-300 text-[11px] font-medium"
          >
            Export Payments (CSV)
          </button>
          <button
            type="button"
            onClick={handleExportCustomersCsv}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-600 dark:text-slate-300 text-[11px] font-medium"
          >
            Export Customers (CSV)
          </button>
        </div>
      </div>

      {/* Merchant Business Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
        <div className="flex items-center gap-2 mb-4">
          <Store className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {t.settings.profileSection}
          </h3>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
              {t.settings.businessName} *
            </label>
            <input
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Ramesh Hardware Store"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                {t.settings.defaultUpi} *
              </label>
              <input
                type="text"
                required
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="merchant@okhdfcbank"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                {t.settings.ownerName}
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Ramesh Sharma"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                Business Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                Business Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="shop@example.com"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
              Shop Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Shop No., Market Area, City, State"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
              Receipt Footer Note
            </label>
            <input
              type="text"
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              placeholder="Thank you for your business!"
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Appears on merchant receipts and default UPI requests
            </span>
            <button
              type="submit"
              className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              {profileSaved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>{t.actions.saveProfile}</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Language & Regional Settings */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {t.settings.preferencesSection}
          </h3>
        </div>

        {/* Language Selection */}
        <div>
          <label className="block text-xs text-slate-600 dark:text-slate-400 font-medium mb-2">
            {t.settings.language}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'en', label: 'English', native: 'English' },
              { id: 'hi', label: 'Hindi', native: 'हिंदी' },
              { id: 'or', label: 'Odia', native: 'ଓଡ଼ିଆ' },
            ].map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() =>
                  onSaveSettings({ ...settings, language: lang.id as SupportedLanguage })
                }
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  settings.language === lang.id
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="text-xs font-semibold">{lang.native}</div>
                <div className="text-[10px] text-slate-400">{lang.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Default Split Strategy */}
        <div>
          <label className="block text-xs text-slate-600 dark:text-slate-400 font-medium mb-1.5">
            {t.settings.defaultSplit}
          </label>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {(['EQUAL', 'MAX_INSTALLMENT', 'CUSTOM'] as SplitMethod[]).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => onSaveSettings({ ...settings, defaultSplitMethod: method })}
                className={`py-2 px-2 rounded-xl border text-center transition-all ${
                  settings.defaultSplitMethod === method
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {method === 'EQUAL' ? 'Equal Split' : method === 'MAX_INSTALLMENT' ? 'Max Limit' : 'Custom'}
              </button>
            ))}
          </div>
        </div>

        {/* Due Date Notifications & Alerts */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Due Date Alerts & Push
                </div>
                <div className="text-[10px] text-slate-400">
                  Notify on screen and via push when installments are due or overdue
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextVal = settings.notificationsEnabled !== false ? false : true;
                onSaveSettings({ ...settings, notificationsEnabled: nextVal });
                if (nextVal && typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted') {
                  Notification.requestPermission();
                }
              }}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                settings.notificationsEnabled !== false ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.notificationsEnabled !== false ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Demo & Onboarding Helper Actions */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-2 text-xs">
        <button
          type="button"
          onClick={onResetDemo}
          className="w-full h-10 px-3 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 font-semibold flex items-center justify-between hover:bg-amber-100 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>{t.actions.resetDemo}</span>
          </span>
          <span className="text-[10px] text-amber-600 font-normal">Rahul Kumar ₹10k plan</span>
        </button>

        <button
          type="button"
          onClick={onOpenOnboarding}
          className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span>View Onboarding Guide</span>
          </span>
          <span className="text-[10px] text-slate-400 font-normal">4-step walkthrough</span>
        </button>
      </div>

      {/* Legal & Policy Links */}
      <div className="p-4 bg-slate-100 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>Compliance & Terms</span>
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onOpenLegal('privacy')}
              className="text-blue-600 dark:text-blue-400 hover:underline text-[11px] font-semibold"
            >
              Privacy
            </button>
            <span className="text-slate-400">•</span>
            <button
              type="button"
              onClick={() => onOpenLegal('terms')}
              className="text-blue-600 dark:text-blue-400 hover:underline text-[11px] font-semibold"
            >
              Terms
            </button>
            <span className="text-slate-400">•</span>
            <button
              type="button"
              onClick={() => onOpenLegal('data')}
              className="text-blue-600 dark:text-blue-400 hover:underline text-[11px] font-semibold"
            >
              Data Policy
            </button>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          {t.disclaimer.nonProviderNotice}
        </p>
      </div>

      {/* Danger Zone: Clear Local Data & Delete Account */}
      <div className="p-4 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-red-700 dark:text-red-400">
            Account & Data Controls
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-1 text-xs">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Clear all local records? (Cloud backup remains unaffected)')) {
                onClearAllData();
              }
            }}
            className="flex-1 py-2 px-3 rounded-xl border border-red-300 dark:border-red-900 bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 font-semibold hover:bg-red-50 transition text-center"
          >
            Clear Local Cache
          </button>

          {user && (
            <button
              type="button"
              onClick={onOpenDeleteAccount}
              className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition text-center"
            >
              {t.actions.deleteAccount}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
