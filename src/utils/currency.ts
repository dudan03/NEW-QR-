/**
 * Financial & Currency Calculation Utilities for QR SplitPay India
 * Strictly follows integer minor currency units (paise) to prevent floating point inaccuracies.
 */

import { SplitCalculationItem } from '../types';

/**
 * Converts standard Rupee amount (string or number) to exact integer paise.
 * e.g. "10000" -> 1000000 paise
 * e.g. "2500.50" -> 250050 paise
 */
export function rupeesToPaise(rupees: number | string): number {
  if (typeof rupees === 'string') {
    // Remove any commas or spaces
    const cleanStr = rupees.replace(/,/g, '').trim();
    const parsed = parseFloat(cleanStr);
    if (isNaN(parsed) || parsed < 0) return 0;
    return Math.round(parsed * 100);
  }
  if (isNaN(rupees) || rupees < 0) return 0;
  return Math.round(rupees * 100);
}

/**
 * Converts integer paise to Rupee float for display/URI.
 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Formats paise into Indian Rupee currency format (e.g. ₹10,000 or ₹2,500.50).
 */
export function formatPaise(paise: number, includeDecimalsIfZero = false): string {
  const rupees = paise / 100;
  const hasDecimals = paise % 100 !== 0;

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: hasDecimals || includeDecimalsIfZero ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}

export const formatRupeesFromPaise = formatPaise;

/**
 * Format plain number with Indian numbering system (e.g. 1,00,000).
 */
export function formatIndianNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

/**
 * Validates UPI ID format (e.g. merchant@okhdfcbank, name@upi, 9876543210@paytm).
 */
export function isValidUpiId(upiId: string): boolean {
  if (!upiId || typeof upiId !== 'string') return false;
  const trimmed = upiId.trim();
  // Valid UPI ID pattern: user_name@bank_handle
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  return upiRegex.test(trimmed);
}

/**
 * Equal Split Calculation:
 * Divides totalPaise into `installmentCount` installments.
 * Distributes remainder paise one by one to initial installments.
 * Guaranteed: sum(result) === totalPaise
 */
export function calculateEqualSplit(totalPaise: number, installmentCount: number): SplitCalculationItem[] {
  if (installmentCount <= 0 || totalPaise <= 0) return [];

  const baseAmount = Math.floor(totalPaise / installmentCount);
  const remainder = totalPaise % installmentCount;

  const items: SplitCalculationItem[] = [];
  for (let i = 0; i < installmentCount; i++) {
    // First 'remainder' installments get 1 extra paise
    const installmentPaise = baseAmount + (i < remainder ? 1 : 0);
    items.push({
      sequence: i + 1,
      amountPaise: installmentPaise,
      amountRupees: installmentPaise / 100,
    });
  }

  return items;
}

/**
 * Maximum Installment Split:
 * Cuts chunks of maxInstallmentPaise until remaining is exhausted.
 */
export function calculateMaxSplit(totalPaise: number, maxInstallmentPaise: number): SplitCalculationItem[] {
  if (maxInstallmentPaise <= 0 || totalPaise <= 0) return [];

  const items: SplitCalculationItem[] = [];
  let remaining = totalPaise;
  let sequence = 1;

  while (remaining > 0) {
    const chunk = Math.min(remaining, maxInstallmentPaise);
    items.push({
      sequence,
      amountPaise: chunk,
      amountRupees: chunk / 100,
    });
    remaining -= chunk;
    sequence++;
  }

  return items;
}

/**
 * Custom Split Validation:
 * Checks if the sum of custom installments exactly matches totalPaise.
 */
export function validateCustomSplit(
  installmentsPaise: number[],
  totalPaise: number
): { isValid: boolean; diffPaise: number } {
  const sum = installmentsPaise.reduce((acc, curr) => acc + curr, 0);
  const diffPaise = totalPaise - sum;
  return {
    isValid: diffPaise === 0,
    diffPaise,
  };
}

/**
 * Generates official standard UPI URI according to NPCI specifications:
 * upi://pay?pa=<UPI_ID>&pn=<PAYEE_NAME>&am=<AMOUNT>&cu=INR&tn=<TRANSACTION_NOTE>&tr=<REF_ID>
 */
export function generateUpiUri(params: {
  upiId: string;
  payeeName?: string;
  amountPaise: number;
  note?: string;
  transactionRef?: string;
}): string {
  const { upiId, payeeName, amountPaise, note, transactionRef } = params;
  const amountStr = (amountPaise / 100).toFixed(2);

  const queryParts: string[] = [
    `pa=${encodeURIComponent(upiId.trim())}`,
    `pn=${encodeURIComponent((payeeName || 'Merchant').trim())}`,
    `am=${encodeURIComponent(amountStr)}`,
    `cu=INR`,
  ];

  if (note && note.trim()) {
    queryParts.push(`tn=${encodeURIComponent(note.trim())}`);
  }

  if (transactionRef && transactionRef.trim()) {
    queryParts.push(`tr=${encodeURIComponent(transactionRef.trim())}`);
  }

  return `upi://pay?${queryParts.join('&')}`;
}

/**
 * Generate a clean unique Session ID in format PAY-YYYYMMDD-XXX
 */
export function generateSessionId(indexCount: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const num = String(indexCount + 1).padStart(3, '0');
  return `PAY-${year}${month}${day}-${num}`;
}
