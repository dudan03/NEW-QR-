import React, { useRef } from 'react';
import { PaymentSession, SupportedLanguage, BusinessProfile } from '../types';
import { formatPaise } from '../utils/currency';
import { translations } from '../locales';
import {
  Printer,
  Download,
  Share2,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  MapPin,
  Phone,
} from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  session: PaymentSession | null;
  merchantProfile: BusinessProfile;
  language: SupportedLanguage;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  session,
  merchantProfile,
  language,
  onClose,
}) => {
  const receiptRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen || !session) return null;

  const t = translations[language];

  // Calculate confirmed amount
  const paidPaise = session.installments
    .filter((i) => i.status === 'MANUALLY_CONFIRMED' || i.status === 'SUCCESS')
    .reduce((acc, curr) => acc + curr.amountPaise, 0);

  const remainingPaise = Math.max(0, session.totalAmountPaise - paidPaise);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const text = `*QR SplitPay India - Payment Record*\nSession ID: ${session.id}\nCustomer: ${session.customerName || 'N/A'}\nInvoice: ${session.invoiceId || 'N/A'}\nTotal: ${formatPaise(session.totalAmountPaise)}\nPaid to date: ${formatPaise(paidPaise)}\nStatus: ${t.states[session.status]}\n\n(Merchant-generated record; not a bank-issued receipt)`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Payment Record - ${session.id}`,
          text,
        });
      } catch {
        // Ignored
      }
    } else {
      await navigator.clipboard.writeText(text);
      alert('Payment record details copied to clipboard.');
    }
  };

  const handleDownloadText = () => {
    const text = `========================================
QR SPLITPAY INDIA - PAYMENT RECORD
========================================
Session ID: ${session.id}
Date: ${new Date(session.createdAt).toLocaleString('en-IN')}
Status: ${session.status}

MERCHANT DETAILS:
Business: ${merchantProfile.businessName}
UPI ID: ${session.upiId}
${merchantProfile.phone ? `Phone: ${merchantProfile.phone}` : ''}
${merchantProfile.address ? `Address: ${merchantProfile.address}` : ''}

CUSTOMER DETAILS:
Name: ${session.customerName || 'N/A'}
Phone: ${session.customerPhone || 'N/A'}
Invoice: ${session.invoiceId || 'N/A'}

FINANCIAL SUMMARY:
Total Agreed Amount: ${formatPaise(session.totalAmountPaise)}
Total Received:     ${formatPaise(paidPaise)}
Remaining Balance:  ${formatPaise(remainingPaise)}

INSTALLMENTS BREAKDOWN:
${session.installments
  .map(
    (i) =>
      `Part ${i.sequence}: ${formatPaise(i.amountPaise)} - [${i.status}] ${
        i.confirmedAt ? `(Confirmed: ${new Date(i.confirmedAt).toLocaleDateString()})` : ''
      }`
  )
  .join('\n')}

