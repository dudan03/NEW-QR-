import React, { useState, useEffect } from 'react';
import {
  PaymentSession,
  Installment,
  SplitMethod,
  SupportedLanguage,
  BusinessProfile,
  Customer,
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
} from 'lucide-react';

interface CreatePaymentModalProps {
  isOpen: boolean;
  language: SupportedLanguage;
  merchantProfile: BusinessProfile;
  customers: Customer[];
  initialCustomer?: Customer | null;
  sessionCount: number;
  onClose: () => void;
  onCreated: (session: PaymentSession, customer?: Customer) => void;
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
}) => {
  const t = translations[language];

  // Form states
  const [upiId, setUpiId] = useState(merchantProfile.upiId || '');
  const [payeeName, setPayeeName] = useState(merchantProfile.displayName || merchantProfile.businessName || '');
  const [totalAmountStr, setTotalAmountStr] = useState('10000');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomer?.id || '');
  const [customerName, setCustomerName] = useState(initialCustomer?.name || '');
  const [customerPhone, setCustomerPhone] = useState(initialCustomer?.phone || '');
  const [invoiceId, setInvoiceId] = useState('');
  const [notes, setNotes] = useState('');
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('EQUAL');

  // Equal split params
  const [installmentCount, setInstallmentCount] = useState<number>(4);

  // Max split params
  const [maxAmountStr, setMaxAmountStr] = useState<string>('2500');

  // Custom split params (stored as string inputs for easy user typing)
  const [customAmounts, setCustomAmounts] = useState<string[]>(['3000', '2000', '5000']);

  // Installment schedule
  const [dueSchedule, setDueSchedule] = useState<'none' | 'weekly' | 'biweekly' | 'monthly'>('weekly');

  // Validation errors
  const [errors, setErrors] = useState<{ upiId?: string; totalAmount?: string; split?: string }>({});

  useEffect(() => {
    if (merchantProfile.upiId) {
      setUpiId(merchantProfile.upiId);
    }
    if (merchantProfile.displayName || merchantProfile.businessName) {
      setPayeeName(merchantProfile.displayName || merchantProfile.businessName);
    }
  }, [merchantProfile]);

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

  // Submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { upiId?: string; totalAmount?: string; split?: string } = {};

    if (!isValidUpiId(upiId)) {
      newErrors.upiId = t.form.upiIdError;
    }

    if (totalPaise <= 0) {
      newErrors.totalAmount = t.form.totalAmountError;
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
      invoiceId: invoiceId.trim() || undefined,
      notes: notes.trim() || undefined,
      splitMethod,
      status: 'ACTIVE',
      installments,
      dueDate: installments[installments.length - 1]?.dueDate,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    onCreated(newSession, customerRef);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 grow">
          {/* Merchant UPI ID & Payee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.form.upiIdLabel}
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => {
                  setUpiId(e.target.value);
                  if (errors.upiId) setErrors({ ...errors, upiId: undefined });
                }}
                placeholder={t.form.upiIdPlaceholder}
                className="w-full h-10 px-3 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              {errors.upiId && (
                <span className="text-[11px] text-red-500 mt-1 block font-medium">
                  {errors.upiId}
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.form.payeeNameLabel}
              </label>
              <input
                type="text"
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
                placeholder="Merchant or Shop Name"
                className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* CRM Customer Selector */}
          <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Customer Selection</span>
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
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer Name (e.g. Rahul Kumar)"
                  className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Customer Phone (+91 ...)"
                  className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Total Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t.form.totalAmountLabel}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                ₹
              </span>
              <input
                type="number"
                min="1"
                step="any"
                value={totalAmountStr}
                onChange={(e) => {
                  setTotalAmountStr(e.target.value);
                  if (errors.totalAmount) setErrors({ ...errors, totalAmount: undefined });
                }}
                placeholder={t.form.totalAmountPlaceholder}
                className="w-full h-11 pl-8 pr-3 text-base font-bold tabular-nums rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {errors.totalAmount && (
              <span className="text-[11px] text-red-500 mt-1 block font-medium">
                {errors.totalAmount}
              </span>
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

          {/* Optional Invoice & Notes Fields */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
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

            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                {t.form.notesLabel}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Agreed installment schedule"
                className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
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
      </div>
    </div>
  );
};
