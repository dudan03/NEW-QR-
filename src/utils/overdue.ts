import { Installment, PaymentSession, SupportedLanguage } from '../types';

/**
 * Checks if a specific installment is overdue.
 * An installment is overdue if:
 * 1. It is not confirmed/settled (not MANUALLY_CONFIRMED or SUCCESS or CANCELLED)
 * 2. It has an explicit due date (or inherits the session due date) that has already passed.
 */
export function isInstallmentOverdue(
  installment: Installment,
  sessionDueDate?: string
): boolean {
  if (
    installment.status === 'MANUALLY_CONFIRMED' ||
    installment.status === 'SUCCESS' ||
    installment.status === 'CANCELLED'
  ) {
    return false;
  }

  const effectiveDueDate = installment.dueDate || sessionDueDate;
  if (!effectiveDueDate) {
    return false;
  }

  try {
    const dueTime = new Date(effectiveDueDate).getTime();
    if (isNaN(dueTime)) return false;
    return dueTime < Date.now();
  } catch {
    return false;
  }
}

export interface SessionOverdueStats {
  hasOverdue: boolean;
  overdueCount: number;
  overdueAmountPaise: number;
  oldestDueDate?: string;
  overdueInstallments: Installment[];
}

/**
 * Computes overdue statistics for a given payment session.
 */
export function getSessionOverdueStats(session: PaymentSession): SessionOverdueStats {
  if (session.status === 'COMPLETED' || session.status === 'CANCELLED') {
    return {
      hasOverdue: false,
      overdueCount: 0,
      overdueAmountPaise: 0,
      overdueInstallments: [],
    };
  }

  const overdueInstallments = session.installments.filter((inst) =>
    isInstallmentOverdue(inst, session.dueDate)
  );

  const overdueCount = overdueInstallments.length;
  const overdueAmountPaise = overdueInstallments.reduce(
    (sum, inst) => sum + inst.amountPaise,
    0
  );

  let oldestDueDate: string | undefined;
  if (overdueInstallments.length > 0) {
    const sorted = [...overdueInstallments].sort((a, b) => {
      const timeA = new Date(a.dueDate || session.dueDate || '').getTime() || 0;
      const timeB = new Date(b.dueDate || session.dueDate || '').getTime() || 0;
      return timeA - timeB;
    });
    oldestDueDate = sorted[0].dueDate || session.dueDate;
  }

  return {
    hasOverdue: overdueCount > 0,
    overdueCount,
    overdueAmountPaise,
    oldestDueDate,
    overdueInstallments,
  };
}

/**
 * Computes aggregate overdue statistics across all sessions.
 */
export function getAllOverdueStats(sessions: PaymentSession[]) {
  const overdueSessions: PaymentSession[] = [];
  let totalOverdueCount = 0;
  let totalOverduePaise = 0;

  for (const session of sessions) {
    const stats = getSessionOverdueStats(session);
    if (stats.hasOverdue) {
      overdueSessions.push(session);
      totalOverdueCount += stats.overdueCount;
      totalOverduePaise += stats.overdueAmountPaise;
    }
  }

  return {
    overdueSessions,
    totalOverdueSessions: overdueSessions.length,
    totalOverdueInstallments: totalOverdueCount,
    totalOverduePaise,
  };
}

/**
 * Formats how many days past due an installment is.
 */
export function formatOverdueRelative(
  dueDateIso: string,
  _language: SupportedLanguage = 'en'
): string {
  try {
    if (!dueDateIso) return 'Scheduled';
    const dueDate = new Date(dueDateIso);
    const time = dueDate.getTime();
    if (isNaN(time)) return 'Scheduled';

    const now = new Date();
    const diffMs = now.getTime() - time;
    if (diffMs <= 0) return 'Due today';

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      return diffHours > 1 ? `Due ${diffHours}h ago` : 'Due today';
    }
    if (diffDays === 1) return '1 day overdue';
    return `${diffDays} days overdue`;
  } catch {
    return 'Overdue';
  }
}
