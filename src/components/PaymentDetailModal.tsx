import React, { useState } from 'react';
import { PaymentSession, Installment, AuditEvent, SupportedLanguage } from '../types';
import { formatPaise } from '../utils/currency';
import { translations } from '../locales';
import { isInstallmentOverdue, formatOverdueRelative } from '../utils/overdue';
import {
  X,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ShieldCheck,
  History,
  Phone,
  User,
  Ban,
} from 'lucide-react';

interface PaymentDetailModalProps {
  isOpen: boolean;
  session: PaymentSession | null;
  auditEvents: AuditEvent[];
  language: SupportedLanguage;
  onClose: () => void;
  onSelectInstallmentQr: (session: PaymentSession, installment: Installment) => void;
  onOpenReceipt: (session: PaymentSession) => void;
  onCancelSession?: (sessionId: string) => void;
}

export const PaymentDetailModal: React.FC<PaymentDetailModalProps> = ({
  isOpen,
  session,
  auditEvents,
  language,
  onClose,
  onSelectInstallmentQr,
  onOpenReceipt,
  onCancelSession,
}) => {
  const [activeTab, setActiveTab] = useState<'installments' | 'audit'>('installments');

  if (!isOpen || !session) return null;

  const t = translations[language];

  const sessionAudit = auditEvents.filter((a) => a.sessionId === session.id);

  const confirmedInstallments = session.installments.filter(
    (i) => i.status === 'MANUALLY_CONFIRMED' || i.status === 'SUCCESS'
  );
  const paidPaise = confirmedInstallments.reduce((acc, curr) => acc + curr.amountPaise, 0);
  const remainingPaise = Math.max(0, session.totalAmountPaise - paidPaise);
  const progressPercent = Math.min(
    100,
    Math.round((paidPaise / session.totalAmountPaise) * 100) || 0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {session.id}
              </h2>
              {session.isDemo && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                  DEMO DATA
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Created on {new Date(session.createdAt).toLocaleDateString()}
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

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto grow space-y-4">
          {/* Progress Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Payment Progress
              </span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                {progressPercent}% completed
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden mb-3">
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                  Total
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                  {formatPaise(session.totalAmountPaise)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-600 uppercase font-semibold block">
                  Paid
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatPaise(paidPaise)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-amber-600 uppercase font-semibold block">
                  Remaining
                </span>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                  {formatPaise(remainingPaise)}
                </span>
              </div>
            </div>
          </div>

          {/* Customer & Merchant Info Row */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                Customer Details
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                {session.customerName || 'Direct Customer'}
              </span>
              {session.customerPhone && (
                <span className="text-slate-500 block text-[11px] mt-0.5">
                  {session.customerPhone}
                </span>
              )}
              {session.invoiceId && (
                <span className="text-slate-500 font-mono block text-[11px]">
                  Inv: {session.invoiceId}
                </span>
              )}
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                Merchant UPI ID
              </span>
              <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block">
                {session.upiId}
              </span>
              <span className="text-slate-500 text-[11px] mt-0.5 block">
                Method: {session.splitMethod}
              </span>
            </div>
          </div>

          {session.notes && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">
                Notes / Terms
              </span>
              <p className="text-slate-700 dark:text-slate-300">{session.notes}</p>
            </div>
          )}

          {/* Tab Switcher: Installments vs Audit Trail */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('installments')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'installments'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Installment Schedule ({session.installments.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'audit'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Audit Trail ({sessionAudit.length})
            </button>
          </div>

          {/* Tab Content: Installments */}
          {activeTab === 'installments' && (
            <div className="space-y-2">
              {session.installments.map((inst) => {
                const isConf =
                  inst.status === 'MANUALLY_CONFIRMED' || inst.status === 'SUCCESS';
                const isOverdue = isInstallmentOverdue(inst, session.dueDate);

                return (
                  <div
                    key={inst.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 shadow-xs ${
                      isOverdue
                        ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60 border-l-4 border-l-rose-500'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isConf
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : isOverdue
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        #{inst.sequence}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white tabular-nums flex items-center gap-2">
                          <span>{formatPaise(inst.amountPaise)}</span>
                          {isOverdue && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border border-rose-200 dark:border-rose-800">
                              Overdue
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-[10px] font-medium inline-flex items-center gap-1 ${
                              isConf
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : isOverdue
                                ? 'text-rose-600 dark:text-rose-400 font-semibold'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {isConf ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : isOverdue ? (
                              <AlertCircle className="w-3 h-3 text-rose-500" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {t.states[inst.status]}
                          </span>
                          {(inst.dueDate || session.dueDate) && (
                            <span className="text-[10px] text-slate-400">
                              · Due {new Date(inst.dueDate || session.dueDate || '').toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectInstallmentQr(session, inst)}
                      className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>View QR</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab Content: Audit History */}
          {activeTab === 'audit' && (
            <div className="space-y-2">
              {sessionAudit.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No audit events recorded yet.</p>
              ) : (
                <div className="border-l-2 border-slate-200 dark:border-slate-700 ml-2 pl-3 space-y-3 py-1">
                  {sessionAudit.map((event) => (
                    <div key={event.id} className="relative text-xs">
                      <div className="w-2 h-2 bg-blue-500 rounded-full absolute -left-[17px] top-1.5" />
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                          {new Date(event.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                        {event.confirmationMethod && (
                          <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {event.confirmationMethod}
                          </span>
                        )}
                      </div>
                      <div className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                        {event.note || `Transition to ${event.newState}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Sticky Bottom Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          {session.status !== 'CANCELLED' && onCancelSession ? (
            <button
              type="button"
              onClick={() => onCancelSession(session.id)}
              className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Cancel Session</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenReceipt(session)}
              className="h-10 px-4 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{t.receipt.subtitle}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