${merchantProfile.receiptFooter ? `\nNOTE: ${merchantProfile.receiptFooter}\n` : ''}
========================================
DISCLAIMER:
Merchant-generated payment record; not a bank-issued receipt.
QR SplitPay India does not process, hold, or settle funds.
========================================`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Receipt-${session.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header Actions */}
        <div className="no-print px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t.receipt.subtitle}
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title={t.actions.printReceipt}
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleDownloadText}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title={t.actions.downloadReceipt}
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title={t.actions.shareQr}
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Body */}
        <div className="p-6 overflow-y-auto grow" id="printable-receipt" ref={receiptRef}>
          <div className="bg-white text-slate-900 p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
            {/* Top Brand & Title */}
            <div className="text-center border-b border-slate-200 pb-4">
              <div className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">
                {t.appName}
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {t.receipt.subtitle}
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-mono">{session.id}</p>
              {session.isDemo && (
                <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  DEMO RECORD
                </span>
              )}
            </div>

            {/* Merchant & Customer Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium uppercase text-[10px]">
                  {t.receipt.merchant}
                </span>
                <span className="font-semibold text-slate-800 block text-sm">
                  {merchantProfile.businessName}
                </span>
                <span className="font-mono text-slate-600 block">{session.upiId}</span>
                {merchantProfile.address && (
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {merchantProfile.address}
                  </span>
                )}
                {merchantProfile.phone && (
                  <span className="text-[11px] text-slate-500 block font-mono">
                    Tel: {merchantProfile.phone}
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-slate-400 block font-medium uppercase text-[10px]">
                  {t.receipt.customer}
                </span>
                <span className="font-semibold text-slate-800 block text-sm">
                  {session.customerName || 'Direct Customer'}
                </span>
                {session.customerPhone && (
                  <span className="text-slate-600 block">{session.customerPhone}</span>
                )}
                {session.invoiceId && (
                  <span className="font-mono text-slate-500 block">Inv: {session.invoiceId}</span>
                )}
              </div>
            </div>

            {/* Date & Overall Status */}
            <div className="flex justify-between items-center py-2 px-3 bg-slate-50 rounded-lg text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">{t.receipt.date}</span>
                <span className="font-medium text-slate-700">
                  {new Date(session.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[10px]">{t.receipt.status}</span>
                <span className="font-bold text-blue-700 uppercase">
                  {t.states[session.status]}
                </span>
              </div>
            </div>

            {/* Installments Table */}
            <div>
              <span className="block text-xs font-semibold text-slate-800 mb-2">
                {t.receipt.installmentBreakdown}
              </span>
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2">Part</th>
                      <th className="p-2">Amount</th>
                      <th className="p-2">Status</th>
                      <th className="p-2 text-right">Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {session.installments.map((inst) => {
                      const isConf =
                        inst.status === 'MANUALLY_CONFIRMED' || inst.status === 'SUCCESS';
                      return (
                        <tr key={inst.id} className="hover:bg-slate-50/50">
                          <td className="p-2 font-medium">#{inst.sequence}</td>
                          <td className="p-2 font-bold tabular-nums">
                            {formatPaise(inst.amountPaise)}
                          </td>
                          <td className="p-2">
                            <span
                              className={`inline-flex items-center gap-1 font-medium ${
                                isConf ? 'text-emerald-700' : 'text-amber-700'
                              }`}
                            >
                              {isConf && '✓ '}
                              {t.states[inst.status]}
                            </span>
                          </td>
                          <td className="p-2 text-right font-mono text-[11px] text-slate-500">
                            {inst.confirmationMethod === 'MANUAL' ? 'MANUAL' : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Totals */}
            <div className="border-t border-slate-200 pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>{t.receipt.totalAmount}:</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {formatPaise(session.totalAmountPaise)}
                </span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>{t.receipt.amountPaid}:</span>
                <span className="tabular-nums">{formatPaise(paidPaise)}</span>
              </div>
              {remainingPaise > 0 && (
                <div className="flex justify-between text-amber-700 font-semibold">
                  <span>{t.receipt.amountRemaining}:</span>
                  <span className="tabular-nums">{formatPaise(remainingPaise)}</span>
                </div>
              )}
            </div>

            {/* Custom Footer Note if set */}
            {merchantProfile.receiptFooter && (
              <p className="text-center text-xs text-slate-600 italic border-t border-slate-100 pt-2">
                "{merchantProfile.receiptFooter}"
              </p>
            )}

            {/* Mandatory Non-Bank Disclaimer (PRD Section 24 & 40) */}
            <div className="border-t border-dashed border-slate-300 pt-3 text-[10px] text-slate-500 leading-normal text-center">
              <p className="font-semibold text-slate-700 mb-0.5">
                {t.receipt.disclaimer}
              </p>
              <p>
                Generated via QR SplitPay India utility. All receipts subject to merchant's independent verification.
              </p>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="no-print p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="h-10 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>{t.actions.printReceipt}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
