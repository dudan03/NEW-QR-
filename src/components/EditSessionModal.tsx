import React, { useState, useEffect } from 'react';
import { PaymentSession, Customer, SupportedLanguage } from '../types';
import { formatPaise, generateUpiUri } from '../utils/currency';
import { translations } from '../locales';
import {
  X,
  Save,
  User,
  Phone,
  Calendar,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Edit3,
} from 'lucide-react';

interface EditSessionModalProps {
  isOpen: boolean;
  session: PaymentSession | null;
  customers: Customer[];
  language: SupportedLanguage;
  onClose: () => void;
  onSave: (updatedSession: PaymentSession, updatedCustomer?: Customer) => void;
}

export const EditSessionModal: React.FC<EditSessionModalProps> = ({
  isOpen,
  session,
  customers,
  language,
  onClose,
  onSave,
}) => {
  const t = translations[language];

  const [customerName, setCustomerName] = useState(session?.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(session?.customerPhone || '');
  const [title, setTitle] = useState(session?.title || '');
  const [invoiceId, setInvoiceId] = useState(session?.invoiceId || '');
  const [notes, setNotes] = useState(session?.notes || '');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(session?.customerId || 'custom');

  // Installment due dates editable map (installment id -> due date string yyyy-mm-dd)
  const [installmentDueDates, setInstallmentDueDates] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    if (session?.installments) {
      session.installments.forEach((inst) => {
        if (inst.dueDate) {
          map[inst.id] = inst.dueDate.split('T')[0];
        }
      });
    }
    return map;
  });

  const [errors, setErrors] = useState<{
    customerName?: string;
    customerPhone?: string;
  }>({});

  // Reset fields when session changes
  useEffect(() => {
    if (session) {
      setCustomerName(session.customerName || '');
      setCustomerPhone(session.customerPhone || '');
      setTitle(session.title || '');
      setInvoiceId(session.invoiceId || '');
      setNotes(session.notes || '');
      setSelectedCustomerId(session.customerId || 'custom');

      const map: Record<string, string> = {};
      session.installments.forEach((inst) => {
        if (inst.dueDate) {
          map[inst.id] = inst.dueDate.split('T')[0];
        }
      });
      setInstallmentDueDates(map);
      setErrors({});
    }
  }, [session]);

  // Early return strictly AFTER all hook calls
  if (!isOpen || !session) return null;

  const handleSelectCustomer = (custId: string) => {
    setSelectedCustomerId(custId);
    if (custId !== 'custom' && custId !== 'new') {
      const found = customers.find((c) => c.id === custId);
      if (found) {
        setCustomerName(found.name);
        setCustomerPhone(found.phone);
      }
    }
  };

  const handleDueDateChange = (instId: string, dateStr: string) => {
    setInstallmentDueDates((prev) => ({
      ...prev,
      [instId]: dateStr,
    }));
  };

  const isCustomerMandatory = session.totalAmountPaise > 500000;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { customerName?: string; customerPhone?: string } = {};

    const cleanPhone = customerPhone.replace(/[^0-9]/g, '');

    if (isCustomerMandatory) {
      if (!customerName.trim()) {
        newErrors.customerName = 'Customer name is required for transactions above ₹5,000.';
      }
      if (!customerPhone.trim() || cleanPhone.length < 10) {
        newErrors.customerPhone = 'Valid 10-digit mobile number is required for transactions above ₹5,000.';
      }
    } else {
      if (customerPhone.trim() && cleanPhone.length < 10) {
        newErrors.customerPhone = 'Enter a valid 10-digit number, or leave blank.';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const nowIso = new Date().toISOString();

    // Prepare updated customer record if provided
    let updatedCustomer: Customer | undefined;
    let customerIdToSet = session.customerId;

    if (customerName.trim() || customerPhone.trim()) {
      if (session.customerId) {
        const existing = customers.find((c) => c.id === session.customerId);
        if (existing) {
          updatedCustomer = {
            ...existing,
            name: customerName.trim() || existing.name,
            phone: customerPhone.trim() || existing.phone,
            updatedAt: nowIso,
          };
        }
      } else {
        customerIdToSet = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        updatedCustomer = {
          id: customerIdToSet,
          name: customerName.trim() || 'Direct Customer',
          phone: customerPhone.trim() || '',
          createdAt: nowIso,
          updatedAt: nowIso,
        };
      }
    }

    // Update installments (recalculate note & update due dates)
    const updatedInstallments = session.installments.map((inst) => {
      const newDueDateStr = installmentDueDates[inst.id];
      const newDueDate = newDueDateStr ? new Date(`${newDueDateStr}T23:59:59Z`).toISOString() : inst.dueDate;

      // Regenerate payment URI with updated invoice and payee
      const paymentUri = generateUpiUri({
        upiId: session.upiId,
        payeeName: session.payeeName || 'Merchant',
        amountPaise: inst.amountPaise,
        note: `Installment ${inst.sequence} of ${session.installments.length} (${invoiceId.trim() || session.id})`,
        transactionRef: inst.id,
      });

      return {
        ...inst,
        dueDate: newDueDate,
        paymentUri,
        updatedAt: nowIso,
      };
    });

    const updatedSession: PaymentSession = {
      ...session,
      customerId: customerIdToSet,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      title: title.trim() || undefined,
      invoiceId: invoiceId.trim() || undefined,
      notes: notes.trim() || undefined,
      installments: updatedInstallments,
      dueDate: updatedInstallments[updatedInstallments.length - 1]?.dueDate || session.dueDate,
      updatedAt: nowIso,
    };

    onSave(updatedSession, updatedCustomer);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[92vh] flex flex-col pb-[env(safe-area-inset-bottom,0px)]">
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Edit3 className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Edit Payment Session
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {session.id}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Update customer contact details, session purpose, invoice, and installment due dates.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 grow">
          {/* Total Amount Badge */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Total Plan Value:
            </span>
            <span className="text-base font-black text-slate-900 dark:text-white tabular-nums">
              {formatPaise(session.totalAmountPaise)}
            </span>
          </div>

          {/* Customer Details Box */}
          <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 flex-wrap">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Customer Details</span>
                {isCustomerMandatory ? (
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
                  <option value="custom">Edit Name/Phone</option>
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
                  Customer Name {isCustomerMandatory ? <span className="text-rose-500 font-bold">*</span> : <span className="text-slate-400 font-normal text-[10px]">(Optional)</span>}
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
                  Customer Mobile Phone {isCustomerMandatory ? <span className="text-rose-500 font-bold">*</span> : <span className="text-slate-400 font-normal text-[10px]">(Optional)</span>}
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

          {/* Session Title & Invoice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Session Title / Purpose
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Website Design, Store Purchase"
                className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Invoice Reference #
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

          {/* Notes Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Remarks / Payment Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Special order notes or terms"
              className="w-full h-9 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          {/* Installment Due Dates Editor */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>Installment Due Dates ({session.installments.length} parts)</span>
              </span>
              <span className="text-[10px] text-slate-400">
                Adjust deadlines
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {session.installments.map((inst) => {
                const isPaid = inst.status === 'MANUALLY_CONFIRMED' || inst.status === 'SUCCESS';
                const dateVal = installmentDueDates[inst.id] || '';

                return (
                  <div
                    key={inst.id}
                    className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Part {inst.sequence}:
                      </span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                        {formatPaise(inst.amountPaise)}
                      </span>
                      {isPaid ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Paid</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-950 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          <span>Pending</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <label className="text-[11px] text-slate-400 shrink-0">Due:</label>
                      <input
                        type="date"
                        value={dateVal}
                        onChange={(e) => handleDueDateChange(inst.id, e.target.value)}
                        className="h-7 px-2 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </form>

        {/* Modal Sticky Bottom CTA */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
          >
            {t.actions.cancel}
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="h-9 px-5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
