import {
  UserAccount,
  BusinessProfile,
  Customer,
  PaymentSession,
  AuditEvent,
  BackupExportData,
  Subscription,
  PaymentRecord,
  UsageSummary,
  AICategorizationResult,
} from '../types';

export class ApiService {
  private static getHeaders(userId?: string): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (userId) {
      headers['Authorization'] = `Bearer ${userId}`;
      headers['x-user-id'] = userId;
    }
    return headers;
  }

  /**
   * Google Sign-In: Authenticates or registers user account
   */
  static async loginWithGoogle(payload?: {
    email?: string;
    name?: string;
    avatarUrl?: string;
    googleId?: string;
  }): Promise<{
    user: UserAccount;
    business: BusinessProfile;
    isNewUser: boolean;
    stats: { customersCount: number; sessionsCount: number; totalRecordedPaise: number };
  }> {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
    });
    if (!res.ok) {
      throw new Error(`Google login failed: ${res.statusText}`);
    }
    return res.json();
  }

  /**
   * Fetch current authenticated user & business
   */
  static async getCurrentUser(userId: string): Promise<{ user: UserAccount; business: BusinessProfile }> {
    const res = await fetch('/api/auth/me', {
      headers: this.getHeaders(userId),
    });
    if (!res.ok) {
      throw new Error('Not authenticated');
    }
    return res.json();
  }

  /**
   * Logout
   */
  static async logout(): Promise<void> {
    await fetch('/api/auth/logout', { method: 'POST' });
  }

  /**
   * Delete account permanently
   */
  static async deleteAccount(userId: string): Promise<void> {
    const res = await fetch('/api/auth/delete-account', {
      method: 'POST',
      headers: this.getHeaders(userId),
    });
    if (!res.ok) {
      throw new Error('Failed to delete account');
    }
  }

  /**
   * Push & Pull Cloud Synchronization (record-level with conflict resolution)
   */
  static async sync(
    userId: string,
    data: {
      lastSyncTime: string | null;
      sessions: PaymentSession[];
      customers: Customer[];
      auditEvents: AuditEvent[];
      business: BusinessProfile;
    }
  ): Promise<{
    syncedAt: string;
    status: 'synced';
    customers: Customer[];
    sessions: PaymentSession[];
    auditEvents: AuditEvent[];
    business: BusinessProfile | null;
    usage?: UsageSummary;
  }> {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: this.getHeaders(userId),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error(`Sync request failed with code ${res.status}`);
    }
    return res.json();
  }

  /**
   * Fetch today's QR payment session usage for Free plan (PRD Section 4 & 5)
   */
  static async getDailyUsage(userId: string): Promise<UsageSummary> {
    const today = new Date().toISOString().slice(0, 10);
    const defaultUsage: UsageSummary = {
      used: 0,
      limit: 3,
      remaining: 3,
      canCreate: true,
      date: today,
      isPro: false,
      plan: 'FREE',
    };

    try {
      const res = await fetch('/api/usage/today', {
        headers: this.getHeaders(userId),
      });
      if (!res.ok) {
        return defaultUsage;
      }
      return await res.json();
    } catch {
      return defaultUsage;
    }
  }

  /**
   * Create a new payment session on the server with atomic daily usage enforcement
   */
  static async createPaymentSession(
    userId: string,
    session: PaymentSession
  ): Promise<{ session: PaymentSession; usage?: UsageSummary }> {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: this.getHeaders(userId),
      body: JSON.stringify(session),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'FAILED_TO_CREATE' }));
      const errorObj = new Error(err.message || 'Failed to create payment session') as any;
      errorObj.code = err.error;
      errorObj.usage = err.usage;
      throw errorObj;
    }
    return res.json();
  }

  /**
   * Export complete backup data
   */
  static async exportBackup(userId: string): Promise<BackupExportData> {
    const res = await fetch('/api/backup/export', {
      headers: this.getHeaders(userId),
    });
    if (!res.ok) {
      throw new Error('Export backup failed');
    }
    return res.json();
  }

  /**
   * Fetch cloud backup summary & records
   */
  static async fetchCloudBackup(userId: string): Promise<{
    sessions: PaymentSession[];
    customers: Customer[];
    lastBackupTime: string;
  }> {
    const backup = await this.exportBackup(userId);
    return {
      sessions: backup.sessions || [],
      customers: backup.customers || [],
      lastBackupTime: backup.exportedAt || new Date().toISOString(),
    };
  }

  /**
   * Restore data from backup
   */
  static async restoreBackup(
    userId: string,
    backup: BackupExportData
  ): Promise<{ success: boolean; message: string; customersCount: number; sessionsCount: number }> {
    const res = await fetch('/api/backup/restore', {
      method: 'POST',
      headers: this.getHeaders(userId),
      body: JSON.stringify(backup),
    });
    if (!res.ok) {
      throw new Error('Restore backup failed');
    }
    return res.json();
  }

  /**
   * Confirm installment on server
   */
  static async confirmInstallment(
    userId: string,
    sessionId: string,
    instId: string,
    note?: string
  ): Promise<{ session: PaymentSession }> {
    const res = await fetch(`/api/sessions/${sessionId}/installments/${instId}/confirm`, {
      method: 'POST',
      headers: this.getHeaders(userId),
      body: JSON.stringify({ note }),
    });
    if (!res.ok) {
      throw new Error('Confirmation sync failed');
    }
    return res.json();
  }

  /**
   * Fetch current subscription and payment history (PRD Section 12 & 15)
   */
  static async getSubscription(userId: string): Promise<{
    subscription: Subscription | null;
    isPro: boolean;
    isExpired: boolean;
    daysRemaining: number;
    plan: 'PRO' | 'FREE';
    payments: PaymentRecord[];
  }> {
    try {
      const res = await fetch('/api/subscription', {
        headers: this.getHeaders(userId),
      });
      if (!res.ok) {
        return {
          subscription: null,
          isPro: false,
          isExpired: false,
          daysRemaining: 0,
          plan: 'FREE',
          payments: [],
        };
      }
      return await res.json();
    } catch {
      return {
        subscription: null,
        isPro: false,
        isExpired: false,
        daysRemaining: 0,
        plan: 'FREE',
        payments: [],
      };
    }
  }

  /**
   * Initiate subscription checkout order (PRD Section 5 & 6)
   */
  static async createSubscriptionCheckout(
    userId: string,
    customerData: {
      firstName: string;
      lastName?: string;
      email: string;
      phone?: string;
    }
  ): Promise<{
    orderId: string;
    amountPaise: number;
    amountRupees: number;
    currency: string;
    plan: string;
    durationMonths: number;
    customer: { name: string; email: string; phone?: string };
    checkoutToken: string;
    timestamp: string;
  }> {
    const res = await fetch('/api/subscription/checkout', {
      method: 'POST',
      headers: this.getHeaders(userId),
      body: JSON.stringify(customerData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Checkout initiation failed' }));
      throw new Error(err.error || 'Failed to initiate checkout');
    }
    return res.json();
  }

  /**
   * Verify subscription payment cryptographically and activate Pro (PRD Section 5, 8, 10)
   */
  static async verifySubscriptionPayment(
    userId: string,
    verificationData: {
      orderId: string;
      providerPaymentId: string;
      signature?: string;
      razorpayOrderId?: string;
      timestamp?: string;
    }
  ): Promise<{
    success: boolean;
    alreadyProcessed?: boolean;
    message: string;
    subscription: Subscription;
    payment: PaymentRecord;
  }> {
    const res = await fetch('/api/subscription/verify', {
      method: 'POST',
      headers: this.getHeaders(userId),
      body: JSON.stringify(verificationData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Payment verification failed' }));
      throw new Error(err.error || 'Payment verification failed');
    }
    return res.json();
  }

  /**
   * Auto-categorize session and suggest tags using Gemini 3.8 Flash
   */
  static async categorizeSession(
    userId: string,
    data: {
      title?: string;
      notes?: string;
      customerName?: string;
      amountPaise?: number;
    }
  ): Promise<AICategorizationResult> {
    const res = await fetch('/api/ai/categorize', {
      method: 'POST',
      headers: this.getHeaders(userId),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      // Fallback
      return {
        suggestedCategory: 'Retail',
        suggestedTags: ['Retail', 'Service', 'Freelance'],
        confidence: 'low',
        reason: 'Default tags',
      };
    }
    return res.json();
  }
}
