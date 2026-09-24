/**
 * Domain types for QR SplitPay India v2.0
 * Strictly follows the Product Requirements Document (PRD v2.0)
 */

export type PaymentState =
  | 'DRAFT'
  | 'QR_READY'
  | 'PAYMENT_INITIATED'
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED'
  | 'MANUALLY_CONFIRMED';

export type SessionStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'PARTIALLY_PAID'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'PAYMENT_ISSUE';

export type SplitMethod = 'EQUAL' | 'MAX_INSTALLMENT' | 'CUSTOM';

export type ConfirmationMethod = 'MANUAL' | 'NONE' | 'LEGITIMATE_PROVIDER';

export type SupportedLanguage = 'en' | 'hi' | 'or';

export type SubscriptionPlan = 'FREE' | 'PRO' | 'BUSINESS';

export type SyncStatusState = 'synced' | 'syncing' | 'offline' | 'error';

export interface UserAccount {
  id: string;
  googleId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  picture?: string;
  plan: SubscriptionPlan;
  subscriptionTier?: SubscriptionPlan;
  createdAt: string;
  lastLoginAt: string;
  businessId: string;
}

export interface BusinessProfile {
  id: string;
  userId?: string;
  businessName: string;
  displayName: string;
  upiId: string;
  phone?: string;
  email?: string;
  address?: string;
  logo?: string;
  invoicePrefix?: string;
  receiptFooter?: string;
  currency?: string;
  language?: SupportedLanguage;
  updatedAt?: string;
}

export type MerchantProfile = BusinessProfile;

export interface Customer {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Installment {
  id: string;
  sessionId: string;
  sequence: number; // 1, 2, 3...
  amountPaise: number; // minor currency unit (paise)
  paymentUri: string;
  status: PaymentState;
  confirmationMethod: ConfirmationMethod;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  confirmedAt?: string;
  note?: string;
}

export interface PaymentSession {
  id: string; // e.g. PAY-20260924-001
  userId?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  upiId: string;
  payeeName?: string;
  totalAmountPaise: number;
  invoiceId?: string;
  notes?: string;
  splitMethod: SplitMethod;
  status: SessionStatus;
  installments: Installment[];
  dueDate?: string;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  userId?: string;
  sessionId: string;
  installmentId?: string;
  installmentSequence?: number;
  previousState?: PaymentState | SessionStatus;
  newState: PaymentState | SessionStatus;
  timestamp: string;
  confirmationMethod?: ConfirmationMethod | string;
  note?: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: SupportedLanguage;
  defaultSplitMethod: SplitMethod;
  biometricEnabled: boolean;
  hasCompletedOnboarding: boolean;
  soundEnabled: boolean;
  autoSync: boolean;
  notificationsEnabled?: boolean;
}

export interface InAppAlert {
  id: string;
  sessionId: string;
  installmentId?: string;
  customerName: string;
  amountPaise: number;
  dueDate: string;
  type: 'DUE_TODAY' | 'OVERDUE';
  daysOverdue?: number;
  timestamp: string;
  dismissed?: boolean;
}

export interface SplitCalculationItem {
  sequence: number;
  amountPaise: number;
  amountRupees: number;
}

export interface CloudBackupInfo {
  connected: boolean;
  userEmail: string | null;
  lastSyncTime: string | null;
  status: SyncStatusState;
  errorMessage?: string;
  pendingChangesCount: number;
}

export interface BackupExportData {
  version: string;
  exportedAt: string;
  user?: UserAccount | null;
  business: BusinessProfile;
  customers: Customer[];
  sessions: PaymentSession[];
  auditEvents: AuditEvent[];
}
