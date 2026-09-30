import React, { useState, useEffect } from 'react';
import {
  PaymentSession,
  Installment,
  SplitMethod,
  SupportedLanguage,
  BusinessProfile,
  Customer,
  UsageSummary,
} from '../types';
import {
  rupeesToPaise,
  paiseToRupees,
  formatPaise,
  isValidUpiId,
  calculateEqualSplit,
  calculateMaxSplit,
  validateCustomSplit,
  generateUpiUri,
  generateSessionId,
} from '../utils/currency';
import { translations } from '../locales';
import {
  X,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Calculator,
  User,
  Phone,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { StorageService } from '../services/storage';

interface CreatePaymentModalProps {
  isOpen: boolean;
  language: SupportedLanguage;
  merchantProfile: BusinessProfile;
  customers: Customer[];
  initialCustomer?: Customer | null;
  sessionCount: number;
  onClose: () => void;
  onCreated: (session: PaymentSession, customer?: Customer) => void;
  isPro?: boolean;
  dailyUsage?: UsageSummary | null;
  onOpenPricing?: () => void;
}

export const CreatePaymentModal: React.FC<CreatePaymentModalProps> = ({
  isOpen,
  language,
  merchantProfile,
  customers,
  initialCustomer,
  sessionCount,
  onClose,
  onCreated,
  isPro = false,
  dailyUsage,
  onOpenPricing,
}) => {
  const t = translations[language];

  // Form states (Pre-fills from profile or storage default)
  const [upiId, setUpiId] = useState(() => merchantProfile.upiId || StorageService.getProfile().upiId || '');
  const [payeeName, setPayeeName] = useState(() => merchantProfile.displayName || merchantProfile.businessName || StorageService.getProfile().displayName || StorageService.getProfile().businessName || '');
  const [totalAmountStr, setTotalAmountStr] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomer?.id || '');
  const [customerName, setCustomerName] = useState(initialCustomer?.name || '');
  const [customerPhone, setCustomerPhone] = useState(initialCustomer?.phone || '');
  const [title, setTitle] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [notes, setNotes] = useState('');
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('EQUAL');

  // Equal split params
  const [installmentCount, setInstallmentCount] = useState<number>(4);

  // Max split params
  const [maxAmountStr, setMaxAmountStr] = useState<string>('2500');

  // Custom split params (stored as string inputs for easy user typing)
  const [customAmounts, setCustomAmounts] = useState<string[]>(['3000', '2000', '5000']);

  // Installment schedule (Default: No Schedule)
  const [dueSchedule, setDueSchedule] = useState<'none' | 'weekly' | 'biweekly' | 'monthly'>('none');

  // Validation errors
  const [errors, setErrors] = useState<{
    upiId?: string;
    totalAmount?: string;
    split?: string;
    customerName?: string;
    customerPhone?: string;
    payeeName?: string;
  }>({});

  useEffect(() => {
    const currentProf = StorageService.getProfile();
    const defaultUpi = merchantProfile.upiId || currentProf.upiId;
    if (defaultUpi && !upiId) {
      setUpiId(defaultUpi);
    }
    const defaultName =
      merchantProfile.displayName ||
      merchantProfile.businessName ||
      currentProf.displayName ||
      currentProf.businessName;
    if (defaultName && !payeeName) {
      setPayeeName(defaultName);
    }
  }, [merchantProfile, isOpen]);

  useEffect(() => {
    if (initialCustomer) {
      setSelectedCustomerId(initialCustomer.id);
      setCustomerName(initialCustomer.name);
      setCustomerPhone(initialCustomer.phone);
    }
  }, [initialCustomer]);

  if (!isOpen) return null;

  const totalPaise = rupeesToPaise(totalAmountStr);

  // When selecting existing customer from dropdown
  const handleSelectCustomer = (custId: string) => {
    setSelectedCustomerId(custId);
    if (custId === 'new') {
      setCustomerName('');
      setCustomerPhone('');
    } else {
      const found = customers.find((c) => c.id === custId);
      if (found) {
        setCustomerName(found.name);
        setCustomerPhone(found.phone);
      }
    }
  };

  // Compute calculated split items in real time
  let calculatedItems: { sequence: number; amountPaise: number }[] = [];
  let customDiffPaise = 0;

  if (totalPaise > 0) {
    if (splitMethod === 'EQUAL') {
      calculatedItems = calculateEqualSplit(totalPaise, installmentCount);
    } else if (splitMethod === 'MAX_INSTALLMENT') {
      const maxPaise = rupeesToPaise(maxAmountStr);
      if (maxPaise > 0) {
        calculatedItems = calculateMaxSplit(totalPaise, maxPaise);
      }
    } else if (splitMethod === 'CUSTOM') {
      const customPaiseList = customAmounts.map((a) => rupeesToPaise(a));
      calculatedItems = customPaiseList.map((amt, idx) => ({
        sequence: idx + 1,
        amountPaise: amt,
      }));
      const validation = validateCustomSplit(customPaiseList, totalPaise);
      customDiffPaise = validation.diffPaise;
    }
  }

  // Handlers for Custom Split amounts
  const handleAddCustomInstallment = () => {
    const remaining = customDiffPaise > 0 ? (customDiffPaise / 100).toString() : '1000';
    setCustomAmounts([...customAmounts, remaining]);
  };

  const handleRemoveCustomInstallment = (index: number) => {
    if (customAmounts.length <= 1) return;
    const next = [...customAmounts];
    next.splice(index, 1);
    setCustomAmounts(next);
  };

  const handleUpdateCustomAmount = (index: number, val: string) => {
    const next = [...customAmounts];
    next[index] = val;
    setCustomAmounts(next);
  };

  // Submission handler (Strict details required before scanner/QR opens)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: {
      upiId?: string;
      totalAmount?: string;
      split?: string;
      customerName?: string;
      customerPhone?: string;
      payeeName?: string;
    } = {};

    // 1. Merchant Details Validation
    if (!upiId.trim() || !isValidUpiId(upiId)) {
      newErrors.upiId = t.form.upiIdError || 'Valid UPI ID is required (e.g. name@okhdfcbank)';
    }

    if (!payeeName.trim()) {
      newErrors.payeeName = 'Merchant / Business name is required.';
    }

    // 2. Customer Details Validation (Optional up to ₹5,000, Mandatory above ₹5,000)
    const isCustomerMandatory = totalPaise > 500000;
    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');

    if (isCustomerMandatory) {
      if (!customerName.trim()) {
        newErrors.customerName = 'Customer name is required for transactions above ₹5,000.';
      }
      if (!customerPhone.trim() || cleanPhone.length < 10) {
        newErrors.customerPhone = 'Valid 10-digit mobile number is required for transactions above ₹5,000.';
      }
    } else {
      // Optional up to ₹5,000 — only validate if user entered a number
      if (customerPhone.trim() && cleanPhone.length < 10) {
        newErrors.customerPhone = 'Enter a valid 10-digit mobile number, or leave blank.';
      }
    }

    // 3. Amount & Split Validation
    if (totalPaise <= 0) {
      newErrors.totalAmount = t.form.totalAmountError || 'Please enter total bill amount greater than ₹0.';
    }

    // Free Plan Limit Rule:
    // 1st QR of the day (used === 0): No limit on transaction amount.
    // 2nd & 3rd QR of the day (used >= 1): Max ₹5,000 per transaction.
    const isFreePlanSecondOrThird = !isPro && (dailyUsage ? dailyUsage.used >= 1 : false);
    if (isFreePlanSecondOrThird && totalPaise > 500000) {
      const qrOrdinal = (dailyUsage?.used || 0) === 1 ? '2nd' : '3rd';
      newErrors.totalAmount = `Free Plan limit: Your ${qrOrdinal} QR today cannot exceed ₹5,000 (1st QR had no amount limit). Upgrade to Pro for unlimited transactions of any amount!`;
    }

    if (splitMethod === 'CUSTOM') {
      const customPaiseList = customAmounts.map((a) => rupeesToPaise(a));
      const validation = validateCustomSplit(customPaiseList, totalPaise);
      if (!validation.isValid) {
        newErrors.split =
          validation.diffPaise > 0
            ? `${t.splitMethods.allocationRemaining}: ${formatPaise(validation.diffPaise)}`
            : `${t.splitMethods.allocationExceeded}: ${formatPaise(Math.abs(validation.diffPaise))}`;
      }
    } else if (splitMethod === 'EQUAL' && installmentCount < 1) {
      newErrors.split = 'Installment count must be at least 1';
    } else if (splitMethod === 'MAX_INSTALLMENT' && rupeesToPaise(maxAmountStr) <= 0) {
      newErrors.split = 'Maximum installment must be greater than zero';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Build Session and Installments
    const sessionId = generateSessionId(sessionCount);
    const nowIso = new Date().toISOString();
    const intervalDays =
      dueSchedule === 'weekly'
        ? 7
        : dueSchedule === 'biweekly'
        ? 14
        : dueSchedule === 'monthly'
        ? 30
        : 0;

    const installments: Installment[] = calculatedItems.map((item) => {
      const instId = `${sessionId}-INS-${item.sequence}`;
      const paymentUri = generateUpiUri({
        upiId: upiId.trim(),
        payeeName: payeeName.trim() || merchantProfile.businessName,
        amountPaise: item.amountPaise,
        note: `Installment ${item.sequence} of ${calculatedItems.length} (${invoiceId || sessionId})`,
        transactionRef: instId,
      });

      const dueDate =
        dueSchedule !== 'none'
          ? new Date(
              Date.now() + (item.sequence - 1) * intervalDays * 24 * 3600 * 1000
            ).toISOString()
          : undefined;

      return {
        id: instId,
        sessionId,
        sequence: item.sequence,
        amountPaise: item.amountPaise,
        paymentUri,
        status: 'QR_READY',
        confirmationMethod: 'NONE',
        createdAt: nowIso,
        updatedAt: nowIso,
        dueDate,
      };
    });

    let customerRef: Customer | undefined;
    if (customerName.trim() || customerPhone.trim()) {
      if (selectedCustomerId && selectedCustomerId !== 'new') {
        customerRef = customers.find((c) => c.id === selectedCustomerId);
      } else {
        customerRef = {
          id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: customerName.trim() || 'Direct Customer',
          phone: customerPhone.trim() || '',
          createdAt: nowIso,
          updatedAt: nowIso,
        };
      }
    }

    const newSession: PaymentSession = {
      id: sessionId,
      customerId: customerRef?.id,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      upiId: upiId.trim(),
      payeeName: payeeName.trim() || undefined,
      totalAmountPaise: totalPaise,
      title: title.trim() || undefined,
      invoiceId: invoiceId.trim() || undefined,
      notes: notes.trim() || undefined,
      splitMethod,
      status: 'ACTIVE',
      installments,
      dueDate: installments[installments.length - 1]?.dueDate,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Auto-save entered merchant UPI ID as default in profile
    const currentProf = StorageService.getProfile();
    const updatedProf: BusinessProfile = {
      ...currentProf,
      upiId: upiId.trim(),
      displayName: payeeName.trim() || currentProf.displayName,
      businessName: currentProf.businessName || payeeName.trim(),
    };
    StorageService.saveProfile(updatedProf);

    onCreated(newSession, customerRef);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col pb-[env(safe-area-inset-bottom,0px)]">
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Top Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {t.actions.createPayment}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Calculate installments and generate UPI QR codes
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Daily Free Limit Reached Guard (PRD Section 13 & 15) */}
        {!isPro && (dailyUsage ? dailyUsage.used >= 3 : false) ? (
          <div className="p-6 text-center space-y-4 my-auto">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Daily Free Limit Reached
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                You've used all <strong>3 free QR payment requests for today</strong>.
                Your existing payment records and customer histories remain available.
              </p>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-left max-w-sm mx-auto space-y-1.5">
              <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                <span>Split UPI QR Pro</span>
                <span className="text-blue-600 dark:text-blue-400 font-black">₹999 / 6 Months</span>
              </div>
              <p className="text-[11px] text-slate-500">
                ✓ Unlimited QR payment sessions · ✓ Multi-device cloud sync · ✓ Full CSV reports · ✓ Priority support
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2 max-w-sm mx-auto">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenPricing) onOpenPricing();
                }}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer transition"
              >
                <span>Upgrade to Pro — ₹999</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-center cursor-pointer"
              >
                Continue with Free
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 grow">
              {!isPro && (
                <div className="p-3 bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl text-xs space-y-1.5 text-blue-900 dark:text-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5">
                      <span>Free Plan:</span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-extrabold text-[11px]">
                        {dailyUsage ? Math.min(3, dailyUsage.used + 1) : 1} of 3 QR Request Today
                      </span>
                    </span>
                    {onOpenPricing && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenPricing();
                        }}
                        className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-0.5 text-xs"
                      >
                        <span>Upgrade to Pro</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="text-[11px] leading-relaxed">
                    {(dailyUsage ? dailyUsage.used : 0) === 0 ? (
                      <span className="text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span><strong>1st QR today:</strong> No transaction amount limit! Generate any amount.</span>
                      </span>
                    ) : (
                      <span className="text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span><strong>{(dailyUsage ? dailyUsage.used : 0) === 1 ? '2nd' : '3rd'} QR today:</strong> Max ₹5,000 transaction limit in Free Plan (Pro is unlimited).</span>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Merchant UPI ID & Payee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t.form.upiIdLabel} <span className="text-rose-500 font-bold">*</span>
                    </label>
                    {upiId.trim() && isValidUpiId(upiId.trim()) && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Default UPI</span>
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    value={upiId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setUpiId(val);
                      if (errors.upiId) setErrors({ ...errors, upiId: undefined });
                      // Once a valid UPI ID is entered, immediately set as default
                      const trimmed = val.trim();
                      if (isValidUpiId(trimmed)) {
                        const curr = StorageService.getProfile();
                        StorageService.saveProfile({
                          ...curr,
                          upiId: trimmed,
                        });
                      }
                    }}
                    placeholder={t.form.upiIdPlaceholder}
                    className={`w-full h-10 px-3 text-xs font-mono rounded-xl border ${
                      errors.upiId
                        ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-50/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                    } text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500`}
                  />
                  {errors.upiId && (
                    <span className="text-[11px] text-rose-500 mt-1 block font-medium">
                      {errors.upiId}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.form.payeeNameLabel} <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={payeeName}
                    onChange={(e) => {
                      setPayeeName(e.target.value);
                      if (errors.payeeName) setErrors({ ...errors, payeeName: undefined });
                    }}
                    placeholder="Merchant or Shop Name"
                    className={`w-full h-10 px-3 text-xs rounded-xl border ${
                      errors.payeeName
                        ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-50/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                    } text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500`}
                  />
                  {errors.payeeName && (
                    <span className="text-[11px] text-rose-500 mt-1 block font-medium">
                      {errors.payeeName}
                    </span>
                  )}
                </div>
              </div>

              {/* CRM Customer Details (Optional up to ₹5,000, Mandatory above ₹5,000) */}
              <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 flex-wrap">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>Customer Details</span>
                    {totalPaise > 500000 ? (
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900/60">
                        Mandatory above ₹5,000 *
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        Optional up to ₹5,000
                      </span>
                    )}
                  </span>
                  {customers.length > 0 && (
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => handleSelectCustomer(e.target.value)}
                      className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                    >
                      <option value="new">+ New Customer</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.phone})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Customer Name {totalPaise > 500000 ? <span className="text-rose-500 font-bold">*</span> : <span className="text-slate-400 font-normal text-[10px]">(Optional)</span>}
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        if (errors.customerName) setErrors({ ...errors, customerName: undefined });
                      }}
                      placeholder="e.g. Customer Name"
                      className={`w-full h-9 px-3 text-xs rounded-xl border ${
                        errors.customerName
                          ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-50/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                      } text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500`}
                    />
                    {errors.customerName && (
                      <span className="text-[11px] text-rose-500 mt-1 block font-medium">
                        {errors.customerName}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Customer Mobile Phone {totalPaise > 500000 ? <span className="text-rose-500 font-bold">*</span> : <span className="text-slate-400 font-normal text-[10px]">(Optional)</span>}
                    </label>
                    <input
                      type="tel"
                      inputMode="tel"
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        if (errors.customerPhone) setErrors({ ...errors, customerPhone: undefined });
                      }}
                      placeholder="e.g. 9876543210"
                      className={`w-full h-9 px-3 text-xs rounded-xl border ${
                        errors.customerPhone
                          ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-50/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                      } text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500`}
                    />
                    {errors.customerPhone && (
                      <span className="text-[11px] text-rose-500 mt-1 block font-medium">
                        {errors.customerPhone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Total Amount Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.form.totalAmountLabel} <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    inputMode="decimal"
                    required
                    value={totalAmountStr}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTotalAmountStr(val);
                      const p = rupeesToPaise(val);
                      if (p <= 500000) {
                        setErrors((prev) => ({
                          ...prev,
                          customerName: undefined,
                          customerPhone: prev.customerPhone?.includes('above ₹5,000') ? undefined : prev.customerPhone,
                          totalAmount: undefined,
                        }));
                      } else {
                        if (errors.totalAmount) setErrors((prev) => ({ ...prev, totalAmount: undefined }));
                      }
                    }}
                    placeholder={t.form.totalAmountPlaceholder}
                    className={`w-full h-11 pl-8 pr-3 text-base font-bold tabular-nums rounded-xl border ${
                      errors.totalAmount
                        ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-50/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                    } text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
                {errors.totalAmount && (
                  <span className="text-[11px] text-rose-500 mt-1 block font-medium">
                    {errors.totalAmount}
                  </span>
                )}

                {/* Free Plan 2nd & 3rd QR ₹5,000 Limit Notice */}
                {!isPro && (dailyUsage ? dailyUsage.used >= 1 : false) && totalPaise > 500000 && (
                  <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Free Plan Limit: ₹5,000 Max for 2nd & 3rd QR</span>
                    </div>
                    <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                      In the Free Plan, only your 1st QR of the day has no amount limit. 2nd and 3rd QR requests cannot exceed ₹5,000.
                    </p>
                    {onOpenPricing && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenPricing();
                        }}
                        className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline inline-flex items-center gap-1 pt-0.5"
                      >
                        <span>Upgrade to Pro for Unlimited Amount on All Bills</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>

          {/* Split Method Segmented Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {t.form.splitMethodLabel}
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setSplitMethod('EQUAL')}
                className={`py-2 px-2 text-xs font-medium rounded-lg transition-all ${
                  splitMethod === 'EQUAL'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {t.splitMethods.equal}
              </button>

              <button
                type="button"
                onClick={() => setSplitMethod('MAX_INSTALLMENT')}
                className={`py-2 px-2 text-xs font-medium rounded-lg transition-all ${
                  splitMethod === 'MAX_INSTALLMENT'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {t.splitMethods.maxInstallment}
              </button>

              <button
                type="button"
                onClick={() => setSplitMethod('CUSTOM')}
                className={`py-2 px-2 text-xs font-medium rounded-lg transition-all ${
                  splitMethod === 'CUSTOM'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {t.splitMethods.custom}
              </button>
            </div>
          </div>

          {/* Split Configuration Panels */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
            {splitMethod === 'EQUAL' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {t.splitMethods.numInstallments}
                  </span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {installmentCount} installments
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {[2, 3, 4, 5, 6, 8, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setInstallmentCount(num)}
                      className={`flex-1 h-9 rounded-lg text-xs font-semibold transition-all ${
                        installmentCount === num
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  {t.splitMethods.equalDesc}
                </p>
              </div>
            )}

            {splitMethod === 'MAX_INSTALLMENT' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t.splitMethods.maxAmountPerQr} (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={maxAmountStr}
                    onChange={(e) => setMaxAmountStr(e.target.value)}
                    placeholder="e.g. 2500"
                    className="w-full h-9 pl-7 pr-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                  {t.splitMethods.maxInstallmentDesc}
                </p>
              </div>
            )}

            {splitMethod === 'CUSTOM' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {t.splitMethods.customAmounts}
                  </span>
                  <button
                    type="button"
                    onClick={handleAddCustomInstallment}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {t.splitMethods.addInstallment}
                  </button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {customAmounts.map((amt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-6">#{idx + 1}</span>
                      <div className="relative grow">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          value={amt}
                          onChange={(e) => handleUpdateCustomAmount(idx, e.target.value)}
                          className="w-full h-8 pl-6 pr-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>
                      {customAmounts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomInstallment(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-md"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Custom Split Balance Status Indicator */}
                <div
                  className={`text-xs px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
                    customDiffPaise === 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                      : customDiffPaise > 0
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                      : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
                  }`}
                >
                  <span>
                    {customDiffPaise === 0
                      ? t.splitMethods.allocationExact
                      : customDiffPaise > 0
                      ? t.splitMethods.allocationRemaining
                      : t.splitMethods.allocationExceeded}
                  </span>
                  <span className="font-bold tabular-nums">
                    {customDiffPaise === 0 ? '✓ ₹0' : formatPaise(Math.abs(customDiffPaise))}
                  </span>
                </div>
              </div>
            )}

            {errors.split && (
              <div className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.split}
              </div>
            )}
          </div>

          {/* Due Date Schedule */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Installment Due Date Schedule</span>
              <span className="text-[10px] text-slate-400 font-normal">Auto-sets follow-up deadlines</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'weekly', label: 'Weekly (7d)' },
                { id: 'biweekly', label: 'Bi-Weekly (14d)' },
                { id: 'monthly', label: 'Monthly (30d)' },
                { id: 'none', label: 'No Schedule' },
              ].map((sch) => (
                <button
                  key={sch.id}
                  type="button"
                  onClick={() => setDueSchedule(sch.id as any)}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition border ${
                    dueSchedule === sch.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {sch.label}
                </button>
              ))}
            </div>
          </div>

          {/* Calculation Preview Matrix */}
          {calculatedItems.length > 0 && (
            <div>
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.form.calculationPreview} ({calculatedItems.length} QR Codes)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {calculatedItems.map((item) => (
                  <div
                    key={item.sequence}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-800 text-center"
                  >
                    <span className="block text-[10px] text-slate-400 font-medium">
                      Part {item.sequence}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                      {formatPaise(item.amountPaise)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Session Title / Purpose & Invoice Fields */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Session Title / Purpose
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Website Design, Store Purchase, Consultation"
                className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.form.invoiceLabel}
              </label>
              <input
                type="text"
                value={invoiceId}
                onChange={(e) => setInvoiceId(e.target.value)}
                placeholder="e.g. INV-2026-001"
                className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Payment Notes Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t.form.notesLabel}
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Retail appliance purchase split into 4 installments"
              className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </form>

        {/* Modal Sticky Bottom CTA */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Total: <span className="font-bold text-slate-900 dark:text-white">{formatPaise(totalPaise)}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              {t.actions.cancel}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="h-10 px-5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>{t.actions.createPayment}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </>
    )}
  </div>
</div>
  );
};
