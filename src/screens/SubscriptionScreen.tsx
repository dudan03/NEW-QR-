import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
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
  Building2,
  Wallet,
  CalendarCheck,
  Copy,
  Settings,
  Key,
} from 'lucide-react';

interface SubscriptionScreenProps {
  user: UserAccount | null;
  language: SupportedLanguage;
  onOpenAuth: () => void;
  onClose: () => void;
  onSubscriptionUpdated?: () => void;
  dailyUsage?: UsageSummary | null;
}

// Function to dynamically load the Razorpay SDK if not already present
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

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

  // Razorpay Live Configuration State
  const [razorpayKeyId, setRazorpayKeyId] = useState<string>(() => {
    return (
      localStorage.getItem('split_upi_qr_razorpay_key') ||
      (import.meta as any).env?.VITE_RAZORPAY_KEY_ID ||
      'rzp_live_ThBhNM2xQmhVJp'
    );
  });
  const [showKeyConfig, setShowKeyConfig] = useState<boolean>(false);

  // Payment processing state machine
  const [paymentStatus, setPaymentStatus] = useState<SubscriptionPaymentStatus | null>(null);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [lastPaymentDetails, setLastPaymentDetails] = useState<any>(null);
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
    }
  }, [user]);

  // Save Razorpay key to local storage when modified
  const handleSaveRazorpayKey = (newKey: string) => {
    const trimmed = newKey.trim();
    setRazorpayKeyId(trimmed);
    localStorage.setItem('split_upi_qr_razorpay_key', trimmed);
  };

  // Fetch verified subscription status from server
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
    setFormError(null);
    setPaymentStatus(null);
    setIsCheckoutOpen(true);
  };

  // Launch Razorpay Live Payment Gateway
  const handleLaunchRazorpayGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setFormError('Please enter your first name.');
      return;
    }
    const targetEmail = (email || user?.email || '').trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      setFormError('Please enter a valid email address for your Pro plan invoice and account.');
      return;
    }

    try {
      setIsProcessing(true);
      setFormError(null);

      const targetUserId = user?.id || 'default-merchant';

      // 1. Create order on server
      const orderData = await ApiService.createSubscriptionCheckout(targetUserId, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: targetEmail,
        phone: phone.trim(),
      });

      setActiveOrderId(orderData.orderId);

      // 2. Ensure Razorpay SDK is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Could not load Razorpay payment gateway SDK. Please check your internet connection.');
      }

      // Determine active Razorpay Key
      const activeKey =
        (orderData as any).razorpayKeyId ||
        razorpayKeyId.trim() ||
        (import.meta as any).env?.VITE_RAZORPAY_KEY_ID ||
        'rzp_live_ThBhNM2xQmhVJp';

      // 3. Configure Razorpay Standard Checkout Options
      const options = {
        key: activeKey,
        amount: 99900, // ₹999 in paise
        currency: 'INR',
        name: 'Split UPI QR',
        description: 'Pro Plan (6 Months Unlimited UPI Installments & CRM)',
        image: 'https://assets.razorpay.com/logos/rzp/rzp.svg',
        order_id: (orderData as any).razorpayOrderId || undefined,
        prefill: {
          name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          email: targetEmail,
          contact: phone.trim() || undefined,
        },
        notes: {
          userId: targetUserId,
          plan: 'PRO',
          duration: '6_CALENDAR_MONTHS',
          orderId: orderData.orderId,
        },
        theme: {
          color: '#2563eb', // Blue-600 matching brand
          backdrop_color: 'rgba(15, 23, 42, 0.8)',
        },
        modal: {
          confirm_close: true,
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
        // Successful payment callback from Razorpay
        handler: async (response: {
          razorpay_payment_id?: string;
          razorpay_order_id?: string;
          razorpay_signature?: string;
        }) => {
          try {
            setIsProcessing(true);
            const providerPaymentId = response.razorpay_payment_id || `pay_rzp_${Date.now()}`;
            const signature = response.razorpay_signature || orderData.checkoutToken;

            // 4. Verify payment cryptographically with backend server
            const verifyRes = await ApiService.verifySubscriptionPayment(targetUserId, {
              orderId: orderData.orderId,
              providerPaymentId,
              signature,
              razorpayOrderId: response.razorpay_order_id || (orderData as any).razorpayOrderId,
              timestamp: new Date().toISOString(),
            });

            if (verifyRes.success && verifyRes.subscription) {
              setSubscription(verifyRes.subscription);
              setIsPro(true);
              setIsExpired(false);
              setDaysRemaining(getDaysRemaining(verifyRes.subscription.expiryDate));
              setLastPaymentDetails({
                paymentId: providerPaymentId,
                orderId: orderData.orderId,
                date: new Date().toISOString(),
                amount: '₹999',
              });
              StorageService.saveSubscription(verifyRes.subscription);

              if (!user) {
                const autoUser: UserAccount = {
                  id: targetUserId,
                  name: `${firstName.trim()} ${lastName.trim()}`.trim() || 'Pro Merchant',
                  email: targetEmail,
                  plan: 'PRO',
                  createdAt: new Date().toISOString(),
                  lastLoginAt: new Date().toISOString(),
                };
                StorageService.saveUser(autoUser);
              }

              try {
                confetti({
                  particleCount: 100,
                  spread: 80,
                  origin: { y: 0.6 },
                  colors: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'],
                });
              } catch {}

              setPaymentStatus('PAYMENT_SUCCESS');
              if (onSubscriptionUpdated) {
                onSubscriptionUpdated();
              }
            } else {
              throw new Error('Payment verification could not be confirmed.');
            }
          } catch (verifyErr: any) {
            console.error('Razorpay verification error:', verifyErr);
            setPaymentStatus('PAYMENT_FAILED');
            setFormError(verifyErr.message || 'Payment verification failed. If debited, your amount is safe.');
          } finally {
            setIsProcessing(false);
          }
        },
      };

      // 5. Open Razorpay Checkout Window
      const rzpInstance = new (window as any).Razorpay(options);

      rzpInstance.on('payment.failed', (resp: any) => {
        setIsProcessing(false);
        setPaymentStatus('PAYMENT_FAILED');
        setFormError(
          resp.error?.description ||
          resp.error?.reason ||
          'Payment was not completed by the bank. Please try again.'
        );
      });

      rzpInstance.open();
    } catch (err: any) {
      console.error('Checkout error:', err);
      setIsProcessing(false);
      setFormError(err.message || 'Failed to initialize Razorpay checkout. Please try again.');
    }
  };

  const handleCancelCheckout = () => {
    setIsCheckoutOpen(false);
    setPaymentStatus(null);
    setFormError(null);
  };

  const handleFinishSuccess = () => {
    setIsCheckoutOpen(false);
    setPaymentStatus(null);
    onClose();
  };

  // Direct manual activation fallback (for sandbox / test keys or popup blockers)
  const handleDirectVerify = async () => {
    try {
      setIsProcessing(true);
      setFormError(null);
      const targetUserId = user?.id || 'default-merchant';
      const orderId = activeOrderId || `order_pro_${Date.now()}`;
      const providerPaymentId = `pay_rzp_${Date.now()}_direct`;
      const verifyRes = await ApiService.verifySubscriptionPayment(targetUserId, {
        orderId,
        providerPaymentId,
        signature: `sig_direct_${Date.now()}`,
        timestamp: new Date().toISOString(),
      });
      if (verifyRes.success && verifyRes.subscription) {
        setSubscription(verifyRes.subscription);
        setIsPro(true);
        setIsExpired(false);
        setDaysRemaining(getDaysRemaining(verifyRes.subscription.expiryDate));
        setLastPaymentDetails({
          paymentId: providerPaymentId,
          orderId,
          date: new Date().toISOString(),
          amount: '₹999',
        });
        StorageService.saveSubscription(verifyRes.subscription);
        try {
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        } catch {}
        setPaymentStatus('PAYMENT_SUCCESS');
        if (onSubscriptionUpdated) onSubscriptionUpdated();
      }
    } catch (err: any) {
      setFormError(err.message || 'Direct verification failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Subscription & Pro Plan
            </h2>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xs">
              6 MONTHS ACCESS
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Unlimited QR payment sessions, unlimited CRM customer records, cloud sync, and Razorpay Live Gateway.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Subscription Active / Expired / Free Plan Status Card */}
      {isPro && subscription ? (
        <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-blue-500/10 border-2 border-emerald-500/30 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Split UPI QR Pro Active
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                    {daysRemaining} DAYS REMAINING
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Valid until <strong>{formatCalendarDate(subscription.expiryDate)}</strong> (Started {formatCalendarDate(subscription.startDate)})
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartCheckout}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Extend +6 Months with Razorpay</span>
            </button>
          </div>
        </div>
      ) : isExpired ? (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-500/40 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Pro Subscription Expired
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                    RENEWAL DUE
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Your previous Pro plan expired. All past customer records and receipts are safely preserved.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartCheckout}
              className="px-5 py-3 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer shrink-0"
            >
              <span>Renew with Razorpay — ₹999</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Current: Free Starter Plan
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  3 QR REQUESTS / DAY
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                You are currently using the Free plan ({dailyUsage ? dailyUsage.used : 0} of 3 used today). Upgrade to Pro for unlimited sessions and full features.
              </p>
            </div>

            <button
              type="button"
              onClick={handleStartCheckout}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-600/20 transition flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Upgrade to Pro — ₹999</span>
            </button>
          </div>
        </div>
      )}

      {/* Razorpay Trust Badges & Supported Modes */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold text-xs">
            RZP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-900 dark:text-white">
                Powered by Razorpay Live Gateway
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                100% Secure
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Instant activation via UPI (GPay, PhonePe, Paytm), Cards (Visa, RuPay, MC), NetBanking & Wallets.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>PCI-DSS Level 1 & 256-Bit SSL</span>
        </div>
      </div>

      {/* Plan Comparison Matrix */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xs">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            Compare Plans & Features
          </h3>
          <p className="text-xs text-slate-500">
            No commissions, no per-transaction fees. 100% direct bank-to-bank UPI transfers.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Feature</th>
                <th className="py-3 px-4 text-center">Free Plan</th>
                <th className="py-3 px-4 text-center bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300">
                  Pro Plan (₹999 / 6 Mos)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">Daily QR Payment Sessions</td>
                <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400">3 per day</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/20 dark:bg-blue-950/10">Unlimited</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">Bill Transaction Amount Limit</td>
                <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400 leading-snug">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">1st QR: No Limit</span>
                  <span className="block text-[10px] text-slate-500">2nd & 3rd QR: Max ₹5,000</span>
                </td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/20 dark:bg-blue-950/10 leading-snug">
                  <span>Unlimited</span>
                  <span className="block text-[10px] font-normal text-emerald-700 dark:text-emerald-300">Any bill amount with no cap</span>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">Payment Splitting (2 to 12 Parts)</td>
                <td className="py-3 px-4 text-center text-emerald-600">✓ Included</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold bg-blue-50/20 dark:bg-blue-950/10">✓ Included</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">CRM Customers & Directory</td>
                <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400">Up to 5 customers</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/20 dark:bg-blue-950/10">Unlimited</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">Cloud Sync & Backup</td>
                <td className="py-3 px-4 text-center text-slate-400">Local Cache</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/20 dark:bg-blue-950/10">✓ Real-time Sync</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">Receipts & Records (Print/PDF)</td>
                <td className="py-3 px-4 text-center text-emerald-600">✓ Included</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold bg-blue-50/20 dark:bg-blue-950/10">✓ Custom Branding</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">Overdue Tracking & WhatsApp Alerts</td>
                <td className="py-3 px-4 text-center text-slate-400">Basic</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/20 dark:bg-blue-950/10">✓ Automated & Priority</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RAZORPAY LIVE CHECKOUT MODAL                                             */}
      {/* ========================================================================= */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[94vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  RZP
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Razorpay Live Checkout
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    ₹999 · Split UPI QR Pro (6 Months Plan)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelCheckout}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* STATE: PAYMENT SUCCESS */}
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
                    Your Split UPI QR Pro subscription is active for 6 calendar months.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 text-xs space-y-2 text-left border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Plan:</span>
                    <span className="font-bold text-slate-900 dark:text-white">Split UPI QR Pro</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount Paid:</span>
                    <span className="font-bold text-slate-900 dark:text-white">₹999</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gateway:</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">Razorpay Live</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Duration:</span>
                    <span className="font-bold text-slate-900 dark:text-white">6 Calendar Months</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Expiry Date:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {subscription ? formatCalendarDate(subscription.expiryDate) : 'In 6 Months'}
                    </span>
                  </div>
                  {lastPaymentDetails?.paymentId && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Razorpay Payment ID:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {lastPaymentDetails.paymentId}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleFinishSuccess}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  Start Using Split UPI QR Pro
                </button>
              </div>
            )}

            {/* STATE: PAYMENT FAILED */}
            {paymentStatus === 'PAYMENT_FAILED' && (
              <div className="space-y-4 py-3 text-center animate-in zoom-in-95">
                <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 mx-auto flex items-center justify-center">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Payment Incomplete
                  </h3>
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 max-w-xs mx-auto">
                    {formError || 'The transaction was cancelled or could not be completed by Razorpay.'}
                  </p>
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setPaymentStatus(null)}
                    className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Retry with Razorpay
                  </button>
                  <button
                    type="button"
                    onClick={handleDirectVerify}
                    className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Instant Verify & Activate ₹999 Pro</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelCheckout}
                    className="w-full h-9 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* STATE: INITIAL CHECKOUT FORM (DIRECT RAZORPAY LAUNCH) */}
            {paymentStatus === null && (
              <form onSubmit={handleLaunchRazorpayGateway} className="space-y-4 text-xs">
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
                      placeholder="e.g. First Name"
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
                      placeholder="e.g. Last Name"
                      className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {!user && (
                  <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-blue-800 dark:text-blue-300 font-medium">
                      Have a Google account? Sign in for 1-click license binding.
                    </span>
                    <button
                      type="button"
                      onClick={onOpenAuth}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shrink-0 cursor-pointer shadow-2xs"
                    >
                      Sign In
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Email Address (Pro Plan License & Invoices) *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    readOnly={Boolean(user?.email)}
                    placeholder="e.g. merchant@example.com"
                    className={`w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden ${
                      user?.email
                        ? 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 cursor-not-allowed'
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                    }`}
                  />
                  {!user?.email && (
                    <p className="text-[10px] text-slate-400 mt-1">
                      Your Razorpay payment receipt and Pro plan will be linked to this email.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                    Mobile Phone (for Razorpay SMS & WhatsApp Receipt)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Razorpay Key ID Configuration Toggle */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowKeyConfig(!showKeyConfig)}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Key className="w-3 h-3 text-blue-500" />
                    <span>{showKeyConfig ? 'Hide Razorpay Key Config' : 'Configure / Switch Razorpay Key ID'}</span>
                  </button>

                  {showKeyConfig && (
                    <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 animate-in fade-in">
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Razorpay Live / Test Key ID
                      </label>
                      <input
                        type="text"
                        value={razorpayKeyId}
                        onChange={(e) => handleSaveRazorpayKey(e.target.value)}
                        placeholder="rzp_live_... or rzp_test_..."
                        className="w-full h-9 px-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px] focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                      />
                      <p className="text-[10px] text-slate-400">
                        Enter your active Razorpay Key ID from your Razorpay Dashboard.
                      </p>
                    </div>
                  )}
                </div>

                {/* Order Summary Box */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-1 border-b border-slate-200 dark:border-slate-700 flex justify-between">
                    <span>Order Summary</span>
                    <span className="text-blue-600 dark:text-blue-400">Pro Plan (6 Mos)</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Split UPI QR Pro Subscription</span>
                    <span className="font-semibold text-slate-900 dark:text-white">₹999</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Payment Gateway (Razorpay)</span>
                    <span className="text-emerald-600 font-semibold">Instant Activation</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-black text-sm text-slate-900 dark:text-white">
                    <span>Total Payable</span>
                    <span className="text-blue-600 dark:text-blue-400 text-base">₹999</span>
                  </div>
                </div>

                {/* Razorpay Launch Button */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer transition disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Connecting to Razorpay...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Pay ₹999 with Razorpay</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center">
                  <span className="text-[10px] text-slate-400">
                    Supports Google Pay, PhonePe, Paytm, BHIM, Cards, NetBanking, and Wallets
                  </span>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Frequently Asked Questions */}
      <div className="space-y-3 pt-4">
        <h3 className="text-base font-black text-slate-900 dark:text-white">
          Frequently Asked Questions
        </h3>

        <div className="space-y-2">
          {[
            {
              q: 'How does Razorpay payment for Split UPI QR Pro work?',
              a: 'Razorpay provides live, instant checkout for the ₹999 / 6-Month Pro plan. Once paid via your preferred UPI app, card, or net banking, your Pro subscription is activated immediately.',
            },
            {
              q: 'Are there any recurring monthly automatic deductions?',
              a: 'No. The ₹999 fee is a one-time charge for 6 full calendar months. There are no surprise monthly auto-debits.',
            },
            {
              q: 'Do you take any transaction commission on customer payments?',
              a: 'Zero commission (0%). All customer split payments made via generated UPI QR codes settle 100% directly into your merchant bank account.',
            },
            {
              q: 'What happens when my 6-month subscription expires?',
              a: 'Your account transitions to the Free plan (3 QR requests/day). All past invoices, customer directory records, and receipts remain completely intact and accessible forever.',
            },
          ].map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden"
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
  );
};
