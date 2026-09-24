/**
 * Local Data Storage & Repository Service for QR SplitPay India v2.0
 * Fully offline-first with automatic background cloud synchronization and conflict handling.
 */

import {
  PaymentSession,
  AuditEvent,
  BusinessProfile,
  AppSettings,
  PaymentState,
  SessionStatus,
  Installment,
  Customer,
  UserAccount,
  SyncStatusState,
  BackupExportData,
} from '../types';
import { generateUpiUri } from '../utils/currency';
import { getSessionOverdueStats } from '../utils/overdue';
import { generateSessionsSummaryCsv } from '../utils/csvExport';
import { ApiService } from './api';

const STORAGE_KEYS = {
  USER: 'qr_splitpay_user_v2',
  SESSIONS: 'qr_splitpay_sessions_v2',
  CUSTOMERS: 'qr_splitpay_customers_v2',
  AUDIT: 'qr_splitpay_audit_v2',
  PROFILE: 'qr_splitpay_profile_v2',
  SETTINGS: 'qr_splitpay_settings_v2',
  LAST_SYNC: 'qr_splitpay_last_sync_v2',
  PENDING_QUEUE: 'qr_splitpay_pending_queue_v2',
};

const DEFAULT_PROFILE: BusinessProfile = {
  id: 'biz-default-01',
  businessName: 'Sharma Electronics & Services',
  displayName: 'Ramesh Sharma',
  upiId: 'sharma.stores@upi',
  phone: '+91 98765 43210',
  email: 'ramesh.sharma@example.com',
  address: 'Shop 14, Main Market, Bhubaneswar, Odisha',
  invoicePrefix: 'INV',
  receiptFooter: 'Thank you for your business! Merchant-generated payment record.',
  currency: 'INR',
  language: 'en',
  updatedAt: new Date().toISOString(),
};

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  language: 'en',
  defaultSplitMethod: 'EQUAL',
  biometricEnabled: false,
  hasCompletedOnboarding: false,
  soundEnabled: true,
  autoSync: true,
  notificationsEnabled: true,
};

