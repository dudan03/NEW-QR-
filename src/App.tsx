/**
 * QR SplitPay India - Main Application Entry
 * Version 2.0 (Full SaaS & Cloud Backup Upgrade)
 * Split. Scan. Pay. Track.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  PaymentSession,
  Installment,
  AuditEvent,
  BusinessProfile,
  AppSettings,
  SupportedLanguage,
  Customer,
  UserAccount,
  SyncStatusState,
  InAppAlert,
  Subscription,
  UsageSummary,
} from './types';
import { StorageService } from './services/storage';
import { ApiService } from './services/api';
import { NotificationScheduler } from './services/notifications';
import { TopBar } from './components/TopBar';
import { BottomNav, NavTab } from './components/BottomNav';
import { HomeScreen } from './screens/HomeScreen';
import { PaymentsScreen } from './screens/PaymentsScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { CustomersScreen } from './screens/CustomersScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { SubscriptionScreen } from './screens/SubscriptionScreen';
import { LandingPage } from './components/LandingPage';
import { CreatePaymentModal } from './components/CreatePaymentModal';
import { ManualConfirmModal } from './components/ManualConfirmModal';
import { PaymentDetailModal } from './components/PaymentDetailModal';
import { ReceiptModal } from './components/ReceiptModal';
import { OnboardingModal } from './components/OnboardingModal';
import { AuthModal } from './components/AuthModal';
import { WelcomeBackModal } from './components/WelcomeBackModal';
import { DeleteAccountModal } from './components/DeleteAccountModal';
import { LegalModal } from './components/LegalModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { NotificationToastBanner } from './components/NotificationToastBanner';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { SecurityArchitectureModal } from './components/SecurityArchitectureModal';
import { useInactivityTimeout } from './hooks/useInactivityTimeout';
import { logoutFirebaseUser } from './services/firebaseAuth';
import { Lock, ShieldAlert } from 'lucide-react';

export default function App() {
  // Core application state
  const [sessions, setSessions] = useState<PaymentSession[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [profile, setProfile] = useState<BusinessProfile>(StorageService.getProfile());
  const [settings, setSettings] = useState<AppSettings>(StorageService.getSettings());
  const [user, setUser] = useState<UserAccount | null>(StorageService.getUser());
  const [syncStatus, setSyncStatus] = useState<SyncStatusState>(StorageService.getSyncStatus());
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(StorageService.getLastSyncTime());

  // Navigation & Screen states
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [showLanding, setShowLanding] = useState<boolean>(false);
  const [showPricing, setShowPricing] = useState<boolean>(() => {
    return (
      typeof window !== 'undefined' &&
      (window.location.pathname === '/pricing' ||
        window.location.pathname === '/subscription' ||
        window.location.search.includes('pricing') ||
        window.location.search.includes('subscription'))
    );
  });
  const [subscription, setSubscription] = useState<Subscription | null>(() =>
    StorageService.getSubscription()
  );
  const [isPro, setIsPro] = useState<boolean>(() => StorageService.isPro());
  const [dailyUsage, setDailyUsage] = useState<UsageSummary | null>(() =>
    StorageService.getDailyUsage()
  );

  // Interactive Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isWelcomeBackOpen, setIsWelcomeBackOpen] = useState(false);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [securityToast, setSecurityToast] = useState<string | null>(null);
  const [legalTab, setLegalTab] = useState<'privacy' | 'terms' | 'data' | null>(null);

  // Notification Scheduling & Alerts
  const [activeAlerts, setActiveAlerts] = useState<InAppAlert[]>([]);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>(() =>
    NotificationScheduler.getDismissedAlertIds()
  );
  const [hasPushPermission, setHasPushPermission] = useState<boolean>(() =>
    NotificationScheduler.hasPermission()
  );

  // Active selections for modals
  const [selectedSession, setSelectedSession] = useState<PaymentSession | null>(null);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [initialCustomerForPayment, setInitialCustomerForPayment] = useState<Customer | null>(null);
  const [cloudBackupSummary, setCloudBackupSummary] = useState<{
    sessionsCount: number;
    customersCount: number;
    lastBackupTime: string;
  } | null>(null);

  // Refresh all state from local storage & cloud cache
  const refreshAllData = useCallback(() => {
    setSessions(StorageService.getSessions());
    setCustomers(StorageService.getCustomers());
    setAuditEvents(StorageService.getAuditEvents());
    setProfile(StorageService.getProfile());
    setSettings(StorageService.getSettings());
    setUser(StorageService.getUser());
    setSyncStatus(StorageService.getSyncStatus());
    setLastSyncTime(StorageService.getLastSyncTime());
    setSubscription(StorageService.getSubscription());
    setIsPro(StorageService.isPro());
    setDailyUsage(StorageService.getDailyUsage());
  }, []);

  // Fetch verified subscription status from server (PRD Section 12 & 15)
  const refreshSubscription = useCallback(async (userId?: string) => {
    const targetUserId = userId || StorageService.getUser()?.id;
    if (!targetUserId) {
      setSubscription(null);
      setIsPro(false);
      return;
    }
    try {
      const res = await ApiService.getSubscription(targetUserId);
      setSubscription(res.subscription);
      setIsPro(res.isPro);
      if (res.subscription) {
        StorageService.saveSubscription(res.subscription);
      }
    } catch {
      setSubscription(StorageService.getSubscription());
      setIsPro(StorageService.isPro());
    }
  }, []);

  // Fetch verified daily usage for Free plan from server (PRD Section 4 & 5)
  const refreshDailyUsage = useCallback(async (userId?: string) => {
    const targetUserId = userId || StorageService.getUser()?.id || 'default-merchant';
    try {
      const usage = await ApiService.getDailyUsage(targetUserId);
      setDailyUsage(usage);
      StorageService.saveDailyUsage(usage);
    } catch {
      setDailyUsage(StorageService.getDailyUsage());
    }
  }, []);

  // Trigger synchronization
  const triggerSync = useCallback(async () => {
    const result = await StorageService.performSync();
    refreshAllData();
    refreshSubscription();
    refreshDailyUsage();
    return result;
  }, [refreshAllData, refreshSubscription, refreshDailyUsage]);

  // Initial load
  useEffect(() => {
    refreshAllData();
    refreshSubscription();
    refreshDailyUsage();

    // Check onboarding requirement
    const loadedSettings = StorageService.getSettings();
    const loadedSessions = StorageService.getSessions();
    if (!loadedSettings.hasCompletedOnboarding && loadedSessions.length === 0) {
      setIsOnboardingOpen(true);
    }

    // Auto-sync on startup if online
    if (navigator.onLine) {
      StorageService.performSync().then(() => {
        refreshAllData();
        refreshSubscription();
        refreshDailyUsage();
      });
    }

    // Listen for online events & route changes
    const handleOnline = () => {
      StorageService.performSync().then(() => {
        refreshAllData();
        refreshSubscription();
        refreshDailyUsage();
      });
    };

    const handlePopState = () => {
      setShowPricing(
        window.location.pathname === '/pricing' ||
          window.location.pathname === '/subscription'
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [refreshAllData, refreshSubscription]);

  // Sync dark theme with HTML root class
  useEffect(() => {
    const root = document.documentElement;
    if (
      settings.theme === 'dark' ||
      (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  // Compute analytics
  const analytics = useMemo(() => {
    return StorageService.getDashboardAnalytics();
  }, [sessions, customers]);

  // ---------------- NOTIFICATION SCHEDULING SYSTEM ----------------
  // Periodic check (every 60s and on sessions/settings update)
  useEffect(() => {
    if (settings.notificationsEnabled === false) {
      setActiveAlerts([]);
      return;
    }

    const runNotificationCheck = () => {
      const { alerts } = NotificationScheduler.checkDueAndOverdueInstallments(sessions);
      setActiveAlerts(alerts);

      // Trigger Push Notification if enabled & permitted
      if (alerts.length > 0 && NotificationScheduler.hasPermission()) {
        NotificationScheduler.triggerPushNotificationForAlerts(alerts, settings.language);
      }
    };

    // Run immediately on data update
    runNotificationCheck();

    // Schedule background interval every 60 seconds
    const intervalTimer = setInterval(runNotificationCheck, 60 * 1000);
    return () => clearInterval(intervalTimer);
  }, [sessions, settings.notificationsEnabled, settings.language]);

  // Request push permission handler
  const handleRequestPushPermission = async () => {
    const perm = await NotificationScheduler.requestPermission();
    const granted = perm === 'granted';
    setHasPushPermission(granted);

    if (granted && activeAlerts.length > 0) {
      NotificationScheduler.triggerPushNotificationForAlerts(activeAlerts, settings.language);
    }
  };

  // Dismiss a single alert from UI toast
  const handleDismissAlert = (alertId: string) => {
    NotificationScheduler.dismissAlert(alertId);
    setDismissedAlertIds((prev) => [...prev, alertId]);
  };

  // Dismiss all current alerts
  const handleDismissAllAlerts = () => {
    activeAlerts.forEach((a) => NotificationScheduler.dismissAlert(a.id));
    setDismissedAlertIds((prev) => [...prev, ...activeAlerts.map((a) => a.id)]);
  };

  // Filter alerts for the toast banner (exclude dismissed)
  const unreadBannerAlerts = useMemo(() => {
    return activeAlerts.filter((a) => !dismissedAlertIds.includes(a.id));
  }, [activeAlerts, dismissedAlertIds]);

  // Quick navigation to session from alert
  const handleSelectAlert = (alert: InAppAlert) => {
    const targetSession = sessions.find((s) => s.id === alert.sessionId);
    if (targetSession) {
      setSelectedSession(targetSession);
      const targetInstallment = targetSession.installments.find(
        (i) => i.id === alert.installmentId
      );
      if (targetInstallment) {
        setSelectedInstallment(targetInstallment);
      }
      setIsNotificationCenterOpen(false);
      setIsDetailOpen(true);
    }
  };

  const hasDemoSession = useMemo(() => {
    return sessions.some((s) => s.isDemo);
  }, [sessions]);

  // Count unconfirmed installments in active sessions for the bottom nav badge
  const pendingInstallmentsCount = useMemo(() => {
    return sessions
      .filter((s) => s.status === 'ACTIVE' || s.status === 'PARTIALLY_PAID')
      .reduce((count, s) => {
        return (
          count +
          s.installments.filter(
            (i) => i.status !== 'MANUALLY_CONFIRMED' && i.status !== 'SUCCESS'
          ).length
        );
      }, 0);
  }, [sessions]);

  // Handler: Language switch
  const handleLanguageChange = (lang: SupportedLanguage) => {
    const updated = { ...settings, language: lang };
    setSettings(updated);
    StorageService.saveSettings(updated);
  };

  // Handler: Theme toggle
  const handleThemeToggle = () => {
    const nextTheme: AppSettings['theme'] = settings.theme === 'dark' ? 'light' : 'dark';
    const updated: AppSettings = { ...settings, theme: nextTheme };
    setSettings(updated);
    StorageService.saveSettings(updated);
  };

  // Handler: Finish onboarding
  const handleFinishOnboarding = () => {
    const updated = { ...settings, hasCompletedOnboarding: true };
    setSettings(updated);
    StorageService.saveSettings(updated);
    setIsOnboardingOpen(false);
  };

  // Handler: Load / Seed Demo Data
  const handleLoadDemo = () => {
    NotificationScheduler.clearDismissedAlerts();
    setDismissedAlertIds([]);
    const demo = StorageService.seedDemoData();
    refreshAllData();
    setSelectedSession(demo);
    triggerSync();
  };

  // Handler: Create New Payment Session (PRD Section 8, 9, 10, 16, 18)
  const handleCreateSession = async (newSession: PaymentSession, customerRef?: Customer) => {
    const targetUserId = user?.id || 'default-merchant';

    // Quick client-side check if user reached 4/4 free QR requests
    if (!isPro && dailyUsage && dailyUsage.used >= 4) {
      setIsCreateOpen(false);
      setShowPricing(true);
      window.history.pushState({}, '', '/subscription');
      return;
    }

    try {
      // Create session on server with atomic daily usage check & increment
      const res = await ApiService.createPaymentSession(targetUserId, newSession);
      if (res.usage) {
        setDailyUsage(res.usage);
        StorageService.saveDailyUsage(res.usage);
      }
    } catch (err: any) {
      if (err.code === 'FREE_DAILY_LIMIT_REACHED' || err.status === 429) {
        if (err.usage) {
          setDailyUsage(err.usage);
          StorageService.saveDailyUsage(err.usage);
        }
        setIsCreateOpen(false);
        setShowPricing(true);
        window.history.pushState({}, '', '/subscription');
        return;
      }
      console.warn('Server sync error during session creation, fallback to local:', err);
    }

    if (customerRef) {
      StorageService.saveCustomer(customerRef);
    }
    StorageService.saveSession(newSession);
    StorageService.recordAuditEvent({
      sessionId: newSession.id,
      newState: 'DRAFT',
      note: `Session created with ${newSession.installments.length} installments (${newSession.splitMethod})`,
    });

    refreshAllData();
    refreshDailyUsage(targetUserId);
    setIsCreateOpen(false);
    setInitialCustomerForPayment(null);
    setSelectedSession(newSession);
    setActiveTab('payments');

    // Trigger cloud sync
    triggerSync();
  };

  // Handler: Initiate manual confirmation modal
  const handleStartManualConfirm = (installment: Installment, session: PaymentSession) => {
    setSelectedSession(session);
    setSelectedInstallment(installment);
    setIsConfirmOpen(true);
  };

  // Handler: Confirm payment received (Manual verification mode)
  const handleConfirmReceived = (installment: Installment, note: string) => {
    if (!selectedSession) return;

    const result = StorageService.updateInstallmentState(
      selectedSession.id,
      installment.id,
      'MANUALLY_CONFIRMED',
      note
    );

    if (result) {
      refreshAllData();
      setSelectedSession(result.session);
      setSelectedInstallment(result.installment);
      triggerSync();
    }

    setIsConfirmOpen(false);
  };

  // Handler: Cancel payment session
  const handleCancelSession = (sessionId: string) => {
    const sess = sessions.find((s) => s.id === sessionId);
    if (!sess) return;

    sess.status = 'CANCELLED';
    sess.installments.forEach((i) => {
      if (i.status !== 'MANUALLY_CONFIRMED' && i.status !== 'SUCCESS') {
        i.status = 'CANCELLED';
      }
    });

    StorageService.saveSession(sess);
    StorageService.recordAuditEvent({
      sessionId,
      newState: 'CANCELLED',
      note: 'Payment session marked cancelled by merchant',
    });

    refreshAllData();
    setSelectedSession(sess);
    triggerSync();
  };

  // Customer CRM Handlers
  const handleSaveCustomer = (customer: Customer) => {
    StorageService.saveCustomer(customer);
    refreshAllData();
    triggerSync();
  };

  const handleDeleteCustomer = (id: string) => {
    StorageService.deleteCustomer(id);
    refreshAllData();
    triggerSync();
  };

  const handleOpenNewPaymentForCustomer = (customer: Customer) => {
    setInitialCustomerForPayment(customer);
    setIsCreateOpen(true);
  };

  // Handler: Save Business Profile
  const handleSaveProfile = (updatedProfile: BusinessProfile) => {
    setProfile(updatedProfile);
    StorageService.saveProfile(updatedProfile);
    triggerSync();
  };

  // Handler: Save App Settings
  const handleSaveSettings = (updatedSettings: AppSettings) => {
    setSettings(updatedSettings);
    StorageService.saveSettings(updatedSettings);
  };

  // Auth Handlers
  const handleGoogleSuccess = async (authUser: UserAccount) => {
    StorageService.saveUser(authUser);
    setUser(authUser);
    setIsAuthOpen(false);

    // Hydrate multi-device subscription status (PRD Section 15)
    await refreshSubscription(authUser.id);

    // Check if cloud backup has records to offer restoration
    try {
      const backupRes = await ApiService.fetchCloudBackup(authUser.id);
      if (
        backupRes &&
        (backupRes.sessions?.length > 0 || backupRes.customers?.length > 0)
      ) {
        setCloudBackupSummary({
          sessionsCount: backupRes.sessions?.length || 0,
          customersCount: backupRes.customers?.length || 0,
          lastBackupTime: backupRes.lastBackupTime || new Date().toISOString(),
        });
        setIsWelcomeBackOpen(true);
      } else {
        // Initial sync of current local data up to cloud
        await triggerSync();
      }
    } catch {
      await triggerSync();
    }
  };

  const handleRestoreCloud = async () => {
    if (!user) return;
    try {
      const backup = await ApiService.exportBackup(user.id);
      if (backup) {
        StorageService.importBackup(backup);
        refreshAllData();
      }
    } catch (err) {
      console.error('Failed to restore cloud backup', err);
    }
    setIsWelcomeBackOpen(false);
  };

  const handleLogout = useCallback(() => {
    logoutFirebaseUser().catch(() => {});
    StorageService.clearUser();
    setUser(null);
    refreshAllData();
  }, [refreshAllData]);

  // 15-Minute Session Inactivity Security Manager
  const { isWarningActive, secondsLeft, resetTimer } = useInactivityTimeout({
    timeoutMs: 15 * 60 * 1000, // 15 minutes
    warningMs: 60 * 1000,       // 60-second warning countdown
    enabled: !!user,
    onTimeout: () => {
      handleLogout();
      setSecurityToast(
        'Session automatically locked after 15 minutes of inactivity to protect your financial and customer data.'
      );
      StorageService.recordAuditEvent({
        sessionId: selectedSession?.id || 'AUTH_SESSION',
        newState: 'PENDING',
        note: 'Automatic security session termination due to 15-minute inactivity policy.',
      });
    },
  });

  const handleDeleteAccountSuccess = () => {
    StorageService.clearAllData();
    setUser(null);
    refreshAllData();
    setIsDeleteAccountOpen(false);
    setActiveTab('home');
  };

  // Handler: Clear all local data
  const handleClearAllData = () => {
    NotificationScheduler.clearDismissedAlerts();
    setDismissedAlertIds([]);
    StorageService.clearAllData();
    refreshAllData();
    setSelectedSession(null);
    setSelectedInstallment(null);
    setActiveTab('home');
  };

  const handleRestoreBackupJson = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      StorageService.importBackup(parsed);
      refreshAllData();
      alert('Backup restored successfully!');
      triggerSync();
    } catch (err) {
      alert('Invalid backup JSON file.');
    }
  };

  // Determine if active installment is the final pending installment in the session
  const isFinalInstallment = useMemo(() => {
    if (!selectedSession || !selectedInstallment) return false;
    const remainingPending = selectedSession.installments.filter(
      (i) =>
        i.id !== selectedInstallment.id &&
        i.status !== 'MANUALLY_CONFIRMED' &&
        i.status !== 'SUCCESS'
    );
    return remainingPending.length === 0;
  }, [selectedSession, selectedInstallment]);

  // If user navigated to SaaS landing page view
  if (showLanding) {
    return (
      <LandingPage
        language={settings.language}
        onStartApp={() => setShowLanding(false)}
        onOpenAuth={() => {
          setShowLanding(false);
          setIsAuthOpen(true);
        }}
        onOpenLegal={(tab) => setLegalTab(tab)}
      />
    );
  }

  // If user navigated to Dedicated Pro Subscription & Pricing view (PRD Section 3)
  if (showPricing) {
    return (
      <SubscriptionScreen
        user={user}
        language={settings.language}
        onOpenAuth={() => setIsAuthOpen(true)}
        dailyUsage={dailyUsage}
        onClose={() => {
          setShowPricing(false);
          if (
            window.location.pathname === '/pricing' ||
            window.location.pathname === '/subscription'
          ) {
            window.history.pushState({}, '', '/');
          }
        }}
        onSubscriptionUpdated={() => {
          refreshAllData();
          refreshSubscription();
          refreshDailyUsage();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Offline Alert Banner */}
      <OfflineIndicator />

      {/* Top Bar Header */}
      <TopBar
        language={settings.language}
        onLanguageChange={handleLanguageChange}
        theme={settings.theme}
        onThemeToggle={handleThemeToggle}
        onOpenCreate={() => {
          setInitialCustomerForPayment(null);
          setIsCreateOpen(true);
        }}
        hasDemoSession={hasDemoSession}
        onLoadDemo={handleLoadDemo}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        syncStatus={syncStatus}
        onSyncNow={triggerSync}
        onOpenLanding={() => setShowLanding(true)}
        notificationCount={activeAlerts.length}
        onOpenNotifications={() => setIsNotificationCenterOpen(true)}
        onOpenSecurity={() => setIsSecurityOpen(true)}
        isPro={isPro}
        dailyUsage={dailyUsage}
        onOpenPricing={() => {
          setShowPricing(true);
          window.history.pushState({}, '', '/subscription');
        }}
      />

      {/* 15-Minute Inactivity Warning Countdown Banner */}
      {isWarningActive && user && (
        <div className="bg-amber-500 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-md sticky top-14 z-30 animate-pulse">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0" />
            <span>
              Security Notice: Idle for 14 minutes. Session will auto-lock in <strong>{secondsLeft}s</strong> to protect financial records.
            </span>
          </div>
          <button
            type="button"
            onClick={resetTimer}
            className="px-2.5 py-1 bg-white text-amber-800 rounded-lg font-bold text-xs hover:bg-amber-50 transition cursor-pointer shadow-xs"
          >
            Stay Logged In
          </button>
        </div>
      )}

      {/* Security Auto-Logout Toast Notification */}
      {securityToast && (
        <div className="bg-slate-900 text-white px-4 py-2.5 text-xs font-medium flex items-center justify-between shadow-lg sticky top-14 z-30 border-b border-slate-700 animate-in fade-in">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{securityToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSecurityToast(null)}
            className="text-slate-400 hover:text-white px-2 py-0.5 rounded text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Floating In-App Due Date Notification Alert Banner */}
      <NotificationToastBanner
        alerts={unreadBannerAlerts}
        language={settings.language}
        onSelectAlert={handleSelectAlert}
        onDismissAlert={handleDismissAlert}
        onDismissAll={handleDismissAllAlerts}
        hasPushPermission={hasPushPermission}
        onRequestPushPermission={handleRequestPushPermission}
      />

      {/* Main Content Viewport */}
      <main className="grow max-w-4xl w-full mx-auto px-3 sm:px-4 pt-3 pb-24">
        {activeTab === 'home' && (
          <HomeScreen
            sessions={sessions}
            customers={customers}
            language={settings.language}
            onOpenCreate={() => {
              setInitialCustomerForPayment(null);
              setIsCreateOpen(true);
            }}
            onSelectSession={(sess) => {
              setSelectedSession(sess);
              setIsDetailOpen(true);
            }}
            onLoadDemo={handleLoadDemo}
            onOpenCustomers={() => setActiveTab('customers')}
            onOpenReports={() => setActiveTab('reports')}
            hasDemoSession={hasDemoSession}
            analytics={analytics}
            isPro={isPro}
            subscription={subscription}
            dailyUsage={dailyUsage}
            onOpenPricing={() => {
              setShowPricing(true);
              window.history.pushState({}, '', '/subscription');
            }}
          />
        )}

        {activeTab === 'payments' && (
          <PaymentsScreen
            sessions={sessions}
            language={settings.language}
            selectedSessionId={selectedSession?.id}
            selectedInstallmentId={selectedInstallment?.id}
            onOpenCreate={() => {
              setInitialCustomerForPayment(null);
              setIsCreateOpen(true);
            }}
            onMarkReceived={(inst, sess) => handleStartManualConfirm(inst, sess)}
            onOpenDetail={(sess) => {
              setSelectedSession(sess);
              setIsDetailOpen(true);
            }}
            onOpenReceipt={(sess) => {
              setSelectedSession(sess);
              setIsReceiptOpen(true);
            }}
          />
        )}

        {activeTab === 'customers' && (
          <CustomersScreen
            customers={customers}
            sessions={sessions}
            language={settings.language}
            onSaveCustomer={handleSaveCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onOpenNewPaymentForCustomer={handleOpenNewPaymentForCustomer}
            onSelectSession={(sess) => {
              setSelectedSession(sess);
              setIsDetailOpen(true);
            }}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsScreen
            sessions={sessions}
            customers={customers}
            language={settings.language}
            profile={profile}
          />
        )}

        {activeTab === 'history' && (
          <HistoryScreen
            sessions={sessions}
            language={settings.language}
            onSelectSession={(sess) => {
              setSelectedSession(sess);
              setIsDetailOpen(true);
            }}
            onOpenReceipt={(sess) => {
              setSelectedSession(sess);
              setIsReceiptOpen(true);
            }}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            user={user}
            profile={profile}
            settings={settings}
            language={settings.language}
            syncStatus={syncStatus}
            lastSyncTime={lastSyncTime}
            onSaveProfile={handleSaveProfile}
            onSaveSettings={handleSaveSettings}
            onOpenAuth={() => setIsAuthOpen(true)}
            onLogout={handleLogout}
            onOpenDeleteAccount={() => setIsDeleteAccountOpen(true)}
            onOpenLegal={(tab) => setLegalTab(tab)}
            onSyncNow={triggerSync}
            onResetDemo={handleLoadDemo}
            onClearAllData={handleClearAllData}
            onOpenOnboarding={() => setIsOnboardingOpen(true)}
            onRestoreBackup={handleRestoreBackupJson}
            onOpenSecurity={() => setIsSecurityOpen(true)}
            isPro={isPro}
            subscription={subscription}
            onOpenPricing={() => {
              setShowPricing(true);
              window.history.pushState({}, '', '/subscription');
            }}
          />
        )}
      </main>

      {/* Fixed Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        language={settings.language}
        pendingCount={pendingInstallmentsCount}
      />

      {/* Create Payment Modal */}
      <CreatePaymentModal
        isOpen={isCreateOpen}
        language={settings.language}
        merchantProfile={profile}
        customers={customers}
        initialCustomer={initialCustomerForPayment}
        sessionCount={sessions.length}
        isPro={isPro}
        dailyUsage={dailyUsage}
        onOpenPricing={() => {
          setIsCreateOpen(false);
          setShowPricing(true);
          window.history.pushState({}, '', '/subscription');
        }}
        onClose={() => {
          setIsCreateOpen(false);
          setInitialCustomerForPayment(null);
        }}
        onCreated={handleCreateSession}
      />

      {/* Manual Payment Verification Confirmation Modal */}
      <ManualConfirmModal
        isOpen={isConfirmOpen}
        installment={selectedInstallment}
        upiId={selectedSession?.upiId || profile.upiId}
        language={settings.language}
        onConfirm={handleConfirmReceived}
        onCancel={() => setIsConfirmOpen(false)}
        isFinalInstallment={isFinalInstallment}
      />

      {/* Payment Detail Modal */}
      <PaymentDetailModal
        isOpen={isDetailOpen}
        session={selectedSession}
        auditEvents={auditEvents}
        language={settings.language}
        onClose={() => setIsDetailOpen(false)}
        onSelectInstallmentQr={(sess, inst) => {
          setSelectedSession(sess);
          setSelectedInstallment(inst);
          setIsDetailOpen(false);
          setActiveTab('payments');
        }}
        onOpenReceipt={(sess) => {
          setSelectedSession(sess);
          setIsDetailOpen(false);
          setIsReceiptOpen(true);
        }}
        onCancelSession={handleCancelSession}
      />

      {/* Printable / Downloadable Merchant Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        session={selectedSession}
        merchantProfile={profile}
        language={settings.language}
        onClose={() => setIsReceiptOpen(false)}
      />

      {/* 4-Screen Onboarding Guide */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        language={settings.language}
        onFinish={handleFinishOnboarding}
      />

      {/* Google Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        language={settings.language}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleGoogleSuccess}
      />

      {/* Welcome Back & Cloud Data Restore Modal */}
      {cloudBackupSummary && (
        <WelcomeBackModal
          isOpen={isWelcomeBackOpen}
          language={settings.language}
          stats={{
            customersCount: cloudBackupSummary.customersCount,
            sessionsCount: cloudBackupSummary.sessionsCount,
            totalRecordedPaise: 0,
          }}
          onSync={handleRestoreCloud}
          onDismiss={() => {
            setIsWelcomeBackOpen(false);
            triggerSync();
          }}
        />
      )}

      {/* Account Deletion Confirmation Modal */}
      <DeleteAccountModal
        isOpen={isDeleteAccountOpen}
        userEmail={user?.email || ''}
        onClose={() => setIsDeleteAccountOpen(false)}
        onConfirmDelete={async () => {
          if (user) {
            await ApiService.deleteAccount(user.id);
          }
          handleDeleteAccountSuccess();
        }}
      />

      {/* Legal and Compliance Modal */}
      {legalTab && (
        <LegalModal
          isOpen={true}
          initialTab={legalTab}
          onClose={() => setLegalTab(null)}
        />
      )}

      {/* Due Date Alerts & Notifications Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        alerts={activeAlerts}
        language={settings.language}
        onSelectAlert={(alert) => {
          handleSelectAlert(alert);
          setIsNotificationCenterOpen(false);
        }}
        onDismissAlert={(id) => {
          handleDismissAlert(id);
        }}
        onClearAll={() => {
          handleDismissAllAlerts();
        }}
        hasPushPermission={hasPushPermission}
        onRequestPushPermission={handleRequestPushPermission}
      />

      {/* Enterprise Security Architecture & Cloudflare Console Modal */}
      <SecurityArchitectureModal
        isOpen={isSecurityOpen}
        onClose={() => setIsSecurityOpen(false)}
        secondsRemaining={secondsLeft}
        onTestTimeout={() => {
          setIsSecurityOpen(false);
          handleLogout();
          setSecurityToast(
            'Security Simulation: Session was automatically locked due to 15-minute inactivity policy.'
          );
        }}
      />
    </div>
  );
}
