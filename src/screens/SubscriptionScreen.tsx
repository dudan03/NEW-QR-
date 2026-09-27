import React, { useState, useEffect } from 'react';
import {
  UserAccount,
  Subscription,
  PaymentRecord,
  SubscriptionPaymentStatus,
  SupportedLanguage,
  UsageSummary,
} from '../types';
import { ApiService } from '../services/api';
import { StorageService } from '../services/storage';
import {
  calculateSixCalendarMonths,
  formatCalendarDate,
  getDaysRemaining,
  isSubscriptionActive,
  isSubscriptionExpired,
  PRO_PLAN_DETAILS,
} from '../utils/subscription';
import confetti from 'canvas-confetti';
import {
  Check,
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  Lock,
  RefreshCw,
  QrCode,
  Layers,
  Users,
  FileText,
  BarChart3,
  Cloud,
  Moon,
  ChevronDown,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  X,
  CreditCard,
  Smartphone,
} from 'lucide-react';

interface SubscriptionScreenProps {
  user: UserAccount | null;
  language: SupportedLanguage;
  onOpenAuth: () => void;
  onClose: () => void;
  onSubscriptionUpdated?: () => void;
  dailyUsage?: UsageSummary | null;
}

export const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({
  user,
  language,
  onOpenAuth,
  onClose,
  onSubscriptionUpdated,
  dailyUsage,
}) => {
  // Subscription state from server
  const [subscription, setSubscription] = useState<Subscription | null>(() =>
    StorageService.getSubscription()
  );
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isPro, setIsPro] = useState<boolean>(() => StorageService.isPro());
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [daysRemaining, setDaysRemaining] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Checkout modal & flow states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Payment processing state machine
  const [paymentStatus, setPaymentStatus] = useState<SubscriptionPaymentStatus | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [activePaymentRecord, setActivePaymentRecord] = useState<PaymentRecord | null>(null);
  const [checkoutToken, setCheckoutToken] = useState<string | null>(null);
  const [orderTimestamp, setOrderTimestamp] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [simulatedUpiId, setSimulatedUpiId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // FAQ accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Pre-fill user data when user changes
  useEffect(() => {
    if (user) {
      const parts = user.name ? user.name.split(' ') : [''];
      setFirstName(parts[0] || '');
      setLastName(parts.slice(1).join(' ') || '');
      setEmail(user.email || '');
      setSimulatedUpiId(`${user.email.split('@')[0]}@okhdfcbank`);
    }
  }, [user]);

  // Fetch verified subscription status from server (authoritative source)
  const loadSubscription = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const res = await ApiService.getSubscription(user.id);
      setSubscription(res.subscription);
      setIsPro(res.isPro);
      setIsExpired(res.isExpired);
      setDaysRemaining(res.daysRemaining);
      setPayments(res.payments || []);

      if (res.subscription) {
        StorageService.saveSubscription(res.subscription);
      }
    } catch (err) {
      console.error('Failed to load subscription from server', err);
      // Fallback to local cache
      const cached = StorageService.getSubscription();
      if (cached) {
        setSubscription(cached);
        setIsPro(isSubscriptionActive(cached));
        setIsExpired(isSubscriptionExpired(cached));
        setDaysRemaining(getDaysRemaining(cached.expiryDate));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubscription();
  }, [user]);

  // Initiate checkout flow
  const handleStartCheckout = () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    setFormError(null);
    setPaymentStatus(null);
    setIsCheckoutOpen(true);
  };

  // Submit checkout form & create pending payment order on server
  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }

    if (!firstName.trim()) {
      setFormError('Please enter your first name.');
      return;
    }

    try {
      setIsProcessing(true);
      setFormError(null);

      // Call server to create checkout order
      const checkoutRes = await ApiService.createSubscriptionCheckout(user.id, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || user.email,
        phone: phone.trim(),
      });

      setActiveOrderId(checkoutRes.orderId);
      setCheckoutToken(checkoutRes.checkoutToken);
      setOrderTimestamp(checkoutRes.timestamp);
      setPaymentStatus('PAYMENT_PENDING');
    } catch (err: any) {
      setFormError(err.message || 'Unable to initialize checkout. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Process and verify payment through server-side cryptographic verification
  const handleConfirmPayment = async () => {
    if (!user || !activeOrderId || !checkoutToken) return;

    try {
      setIsProcessing(true);
      setFormError(null);

      // Simulated payment gateway confirmation token / reference
      const providerPaymentId = `pay_mock_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      // Perform strict server-side verification before activating Pro
      const verifyRes = await ApiService.verifySubscriptionPayment(user.id, {
        orderId: activeOrderId,
        providerPaymentId,
        signature: checkoutToken,
        timestamp: orderTimestamp || new Date().toISOString(),
      });

      if (verifyRes.success && verifyRes.subscription) {
        setSubscription(verifyRes.subscription);
        setActivePaymentRecord(verifyRes.payment);
        setIsPro(true);
        setIsExpired(false);
        setDaysRemaining(getDaysRemaining(verifyRes.subscription.expiryDate));
        setPaymentStatus('PAYMENT_SUCCESS');
        StorageService.saveSubscription(verifyRes.subscription);

        // Update user state locally
        const updatedUser: UserAccount = {
          ...user,
          plan: 'PRO',
          subscription: verifyRes.subscription,
          isPro: true,
          subscriptionExpiry: verifyRes.subscription.expiryDate,
        };
        StorageService.saveUser(updatedUser);

        // Celebratory confetti burst
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#2563EB', '#14B8A6', '#10B981', '#F59E0B'],
          });
        } catch {}

        if (onSubscriptionUpdated) {
          onSubscriptionUpdated();
        }
      } else {
        setPaymentStatus('PAYMENT_FAILED');
      }
    } catch (err: any) {
      setPaymentStatus('PAYMENT_FAILED');
      setFormError(err.message || 'Payment verification could not be completed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelCheckout = () => {
    if (paymentStatus === 'PAYMENT_PENDING') {
      setPaymentStatus('PAYMENT_CANCELLED');
    } else {
      setIsCheckoutOpen(false);
    }
  };

  // Close success modal & return to dashboard
  const handleFinishSuccess = () => {
    setIsCheckoutOpen(false);
    onClose();
  };

  const proFeatures = [
    {
      title: 'Unlimited payment sessions',
      desc: 'Create as many split sessions and installment requests as your business needs.',
      icon: QrCode,
    },
    {
      title: 'Multiple UPI QR installments',
      desc: 'Split large customer invoices into 2 to 24 exact paise-calculated QR codes.',
      icon: Layers,
    },
    {
      title: 'Equal & custom split modes',
      desc: 'Distribute amounts equally or customize installment amounts per customer request.',
      icon: Zap,
    },
    {
      title: 'Customer management (CRM)',
      desc: 'Maintain customer directories, phone numbers, payment history, and balances.',
      icon: Users,
    },
    {
      title: 'Payment tracking & history',
      desc: 'Real-time installment status, due dates, overdue badges, and search filters.',
      icon: Clock,
    },
    {
      title: 'Merchant receipts & invoices',
      desc: 'Print or export professional digital receipts with your custom business branding.',
      icon: FileText,
    },
    {
      title: 'Reports & revenue analytics',
      desc: 'Daily collections, pending receivables, average tickets, and CSV reports.',
      icon: BarChart3,
    },
    {
      title: 'Cloud sync & multi-device access',
      desc: 'Sign in from mobile, tablet, or desktop with instant cloud data synchronization.',
      icon: Cloud,
    },
    {
      title: 'Data export & backup / restore',
      desc: 'One-click full JSON database backups and CSV customer/payment exports.',
      icon: ShieldCheck,
    },
    {
      title: 'English, Hindi and Odia',
      desc: 'Full trilingual localization designed for local merchants across India.',
      icon: Sparkles,
    },
    {
      title: 'Dark mode & ad-free experience',
      desc: 'Eye-friendly high contrast dark mode and zero commercial advertisements.',
      icon: Moon,
    },
    {
      title: 'Pro merchant account badge',
      desc: 'Verified Pro badge displayed on your dashboard and merchant receipts.',
      icon: CheckCircle2,
    },
  ];

  const faqs = [
    {
      q: 'How much does Pro cost?',
      a: 'Split UPI QR Pro costs ₹999 for six calendar months (one-time payment, no hidden fees).',
    },
    {
      q: 'Is it recurring?',
      a: 'No. Auto-renewal is OFF by default. You will never be billed automatically. You can choose to renew when your 6 months conclude.',
    },
    {
      q: 'Can I use Pro on another device?',
      a: 'Yes. Sign in with the same Google Account on your phone, tablet, or laptop, and your Pro subscription is immediately active.',
    },
    {
      q: 'What happens when Pro expires?',
      a: 'Your historical payment records and account data are retained, but Pro-only features (such as creating new sessions) become restricted until renewal.',
    },
    {
      q: 'Can I cancel after payment?',
      a: 'Split UPI QR Pro is a digital utility software with immediate license provisioning. Inquiries and cancellations are handled per our standard merchant refund policy within 48 hours of purchase.',
    },
    {
      q: 'Does Split UPI QR handle or hold customer funds?',
      a: 'No. Split UPI QR is an independent software utility for generating UPI payment QR requests and organizing installment records. Customers pay directly to your merchant UPI VPA via their UPI app (GPay, PhonePe, Paytm, etc.).',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Header */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
                Split UPI <span className="text-blue-600">QR</span>
              </span>
              <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                PRO
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Back to App
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-10">
        {/* Active Pro Banner if user already subscribed */}
        {isPro && subscription && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-emerald-900 dark:text-emerald-100">
                    Split UPI QR Pro Active
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                    ACTIVE
                  </span>
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                  Valid until <strong>{formatCalendarDate(subscription.expiryDate)}</strong> ({daysRemaining} days remaining).
                </p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                  Payment ID: <span className="font-mono">{subscription.paymentId}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleStartCheckout}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-xs shrink-0 self-start sm:self-center"
            >
              Extend for 6 Months (₹999)
            </button>
          </div>
        )}

        {/* Expired Subscription Banner (PRD Section 13) */}
        {isExpired && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-amber-900 dark:text-amber-100">
                    Your Pro subscription has expired
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                    EXPIRED
                  </span>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                  Your historical payment records and account data are retained, but Pro features are currently unavailable.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleStartCheckout}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-xs shrink-0 self-start sm:self-center"
            >
              Renew Pro — ₹999 / 6 Months
            </button>
          </div>
        )}

        {/* Free Plan Status Card (PRD Section 4 & 21) */}
        {!isPro && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs">
                <QrCode className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Your Free Plan
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    4 / DAY
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Today's usage: <strong>{dailyUsage ? dailyUsage.used : 0} of 4</strong>
                  <span className="mx-1.5">·</span>
                  Remaining: <strong>{dailyUsage ? dailyUsage.remaining : 4} QR requests</strong>
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <div className="grid grid-cols-4 gap-1 w-32 h-2">
                    {[1, 2, 3, 4].map((slot) => {
                      const usedCount = dailyUsage ? dailyUsage.used : 0;
                      return (
                        <div
                          key={slot}
                          className={`rounded-full transition-all ${
                            slot <= usedCount
                              ? usedCount >= 4
                                ? 'bg-amber-500'
                                : 'bg-blue-600'
                              : 'bg-slate-200 dark:bg-slate-800'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    {dailyUsage ? dailyUsage.used : 0}/4
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleStartCheckout}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-center"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Upgrade to Pro — ₹999</span>
              </button>
            </div>
          </div>
        )}

        {/* Hero Section (PRD Section 3) */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Professional Merchant Workspace</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Split UPI QR <span className="text-blue-600">Pro</span>
          </h1>

          <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
            ₹999 / 6 Months
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Create, track and manage your UPI QR payment records with a professional merchant workspace.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleStartCheckout}
              className="w-full sm:w-auto h-12 px-8 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-sm rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Get Pro for ₹999</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto h-12 px-6 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition cursor-pointer"
            >
              Continue with Free
            </button>
          </div>
        </div>

        {/* Pricing Card (PRD Section 3) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-blue-500/30 dark:border-blue-500/40 p-6 sm:p-8 shadow-xl max-w-xl mx-auto relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black uppercase px-4 py-1 rounded-bl-xl tracking-wider">
            Most Popular
          </div>

          <div className="border-b border-slate-100 dark:border-slate-800 pb-6 mb-6">
            <span className="text-xs uppercase font-extrabold text-blue-600 dark:text-blue-400 tracking-wider">
              Split UPI QR Pro
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                ₹999
              </span>
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                / 6 Months Pro Access
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              One-time payment. Exactly 6 calendar months. Auto-renewal is OFF by default.
            </p>
          </div>

          <div className="space-y-3 mb-8">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Everything Included in Pro:
            </p>
            <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-200">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Unlimited payment sessions</strong></span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Split payment amounts (Equal & Custom splits)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>UPI QR generation with paise-accurate rounding</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Customer management (CRM & customer balance tracking)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Payment tracking & due date notification alerts</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Payment history & immutable audit events</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Merchant receipts & printable payment vouchers</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Business profile customization & invoice prefixes</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Reports, revenue dashboards & CSV export</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Cloud sync & multi-device Google account access</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Data export & full JSON backup / restore</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Dark mode & ad-free experience</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>English, Hindi and Odia languages</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={handleStartCheckout}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-extrabold text-sm rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Pay ₹999 & Get Pro</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Free vs Pro Comparison Table (PRD Section 12) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Free vs Pro Comparison
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Clear feature comparison so you know exactly what you get.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-left">
                  <th className="py-3 px-4 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[11px]">Feature</th>
                  <th className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] bg-slate-50 dark:bg-slate-800/40 rounded-t-xl w-32">Free</th>
                  <th className="py-3 px-4 text-center font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider text-[11px] bg-blue-50/50 dark:bg-blue-950/40 rounded-t-xl w-36">Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">Price</td>
                  <td className="py-3 px-4 text-center font-bold text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/20">₹0</td>
                  <td className="py-3 px-4 text-center font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/20">₹999 / 6 months</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">QR payment sessions</td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/20">4 / day</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/30 dark:bg-blue-950/20">Unlimited*</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">Equal split</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold bg-slate-50/50 dark:bg-slate-800/20">✓</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold bg-blue-50/30 dark:bg-blue-950/20">✓</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">Custom split</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold bg-slate-50/50 dark:bg-slate-800/20">✓</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold bg-blue-50/30 dark:bg-blue-950/20">✓</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">Customer management</td>
                  <td className="py-3 px-4 text-center text-slate-500 bg-slate-50/50 dark:bg-slate-800/20">Basic</td>
                  <td className="py-3 px-4 text-center font-bold text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/20">Advanced</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">Payment history</td>
                  <td className="py-3 px-4 text-center text-slate-500 bg-slate-50/50 dark:bg-slate-800/20">Basic</td>
                  <td className="py-3 px-4 text-center font-bold text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/20">Full</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">Reports</td>
                  <td className="py-3 px-4 text-center text-slate-500 bg-slate-50/50 dark:bg-slate-800/20">Limited</td>
                  <td className="py-3 px-4 text-center font-bold text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/20">Full</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">Receipts</td>
                  <td className="py-3 px-4 text-center text-slate-500 bg-slate-50/50 dark:bg-slate-800/20">Basic</td>
                  <td className="py-3 px-4 text-center font-bold text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/20">Full</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">Cloud sync</td>
                  <td className="py-3 px-4 text-center text-slate-500 bg-slate-50/50 dark:bg-slate-800/20">Limited</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/30 dark:bg-blue-950/20">✓</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">Data export</td>
                  <td className="py-3 px-4 text-center text-slate-500 bg-slate-50/50 dark:bg-slate-800/20">Limited</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/30 dark:bg-blue-950/20">✓</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">Multi-device</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold bg-slate-50/50 dark:bg-slate-800/20">✓</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold bg-blue-50/30 dark:bg-blue-950/20">✓</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">Dark mode</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold bg-slate-50/50 dark:bg-slate-800/20">✓</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold bg-blue-50/30 dark:bg-blue-950/20">✓</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">Languages</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold bg-slate-50/50 dark:bg-slate-800/20">✓</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-bold bg-blue-50/30 dark:bg-blue-950/20">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-slate-400 text-center italic">
            * Only advertise "unlimited" if technically supported and subject to reasonable abuse controls.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="space-y-4 pt-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Built for Modern Indian Merchants
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Everything you need to organize installment sales, eliminate payment disputes, and track receivables.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-4">
            {proFeatures.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2 hover:border-blue-400 dark:hover:border-blue-600 transition"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    {feat.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security & Provider Assurance (PRD Section 17 & 26) */}
        <div className="bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Bank-Grade Payment Security & Privacy</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            Subscription checkout is processed through certified secure payment providers with 256-bit SSL encryption.
            We <strong>never</strong> store your bank passwords, UPI PIN, OTPs, or credit card details.
          </p>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-800">
            <strong>Important Legal Notice:</strong> Split UPI QR is an independent software utility for generating UPI payment QR requests and organizing payment/installment records. It is not a bank, UPI network, NPCI, payment gateway, payment aggregator, or government application.
          </div>
        </div>

        {/* FAQ Section (PRD Section 20) */}
        <div className="space-y-4 pt-4">
          <div className="text-center space-y-1">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-slate-500">
              Clear answers with zero ambiguous commitments.
            </p>
          </div>

          <div className="space-y-2 max-w-2xl mx-auto">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full px-4 py-3.5 flex items-center justify-between text-left text-xs font-bold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        isOpen ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-3.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-2.5">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Checkout & Payment Modal (PRD Section 5, 6, 7, 8) */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Split UPI QR Pro Checkout
                </h3>
                <p className="text-xs text-slate-500">
                  ₹999 for 6 Months Pro Access
                </p>
              </div>
              <button
                type="button"
                onClick={handleCancelCheckout}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* State: SUCCESS (PRD Section 8) */}
            {paymentStatus === 'PAYMENT_SUCCESS' && (
              <div className="space-y-4 py-2 text-center animate-in zoom-in-95">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                    Payment Successful 🎉
                  </h2>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Your Split UPI QR Pro subscription is active.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 text-xs space-y-2 text-left border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Plan:</span>
                    <span className="font-bold text-slate-900 dark:text-white">Split UPI QR Pro</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount Paid:</span>
                    <span className="font-bold text-slate-900 dark:text-white">₹999 (99,900 paise)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Duration:</span>
                    <span className="font-bold text-slate-900 dark:text-white">6 Calendar Months</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Start Date:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {subscription ? formatCalendarDate(subscription.startDate) : 'Today'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Expiry Date:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {subscription ? formatCalendarDate(subscription.expiryDate) : 'In 6 Months'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment ID:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {subscription?.paymentId || activePaymentRecord?.providerPaymentId || activeOrderId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account Email:</span>
                    <span className="font-medium text-slate-900 dark:text-white">{user?.email}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleFinishSuccess}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition"
                >
                  Open Split UPI QR
                </button>
              </div>
            )}

            {/* State: PAYMENT_FAILED */}
            {paymentStatus === 'PAYMENT_FAILED' && (
              <div className="space-y-4 py-3 text-center animate-in zoom-in-95">
                <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 mx-auto flex items-center justify-center">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Payment Failed
                  </h3>
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                    {formError || 'The transaction could not be completed. Your card/account was not debited.'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentStatus(null)}
                    className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
                  >
                    Try Again
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelCheckout}
                    className="h-10 px-4 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* State: PAYMENT_CANCELLED */}
            {paymentStatus === 'PAYMENT_CANCELLED' && (
              <div className="space-y-4 py-3 text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 mx-auto flex items-center justify-center">
                  <X className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Checkout Cancelled
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    You cancelled the checkout. No payment was charged to your account.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="w-full h-10 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl"
                >
                  Close
                </button>
              </div>
            )}

            {/* State: PAYMENT_PENDING (Provider Simulator & Server Verification) */}
            {paymentStatus === 'PAYMENT_PENDING' && (
              <div className="space-y-4 py-2 animate-in fade-in">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl text-xs text-blue-900 dark:text-blue-200 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Order ID: <strong className="font-mono">{activeOrderId}</strong>
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Select Payment Method:
                  </label>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 font-semibold transition ${
                        paymentMethod === 'upi'
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-white'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>UPI</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 font-semibold transition ${
                        paymentMethod === 'card'
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-white'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Card</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('netbanking')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 font-semibold transition ${
                        paymentMethod === 'netbanking'
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-white'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                      <span>NetBanking</span>
                    </button>
                  </div>
                </div>

                {paymentMethod === 'upi' && (
                  <div className="space-y-2 text-xs">
                    <label className="block text-slate-600 dark:text-slate-400 font-medium">
                      Enter UPI ID / VPA:
                    </label>
                    <input
                      type="text"
                      value={simulatedUpiId}
                      onChange={(e) => setSimulatedUpiId(e.target.value)}
                      placeholder="merchant@okhdfcbank"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                    <p className="text-[11px] text-slate-500">
                      Supports GPay, PhonePe, Paytm, BHIM, and all Indian bank UPI apps.
                    </p>
                  </div>
                )}

                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl text-xs space-y-1 border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Plan:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Split UPI QR Pro (6 Months)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payable Amount:</span>
                    <span className="font-black text-slate-900 dark:text-white">₹999</span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={handleConfirmPayment}
                    disabled={isProcessing}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying with Payment Provider...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Authorize & Verify ₹999 Payment</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelCheckout}
                    className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-center"
                  >
                    Cancel Checkout
                  </button>
                </div>
              </div>
            )}

            {/* State: INITIAL CHECKOUT FORM (PRD Section 6) */}
            {paymentStatus === null && (
              <form onSubmit={handleProceedToPayment} className="space-y-4 text-xs">
                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Ramesh"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Sharma"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Account Email (Google Account)
                  </label>
                  <input
                    type="email"
                    readOnly
                    value={email}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Pro subscription will be permanently bound to this Google account.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Mobile Phone (Optional for SMS confirmation)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Order Summary (PRD Section 6) */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-1 border-b border-slate-200 dark:border-slate-700">
                    Order Summary
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Split UPI QR Pro (6 Months)</span>
                    <span className="font-semibold text-slate-900 dark:text-white">₹999</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Discount</span>
                    <span>₹0</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Taxes</span>
                    <span>Inclusive (₹0 extra)</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-black text-sm text-slate-900 dark:text-white">
                    <span>Total Due</span>
                    <span className="text-blue-600 dark:text-blue-400">₹999</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Creating Order...</span>
                    </>
                  ) : (
                    <>
                      <span>Pay ₹999</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
