import { PaymentSession } from '../types';
import { getSessionOverdueStats, isInstallmentOverdue } from './overdue';

/**
 * Utility to escape CSV fields according to RFC 4180
 */
export function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Format paise to rupee decimal string e.g. 150000 -> 1500.00
 */
export function paiseToRupeesDecimal(paise: number): string {
  if (isNaN(paise) || !isFinite(paise)) return '0.00';
  return (paise / 100).toFixed(2);
}

/**
 * Format ISO date string into readable local timestamp for spreadsheet export
 */
export function formatCsvDateTime(isoString?: string): string {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toISOString().replace('T', ' ').slice(0, 19);
  } catch {
    return isoString;
  }
}

/**
 * Format ISO date string into readable date for spreadsheet export
 */
export function formatCsvDateOnly(isoString?: string): string {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toISOString().slice(0, 10);
  } catch {
    return isoString;
  }
}

/**
 * Generates formatted CSV string for sessions summary ledger
 */
export function generateSessionsSummaryCsv(
  sessions: PaymentSession[],
  businessName?: string
): string {
  const headers = [
    'Session ID',
    'Date Created',
    'Status',
    'Customer Name',
    'Phone',
    'Invoice ID',
    'Total Amount (₹)',
    'Confirmed Paid (₹)',
    'Pending Balance (₹)',
    'Total Installments',
    'Confirmed Installments',
    'Pending Installments',
    'Has Overdue',
    'Overdue Amount (₹)',
    'Final Due Date',
    'Split Method',
    'Merchant UPI ID',
    'Payee Name',
    'Notes',
    'Last Updated',
  ];

  const rows = sessions.map((session) => {
    let confirmedPaise = 0;
    let pendingPaise = 0;
    let confirmedCount = 0;

    for (const inst of session.installments) {
      if (inst.status === 'MANUALLY_CONFIRMED' || inst.status === 'SUCCESS') {
        confirmedPaise += inst.amountPaise;
        confirmedCount++;
      } else if (inst.status !== 'CANCELLED' && inst.status !== 'FAILED') {
        pendingPaise += inst.amountPaise;
      }
    }

    const overdueStats = getSessionOverdueStats(session);
    const pendingCount = session.installments.length - confirmedCount;

    return [
      escapeCsvField(session.id),
      escapeCsvField(formatCsvDateTime(session.createdAt)),
      escapeCsvField(session.status),
      escapeCsvField(session.customerName || 'Walk-in Customer'),
      escapeCsvField(session.customerPhone || 'N/A'),
      escapeCsvField(session.invoiceId || 'N/A'),
      paiseToRupeesDecimal(session.totalAmountPaise),
      paiseToRupeesDecimal(confirmedPaise),
      paiseToRupeesDecimal(pendingPaise),
      session.installments.length,
      confirmedCount,
      pendingCount,
      escapeCsvField(overdueStats.hasOverdue ? 'YES' : 'NO'),
      paiseToRupeesDecimal(overdueStats.overdueAmountPaise),
      escapeCsvField(formatCsvDateOnly(session.dueDate)),
      escapeCsvField(session.splitMethod),
      escapeCsvField(session.upiId),
      escapeCsvField(session.payeeName || businessName || ''),
      escapeCsvField(session.notes || ''),
      escapeCsvField(formatCsvDateTime(session.updatedAt)),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Generates formatted CSV string for itemized installments ledger
 */
export function generateDetailedInstallmentsCsv(
  sessions: PaymentSession[],
  businessName?: string
): string {
  const headers = [
    'Session ID',
    'Invoice ID',
    'Customer Name',
    'Customer Phone',
    'Installment Number',
    'Installment Amount (₹)',
    'Installment Status',
    'Due Date',
    'Is Overdue',
    'Confirmed Date',
    'Verification Mode',
    'Merchant UPI ID',
    'Session Total (₹)',
    'Session Overall Status',
    'Session Created At',
    'Installment Note',
  ];

  const rows: string[] = [];

  for (const session of sessions) {
    session.installments.forEach((inst, idx) => {
      const isOverdue = isInstallmentOverdue(inst, session.dueDate);
      const isConfirmed =
        inst.status === 'MANUALLY_CONFIRMED' || inst.status === 'SUCCESS';

      rows.push(
        [
          escapeCsvField(session.id),
          escapeCsvField(session.invoiceId || 'N/A'),
          escapeCsvField(session.customerName || 'Walk-in Customer'),
          escapeCsvField(session.customerPhone || 'N/A'),
          escapeCsvField(`${inst.sequence || idx + 1} of ${session.installments.length}`),
          paiseToRupeesDecimal(inst.amountPaise),
          escapeCsvField(inst.status),
          escapeCsvField(formatCsvDateOnly(inst.dueDate || session.dueDate)),
          escapeCsvField(isOverdue ? 'YES' : 'NO'),
          escapeCsvField(isConfirmed ? formatCsvDateTime(inst.confirmedAt || inst.updatedAt) : 'Pending'),
          escapeCsvField(inst.confirmationMethod || 'MANUAL'),
          escapeCsvField(session.upiId),
          paiseToRupeesDecimal(session.totalAmountPaise),
          escapeCsvField(session.status),
          escapeCsvField(formatCsvDateTime(session.createdAt)),
          escapeCsvField(inst.note || ''),
        ].join(',')
      );
    });
  }

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Triggers browser download of formatted CSV with UTF-8 BOM
 */
export function downloadCsv(csvContent: string, baseFilename: string): void {
  // Prepend UTF-8 BOM (\uFEFF) to make Excel / Google Sheets display Indian scripts and currency accurately
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  const todayStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `${baseFilename}-${todayStr}.csv`);

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1500);
}
