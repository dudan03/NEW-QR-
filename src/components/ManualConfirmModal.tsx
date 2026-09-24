import React, { useState } from 'react';
import { Installment, SupportedLanguage } from '../types';
import { formatPaise } from '../utils/currency';
import { translations } from '../locales';
import { AlertTriangle, Check, X, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ManualConfirmModalProps {
  isOpen: boolean;
  installment: Installment | null;
  upiId: string;
  language: SupportedLanguage;
  onConfirm: (installment: Installment, note: string) => void;
  onCancel: () => void;
  isFinalInstallment?: boolean;
}

export const ManualConfirmModal: React.FC<ManualConfirmModalProps> = ({
  isOpen,
  installment,
  upiId,
  language,
  onConfirm,
  onCancel,
  isFinalInstallment,
}) => {
  const [note, setNote] = useState('');
  const [hasIndependentlyChecked, setHasIndependentlyChecked] = useState(false);

  if (!isOpen || !installment) return null;

  const t = translations[language];

  const handleConfirm = () => {
    if (isFinalInstallment) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti optional
      }
    }
    onConfirm(installment, note);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t.verificationModal.title}
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Installment #{installment.sequence}
              </span>
            </div>
          </div>
        </div>

        {/* Content Details */}
        <div className="px-5 py-3 space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">
                {t.verificationModal.amount}
              </span>
              <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
                {formatPaise(installment.amountPaise)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">
                {t.verificationModal.upiId}
              </span>
              <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">
                {upiId}
              </span>
            </div>
          </div>

          {/* Explicit Strict Non-Provider Warning (PRD Section 18 & 19) */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold block mb-0.5">Independent Verification Required</span>
              {t.verificationModal.warning}
            </div>
          </div>

          {/* Merchant Checkbox Confirmation */}
          <label className="flex items-start gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 select-none">
            <input
              type="checkbox"
              checked={hasIndependentlyChecked}
              onChange={(e) => setHasIndependentlyChecked(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-0.5"
            />
            <span className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
              I have checked my bank statement / SMS / UPI app and verified this credit.
            </span>
          </label>

          {/* Optional Note / UTR / Remarks */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Internal Note / Remarks (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Verified on HDFC mobile app"
              className="w-full text-xs h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 px-4 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            {t.verificationModal.cancelBtn}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!hasIndependentlyChecked}
            className={`h-10 px-4 text-xs font-semibold text-white rounded-xl transition-all flex items-center gap-1.5 shadow-sm ${
              hasIndependentlyChecked
                ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]'
                : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-500'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            {t.verificationModal.confirmBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
