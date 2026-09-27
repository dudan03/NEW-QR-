/**
 * Subscription & Billing Utilities for Split UPI QR Pro
 * Plan: Split UPI QR Pro — ₹999 for 6 Months
 *
 * Implements strict calendar-month duration calculations (PRD Section 11):
 * Example:
 * Start: 24 September 2026
 * Expiry: 24 March 2027
 */

import { Subscription } from '../types';

export const PRO_PLAN_DETAILS = {
  name: 'Split UPI QR Pro',
  priceRupees: 999,
  pricePaise: 99900,
  durationMonths: 6,
  currency: 'INR',
  tagline: 'Split. Scan. Track.',
  headline: 'Split UPI QR Pro — ₹999 / 6 Months',
  primaryCta: 'Get Pro for ₹999',
  secondaryCta: 'Continue with Free',
};

/**
 * Calculates exactly six calendar months from a given start date.
 * Does NOT merely add 180 days (6 × 30); handles varying month lengths accurately.
 * E.g., 24 Sept 2026 -> 24 March 2027.
 * If target month has fewer days (e.g., Aug 31 + 6 months -> Feb 28/29), clamps to end of month.
 */
export function calculateSixCalendarMonths(startDate: Date = new Date()): Date {
  const result = new Date(startDate.getTime());
  const originalDay = result.getDate();
  
  result.setMonth(result.getMonth() + 6);
  
  // If date overflowed to the following month (e.g. Feb 31 -> Mar 2/3), clamp to the last day of target month
  if (result.getDate() !== originalDay) {
    result.setDate(0); // Sets to last day of previous month
  }
  
  return result;
}

/**
 * Checks if a subscription is currently active based on status and calendar expiry.
 */
export function isSubscriptionActive(subscription: Subscription | null | undefined): boolean {
  if (!subscription) return false;
  if (subscription.plan !== 'PRO') return false;
  if (subscription.status !== 'ACTIVE') return false;
  
  const expiryTime = new Date(subscription.expiryDate).getTime();
  const now = Date.now();
  
  return expiryTime > now;
}

/**
 * Checks if a subscription has expired.
 */
export function isSubscriptionExpired(subscription: Subscription | null | undefined): boolean {
  if (!subscription) return false;
  if (subscription.plan !== 'PRO') return false;
  
  const expiryTime = new Date(subscription.expiryDate).getTime();
  const now = Date.now();
  
  return expiryTime <= now || subscription.status === 'EXPIRED';
}

/**
 * Calculates remaining days until subscription expires.
 */
export function getDaysRemaining(expiryDate: string): number {
  const expiryTime = new Date(expiryDate).getTime();
  const now = Date.now();
  const diffMs = expiryTime - now;
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Formats a calendar date in readable Indian English format (e.g. "24 March 2027").
 */
export function formatCalendarDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