export class StorageService {
  // ---------------- USER AUTH ----------------
  static getUser(): UserAccount | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  static saveUser(user: UserAccount | null): void {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    } catch (e) {
      console.error('Failed to save user in localStorage', e);
    }
  }

  static clearUser(): void {
    this.saveUser(null);
  }

  // ---------------- SESSIONS ----------------
  static getSessions(): PaymentSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (!data) return [];
      const sessions: PaymentSession[] = JSON.parse(data);
      let modified = false;
      for (const s of sessions) {
        if (s.id === 'PAY-DEMO-2026-001' && s.installments) {
          const inst3 = s.installments.find((i) => i.sequence === 3);
          if (inst3 && !inst3.dueDate) {
            inst3.dueDate = new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString();
            modified = true;
          }
          const inst4 = s.installments.find((i) => i.sequence === 4);
          if (inst4 && !inst4.dueDate) {
            inst4.dueDate = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
            modified = true;
          }
        }
      }
      if (modified) {
        this.saveSessions(sessions);
      }
      return sessions;
    } catch {
      return [];
    }
  }

  static saveSessions(sessions: PaymentSession[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save sessions', e);
    }
  }

  static saveSession(session: PaymentSession): void {
    const sessions = this.getSessions();
    const index = sessions.findIndex((s) => s.id === session.id);
    session.updatedAt = new Date().toISOString();
    if (!session.createdAt) session.createdAt = session.updatedAt;

    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.unshift(session);
    }
    this.saveSessions(sessions);
    this.queuePendingChange('session', session);
  }

  static deleteSession(sessionId: string): void {
    const sessions = this.getSessions().filter((s) => s.id !== sessionId);
    this.saveSessions(sessions);
  }

  // ---------------- CUSTOMERS ----------------
  static getCustomers(): Customer[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveCustomers(customers: Customer[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    } catch (e) {
      console.error('Failed to save customers', e);
    }
  }

  static saveCustomer(customer: Customer): Customer {
    const customers = this.getCustomers();
    const now = new Date().toISOString();
    if (!customer.id) {
      customer.id = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      customer.createdAt = now;
    }
    customer.updatedAt = now;

    const index = customers.findIndex((c) => c.id === customer.id);
    if (index >= 0) {
      customers[index] = customer;
    } else {
      customers.unshift(customer);
    }
    this.saveCustomers(customers);
    this.queuePendingChange('customer', customer);
    return customer;
  }

  static deleteCustomer(customerId: string): void {
    const customers = this.getCustomers().filter((c) => c.id !== customerId);
    this.saveCustomers(customers);
  }

  // ---------------- AUDIT TRAIL ----------------
  static getAuditEvents(): AuditEvent[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static recordAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
    const fullEvent: AuditEvent = {
      ...event,
      id: `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    try {
      const events = this.getAuditEvents();
      events.unshift(fullEvent);
      localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(events));
    } catch (e) {
      console.error('Failed to save audit event', e);
    }
    return fullEvent;
  }

  // ---------------- PROFILE & SETTINGS ----------------
  static getProfile(): BusinessProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return data ? { ...DEFAULT_PROFILE, ...JSON.parse(data) } : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  }

  static saveProfile(profile: BusinessProfile): void {
    try {
      profile.updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
      this.queuePendingChange('profile', profile);
    } catch (e) {
      console.error('Failed to save profile', e);
    }
  }

  static getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  static saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  }

  // ---------------- OFFLINE QUEUE & SYNC ----------------
  static getLastSyncTime(): string | null {
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  }

  static setLastSyncTime(time: string): void {
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, time);
  }

  static getPendingQueue(): any[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PENDING_QUEUE);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static queuePendingChange(type: string, data: any): void {
    try {
      const queue = this.getPendingQueue();
      queue.push({ type, data, timestamp: new Date().toISOString() });
      localStorage.setItem(STORAGE_KEYS.PENDING_QUEUE, JSON.stringify(queue));
    } catch (e) {
      console.error('Failed to queue change', e);
    }
  }

  static clearPendingQueue(): void {
    localStorage.removeItem(STORAGE_KEYS.PENDING_QUEUE);
  }

  /**
   * Performs full record-level synchronization with the backend
   */
  static async performSync(): Promise<{
    success: boolean;
    status: SyncStatusState;
    message?: string;
  }> {
    const user = this.getUser();
    if (!user) {
      return { success: true, status: 'synced', message: 'Offline local mode active' };
    }

    if (!navigator.onLine) {
      return { success: false, status: 'offline', message: 'No internet connection' };
    }

    try {
      const localSessions = this.getSessions();
      const localCustomers = this.getCustomers();
      const localAudits = this.getAuditEvents();
      const localProfile = this.getProfile();
      const lastSync = this.getLastSyncTime();

      const response = await ApiService.sync(user.id, {
        lastSyncTime: lastSync,
        sessions: localSessions,
        customers: localCustomers,
        auditEvents: localAudits,
        business: localProfile,
      });

      // Update local storage with server-merged datasets
      this.saveSessions(response.sessions);
      this.saveCustomers(response.customers);
      if (response.business) {
        this.saveProfile(response.business);
      }
      this.setLastSyncTime(response.syncedAt);
      this.clearPendingQueue();

      return { success: true, status: 'synced' };
    } catch (err: any) {
      console.error('Sync failed:', err);
      return {
        success: false,
        status: 'error',
        message: err.message || 'Sync failed',
      };
    }
  }

  // ---------------- INSTALLMENT TRANSITIONS ----------------
  static updateInstallmentState(
    sessionId: string,
    installmentId: string,
    newState: PaymentState,
    note?: string
  ): { session: PaymentSession; installment: Installment } | null {
    const sessions = this.getSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return null;

    const installment = session.installments.find((i) => i.id === installmentId);
    if (!installment) return null;

    const prevState = installment.status;
    if (prevState === 'FAILED' && newState === 'SUCCESS') {
      return null;
    }

    installment.status = newState;
    const now = new Date().toISOString();
    installment.updatedAt = now;

    if (newState === 'MANUALLY_CONFIRMED') {
      installment.confirmationMethod = 'MANUAL';
      installment.confirmedAt = now;
    } else if (newState === 'SUCCESS') {
      installment.confirmationMethod = 'LEGITIMATE_PROVIDER';
      installment.confirmedAt = now;
    }

    this.recordAuditEvent({
      sessionId: session.id,
      installmentId: installment.id,
      installmentSequence: installment.sequence,
      previousState: prevState,
      newState,
      confirmationMethod: installment.confirmationMethod,
      note: note || `State transitioned from ${prevState} to ${newState}`,
    });

    this.recomputeSessionStatus(session);
    session.updatedAt = now;
    this.saveSessions(sessions);
    this.queuePendingChange('session', session);

    return { session, installment };
  }

  static recomputeSessionStatus(session: PaymentSession): void {
    const confirmedCount = session.installments.filter(
      (i) => i.status === 'MANUALLY_CONFIRMED' || i.status === 'SUCCESS'
    ).length;
    const totalCount = session.installments.length;

    const prevStatus = session.status;
    let nextStatus: SessionStatus = 'ACTIVE';

    if (confirmedCount === totalCount && totalCount > 0) {
      nextStatus = 'COMPLETED';
    } else if (confirmedCount > 0) {
      nextStatus = 'PARTIALLY_PAID';
    } else if (session.installments.some((i) => i.status === 'FAILED')) {
      nextStatus = 'PAYMENT_ISSUE';
    } else if (session.installments.every((i) => i.status === 'CANCELLED')) {
      nextStatus = 'CANCELLED';
    } else {
      nextStatus = 'ACTIVE';
    }

    if (prevStatus !== nextStatus) {
      session.status = nextStatus;
      this.recordAuditEvent({
        sessionId: session.id,
        previousState: prevStatus,
        newState: nextStatus,
        note: `Session overall status automatically updated to ${nextStatus}`,
      });
    }
  }

  // ---------------- SEED DEMO DATA ----------------
  static seedDemoData(): PaymentSession {
    const demoSessionId = 'PAY-DEMO-2026-001';
    const totalAmountPaise = 1000000; // ₹10,000
    const installmentAmountPaise = 250000; // ₹2,500
    const upiId = 'demo@upi';
    const payeeName = 'Sharma Electronics & Services';

    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 3600 * 1000).toISOString();
    const oneHourAgo = new Date(now.getTime() - 1 * 3600 * 1000).toISOString();

    // Ensure Rahul Kumar exists as a CRM customer
    const customers = this.getCustomers();
    let demoCustomer = customers.find((c) => c.name.toLowerCase() === 'rahul kumar');
    if (!demoCustomer) {
      demoCustomer = {
        id: 'cust-demo-rahul',
        name: 'Rahul Kumar',
        phone: '+91 98765 43210',
        email: 'rahul.kumar@example.com',
        address: 'Bapuji Nagar, Bhubaneswar',
        notes: 'Frequent electronics purchaser; prefers 4 installment UPI splits.',
        createdAt: twoHoursAgo,
        updatedAt: twoHoursAgo,
      };
      customers.unshift(demoCustomer);
      this.saveCustomers(customers);
    }

    const installments: Installment[] = [
      {
        id: `${demoSessionId}-INS-1`,
        sessionId: demoSessionId,
        sequence: 1,
        amountPaise: installmentAmountPaise,
        paymentUri: generateUpiUri({
          upiId,
          payeeName,
          amountPaise: installmentAmountPaise,
          note: 'Demo Installment 1 of 4',
          transactionRef: `${demoSessionId}-1`,
        }),
        status: 'MANUALLY_CONFIRMED',
        confirmationMethod: 'MANUAL',
        createdAt: twoHoursAgo,
        updatedAt: twoHoursAgo,
        confirmedAt: twoHoursAgo,
        dueDate: new Date(now.getTime() - 14 * 24 * 3600 * 1000).toISOString(),
        note: 'First installment verified via merchant banking app',
      },
      {
        id: `${demoSessionId}-INS-2`,
        sessionId: demoSessionId,
        sequence: 2,
        amountPaise: installmentAmountPaise,
        paymentUri: generateUpiUri({
          upiId,
          payeeName,
          amountPaise: installmentAmountPaise,
          note: 'Demo Installment 2 of 4',
          transactionRef: `${demoSessionId}-2`,
        }),
        status: 'MANUALLY_CONFIRMED',
        confirmationMethod: 'MANUAL',
        createdAt: twoHoursAgo,
        updatedAt: oneHourAgo,
        confirmedAt: oneHourAgo,
        dueDate: new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString(),
        note: 'Second installment confirmed after UPI credit alert',
      },
      {
        id: `${demoSessionId}-INS-3`,
        sessionId: demoSessionId,
        sequence: 3,
        amountPaise: installmentAmountPaise,
        paymentUri: generateUpiUri({
          upiId,
          payeeName,
          amountPaise: installmentAmountPaise,
          note: 'Demo Installment 3 of 4',
          transactionRef: `${demoSessionId}-3`,
        }),
        status: 'PENDING',
        confirmationMethod: 'NONE',
        createdAt: twoHoursAgo,
        updatedAt: now.toISOString(),
        dueDate: new Date(now.getTime() - 2 * 24 * 3600 * 1000).toISOString(), // 2 days overdue
        note: 'Awaiting customer scan and bank credit verification',
      },
      {
        id: `${demoSessionId}-INS-4`,
        sessionId: demoSessionId,
        sequence: 4,
        amountPaise: installmentAmountPaise,
        paymentUri: generateUpiUri({
          upiId,
          payeeName,
          amountPaise: installmentAmountPaise,
          note: 'Demo Installment 4 of 4',
          transactionRef: `${demoSessionId}-4`,
        }),
        status: 'QR_READY',
        confirmationMethod: 'NONE',
        createdAt: twoHoursAgo,
        updatedAt: twoHoursAgo,
        dueDate: new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString(),
      },
    ];

    const demoSession: PaymentSession = {
      id: demoSessionId,
      customerId: demoCustomer.id,
      customerName: 'Rahul Kumar',
      customerPhone: '+91 98765 43210',
      upiId,
      payeeName,
      totalAmountPaise,
      invoiceId: 'INV-2026-089',
      notes: 'Agreed on 4 bi-weekly UPI payments for electronics purchase.',
      splitMethod: 'EQUAL',
      status: 'PARTIALLY_PAID',
      installments,
      dueDate: new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString(),
      isDemo: true,
      createdAt: twoHoursAgo,
      updatedAt: now.toISOString(),
    };

    const currentSessions = this.getSessions().filter((s) => s.id !== demoSessionId);
    currentSessions.unshift(demoSession);
    this.saveSessions(currentSessions);

    this.recordAuditEvent({
      sessionId: demoSessionId,
      newState: 'DRAFT',
      note: 'Demo session initialized with 4 installments',
    });

    return demoSession;
  }

  // ---------------- ANALYTICS ----------------
  static getDashboardAnalytics() {
    const sessions = this.getSessions();
    const customers = this.getCustomers();
    const today = new Date().toISOString().slice(0, 10);

    let todaysCollectionPaise = 0;
    let pendingAmountPaise = 0;
    let completedPaymentsCount = 0;
    let activeSessionsCount = 0;
    let totalConfirmedPaise = 0;
    let overdueSessionsCount = 0;
    let overdueInstallmentsCount = 0;
    let overdueAmountPaise = 0;

    for (const session of sessions) {
      if (session.status === 'COMPLETED') {
        completedPaymentsCount++;
      } else if (session.status === 'ACTIVE' || session.status === 'PARTIALLY_PAID') {
        activeSessionsCount++;
      }

      const overdueStats = getSessionOverdueStats(session);
      if (overdueStats.hasOverdue) {
        overdueSessionsCount++;
        overdueInstallmentsCount += overdueStats.overdueCount;
        overdueAmountPaise += overdueStats.overdueAmountPaise;
      }

      for (const inst of session.installments) {
        const isConfirmed = inst.status === 'MANUALLY_CONFIRMED' || inst.status === 'SUCCESS';
        if (isConfirmed) {
          totalConfirmedPaise += inst.amountPaise;
          const confirmedDate = (inst.confirmedAt || inst.updatedAt || '').slice(0, 10);
          if (confirmedDate === today) {
            todaysCollectionPaise += inst.amountPaise;
          }
        } else if (inst.status !== 'CANCELLED' && inst.status !== 'FAILED') {
          if (session.status === 'ACTIVE' || session.status === 'PARTIALLY_PAID' || session.status === 'DRAFT') {
            pendingAmountPaise += inst.amountPaise;
          }
        }
      }
    }

    return {
      todaysCollectionPaise,
      pendingAmountPaise,
      completedPaymentsCount,
      activeSessionsCount,
      totalSessions: sessions.length,
      totalCustomers: customers.length,
      totalConfirmedPaise,
      overdueSessionsCount,
      overdueInstallmentsCount,
      overdueAmountPaise,
    };
  }

  // ---------------- EXPORT & RESTORE ----------------
  static clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.AUDIT);
    localStorage.removeItem(STORAGE_KEYS.PENDING_QUEUE);
    localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
  }

  static exportBackup(): BackupExportData {
    return {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      user: this.getUser(),
      business: this.getProfile(),
      customers: this.getCustomers(),
      sessions: this.getSessions(),
      auditEvents: this.getAuditEvents(),
    };
  }

  static exportSessionsCsv(sessionsList?: PaymentSession[]): string {
    const sessions = sessionsList || this.getSessions();
    const profile = this.getProfile();
    return generateSessionsSummaryCsv(sessions, profile.businessName);
  }

  static exportCustomersCsv(): string {
    const customers = this.getCustomers();
    const sessions = this.getSessions();

    const headers = [
      'Customer ID',
      'Name',
      'Phone',
      'Email',
      'Address',
      'Sessions Count',
      'Total Recorded (₹)',
      'Total Paid (₹)',
    ];

    const rows = customers.map((c) => {
      const custSessions = sessions.filter(
        (s) => s.customerId === c.id || (s.customerPhone && s.customerPhone === c.phone)
      );
      const totalRecordedPaise = custSessions.reduce((sum, s) => sum + s.totalAmountPaise, 0);
      const totalPaidPaise = custSessions.reduce((sum, s) => {
        return (
          sum +
          s.installments
            .filter((i) => i.status === 'MANUALLY_CONFIRMED' || i.status === 'SUCCESS')
            .reduce((iSum, i) => iSum + i.amountPaise, 0)
        );
      }, 0);

      return [
        `"${c.id}"`,
        `"${c.name.replace(/"/g, '""')}"`,
        `"${c.phone.replace(/"/g, '""')}"`,
        `"${(c.email || '').replace(/"/g, '""')}"`,
        `"${(c.address || '').replace(/"/g, '""')}"`,
        custSessions.length,
        (totalRecordedPaise / 100).toFixed(2),
        (totalPaidPaise / 100).toFixed(2),
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  static restoreBackup(backup: BackupExportData): boolean {
    try {
      if (backup.business) this.saveProfile(backup.business);
      if (Array.isArray(backup.customers)) this.saveCustomers(backup.customers);
      if (Array.isArray(backup.sessions)) this.saveSessions(backup.sessions);
      if (Array.isArray(backup.auditEvents)) {
        localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(backup.auditEvents));
      }
      return true;
    } catch (e) {
      console.error('Failed to restore backup locally', e);
      return false;
    }
  }

  static importBackup(backup: BackupExportData): boolean {
    return this.restoreBackup(backup);
  }

  static getSyncStatus(): SyncStatusState {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return 'offline';
    }
    const queue = this.getPendingQueue();
    if (queue.length > 0) {
      return 'syncing';
    }
    return 'synced';
  }
}
