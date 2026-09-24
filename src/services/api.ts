import {
  UserAccount,
  BusinessProfile,
  Customer,
  PaymentSession,
  AuditEvent,
  BackupExportData,
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
}
