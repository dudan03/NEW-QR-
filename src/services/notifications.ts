import { PaymentSession, InAppAlert, SupportedLanguage } from '../types';
import { formatPaise } from '../utils/currency';

const NOTIFICATIONS_STORAGE_KEY = 'qr_splitpay_notifications_dismissed_v1';
const LAST_CHECK_KEY = 'qr_splitpay_last_notification_check';

export class NotificationScheduler {
  /**
   * Request system / browser push notification permission if available
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    try {
      const result = Notification.requestPermission();
      if (result && typeof (result as any).then === 'function') {
        return await result;
      }
      return await new Promise((resolve) => {
        Notification.requestPermission((permission) => resolve(permission));
      });
    } catch {
      return 'denied';
    }
  }

  /**
   * Check if push notifications are permitted
   */
  static hasPermission(): boolean {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    try {
      return Notification.permission === 'granted';
    } catch {
      return false;
    }
  }

  /**
   * Show a browser system push notification if permission is granted
   */
  static showSystemNotification(
    title: string,
    options?: {
      body?: string;
      tag?: string;
      icon?: string;
      badge?: string;
      data?: any;
    }
  ): boolean {
    if (!this.hasPermission()) {
      return false;
    }

    try {
      // Use serviceWorker registration showNotification if available, or fallback to new Notification()
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then((registration) => {
          if (registration && 'showNotification' in registration) {
            registration.showNotification(title, {
              body: options?.body,
              icon: options?.icon || '/icon.svg',
              badge: options?.badge || '/icon.svg',
              tag: options?.tag,
              data: options?.data,
              renotify: true,
            } as any).catch(() => {});
          } else {
            try {
              new Notification(title, {
                body: options?.body,
                icon: options?.icon || '/icon.svg',
                tag: options?.tag,
              });
            } catch {
              // Ignore illegal constructor on mobile Android
            }
          }
        }).catch(() => {
          try {
            new Notification(title, {
              body: options?.body,
              icon: options?.icon || '/icon.svg',
              tag: options?.tag,
            });
          } catch {}
        });
        return true;
      } else {
        try {
          new Notification(title, {
            body: options?.body,
            icon: options?.icon || '/icon.svg',
            tag: options?.tag,
          });
          return true;
        } catch {
          return false;
        }
      }
    } catch (e) {
      console.warn('Could not display system notification:', e);
      return false;
    }
  }

  /**
   * Scans all sessions and detects installments where due date is reached (today) or passed (overdue)
   */
  static checkDueAndOverdueInstallments(
    sessions: PaymentSession[]
  ): {
    alerts: InAppAlert[];
    newOverdueCount: number;
    newDueTodayCount: number;
  } {
    const alerts: InAppAlert[] = [];
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;

    let newOverdueCount = 0;
    let newDueTodayCount = 0;

    for (const session of sessions) {
      if (session.status === 'COMPLETED' || session.status === 'CANCELLED') {
        continue;
      }

      for (const inst of session.installments) {
        // Skip already confirmed or cancelled installments
        if (
          inst.status === 'MANUALLY_CONFIRMED' ||
          inst.status === 'SUCCESS' ||
          inst.status === 'CANCELLED'
        ) {
          continue;
        }

        const effectiveDueDate = inst.dueDate || session.dueDate;
        if (!effectiveDueDate) continue;

        try {
          const dueDateObj = new Date(effectiveDueDate);
          const dueTime = dueDateObj.getTime();
          if (isNaN(dueTime)) continue;

          const isOverdue = dueTime < todayStart;
          const isDueToday = dueTime >= todayStart && dueTime < todayEnd;

          if (isOverdue) {
            newOverdueCount++;
            const diffDays = Math.max(
              1,
              Math.floor((todayStart - dueTime) / (1000 * 60 * 60 * 24))
            );
            alerts.push({
              id: `alert-overdue-${inst.id}`,
              sessionId: session.id,
              installmentId: inst.id,
              customerName: session.customerName || 'Customer',
              amountPaise: inst.amountPaise,
              dueDate: effectiveDueDate,
              type: 'OVERDUE',
              daysOverdue: diffDays,
              timestamp: now.toISOString(),
            });
          } else if (isDueToday) {
            newDueTodayCount++;
            alerts.push({
              id: `alert-duetoday-${inst.id}`,
              sessionId: session.id,
              installmentId: inst.id,
              customerName: session.customerName || 'Customer',
              amountPaise: inst.amountPaise,
              dueDate: effectiveDueDate,
              type: 'DUE_TODAY',
              timestamp: now.toISOString(),
            });
          }
        } catch {
          // ignore date parse errors
        }
      }
    }

    return { alerts, newOverdueCount, newDueTodayCount };
  }

  /**
   * Helper to get list of dismissed alert IDs from localStorage
   */
  static getDismissedAlertIds(): string[] {
    try {
      const data = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Dismiss an alert so it doesn't prompt repeatedly in the current session
   */
  static dismissAlert(alertId: string): void {
    try {
      const list = this.getDismissedAlertIds();
      if (!list.includes(alertId)) {
        list.push(alertId);
        // Keep list bounded to last 100 entries
        const trimmed = list.slice(-100);
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(trimmed));
      }
    } catch {
      // ignore
    }
  }

  /**
   * Clear dismissed alerts history (e.g. on full reset or demo load)
   */
  static clearDismissedAlerts(): void {
    try {
      localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  /**
   * Dispatches push notification for highest priority overdue/due alert
   * Throttles to avoid spamming the user on every render
   */
  static triggerPushNotificationForAlerts(
    alerts: InAppAlert[],
    language: SupportedLanguage = 'en'
  ): void {
    if (!this.hasPermission() || alerts.length === 0) {
      return;
    }

    // Check throttle: at most once every 30 minutes for system push
    try {
      const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
      const now = Date.now();
      if (lastCheck && now - parseInt(lastCheck, 10) < 30 * 60 * 1000) {
        return; // Throttle push notification
      }
      localStorage.setItem(LAST_CHECK_KEY, now.toString());
    } catch {
      // ignore
    }

    const overdueAlerts = alerts.filter((a) => a.type === 'OVERDUE');
    const dueTodayAlerts = alerts.filter((a) => a.type === 'DUE_TODAY');

    let title = '';
    let body = '';

    if (overdueAlerts.length > 0) {
      const first = overdueAlerts[0];
      if (overdueAlerts.length === 1) {
        title = `⚠️ Payment Overdue: ${first.customerName}`;
        body = `Installment of ${formatPaise(first.amountPaise)} is ${first.daysOverdue || 1} day(s) overdue.`;
      } else {
        const totalPaise = overdueAlerts.reduce((sum, a) => sum + a.amountPaise, 0);
        title = `⚠️ ${overdueAlerts.length} Overdue Installments Pending`;
        body = `Total ${formatPaise(totalPaise)} is past due date across ${overdueAlerts.length} installments. Tap to review.`;
      }
    } else if (dueTodayAlerts.length > 0) {
      const first = dueTodayAlerts[0];
      if (dueTodayAlerts.length === 1) {
        title = `🔔 Payment Due Today: ${first.customerName}`;
        body = `Installment of ${formatPaise(first.amountPaise)} is due today.`;
      } else {
        const totalPaise = dueTodayAlerts.reduce((sum, a) => sum + a.amountPaise, 0);
        title = `🔔 ${dueTodayAlerts.length} Installments Due Today`;
        body = `Total ${formatPaise(totalPaise)} due today. Check customer status in QR SplitPay.`;
      }
    }

    if (title) {
      this.showSystemNotification(title, {
        body,
        tag: 'qr-splitpay-due-reminder',
        icon: '/icon.svg',
      });
    }
  }
}
