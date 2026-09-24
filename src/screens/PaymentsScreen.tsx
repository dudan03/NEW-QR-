import React, { useState, useEffect } from 'react';
import { PaymentSession, Installment, SupportedLanguage } from '../types';
import { formatPaise } from '../utils/currency';
import { translations } from '../locales';
import { QRCodeViewer } from '../components/QRCodeViewer';
import { getSessionOverdueStats, isInstallmentOverdue } from '../utils/overdue';
import {
  Layers,
  CheckCircle2,
  Clock,
  QrCode,
  ChevronRight,
  Plus,
  FileText,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';

interface PaymentsScreenProps {
  sessions: PaymentSession[];
  language: SupportedLanguage;
  selectedSessionId?: string;
  selectedInstallmentId?: string;
  onOpenCreate: () => void;
  onMarkReceived: (installment: Installment, session: PaymentSession) => void;
  onOpenDetail: (session: PaymentSession) => void;
  onOpenReceipt: (session: PaymentSession) => void;
}

export const PaymentsScreen: React.FC<PaymentsScreenProps> = ({
  sessions,
  language,
  selectedSessionId: propSessionId,
  selectedInstallmentId: propInstallmentId,
  onOpenCreate,
  onMarkReceived,
  onOpenDetail,
  onOpenReceipt,
}) => {
  const t = translations[language];

  // Active / in-progress sessions (or all non-cancelled)
  const activeSessions = sessions.filter(
    (s) => s.status === 'ACTIVE' || s.status === 'PARTIALLY_PAID' || s.status === 'DRAFT'
  );

  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    propSessionId || activeSessions[0]?.id || sessions[0]?.id || ''
  );
  const [selectedInstallmentIndex, setSelectedInstallmentIndex] = useState<number>(0);

  // Sync when parent changes the selected session or installment (e.g. from alerts or modal)
  useEffect(() => {
    if (propSessionId) {
      setSelectedSessionId(propSessionId);
      const targetSession = sessions.find((s) => s.id === propSessionId);
      if (targetSession && propInstallmentId) {
        const idx = targetSession.installments.findIndex((i) => i.id === propInstallmentId);
        if (idx >= 0) {
          setSelectedInstallmentIndex(idx);
          return;
        }
      }
      if (targetSession) {
        // Default to first pending installment
        const pendingIdx = targetSession.installments.findIndex(
          (i) => i.status !== 'MANUALLY_CONFIRMED' && i.status !== 'SUCCESS'
        );
        setSelectedInstallmentIndex(pendingIdx >= 0 ? pendingIdx : 0);
      }
    }
  }, [propSessionId, propInstallmentId, sessions]);

  const currentSession = sessions.find((s) => s.id === selectedSessionId) || activeSessions[0] || sessions[0];

  const currentInstallment =
    currentSession?.installments[selectedInstallmentIndex] || currentSession?.installments[0];

  return (
    <div className="space-y-5 pb-24">
      {/* Title */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {t.nav.payments}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Active UPI QR installment sessions
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenCreate}
          className="h-9 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New</span>
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No active payment sessions
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Create a new payment request or load demo data to view QR installments.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenCreate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs"
          >
            {t.actions.createPayment}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Session Switcher Pills / Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {sessions.map((sess) => {
              const isSelected = sess.id === currentSession?.id;
              const isDone = sess.status === 'COMPLETED';
              const sessOverdue = getSessionOverdueStats(sess);

              return (
                <button
                  key={sess.id}
                  type="button"
                  onClick={() => {
                    setSelectedSessionId(sess.id);
                    // find first pending installment or index 0
                    const firstPendingIdx = sess.installments.findIndex(
                      (i) => i.status !== 'MANUALLY_CONFIRMED' && i.status !== 'SUCCESS'
                    );
                    setSelectedInstallmentIndex(firstPendingIdx >= 0 ? firstPendingIdx : 0);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs whitespace-nowrap shrink-0 font-medium transition-all flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-semibold'
                      : sessOverdue.hasOverdue
                      ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/60 text-slate-800 dark:text-slate-200 hover:bg-rose-100/60'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span>{sess.customerName || sess.id}</span>
                  {sess.isDemo && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold uppercase">
                      DEMO
                    </span>
                  )}
                  {sessOverdue.hasOverdue && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200 font-bold flex items-center gap-0.5">
                      <AlertTriangle className="w-2.5 h-2.5 text-rose-600 dark:text-rose-300" />
                      <span>{sessOverdue.overdueCount}</span>
                    </span>
                  )}
                  {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                </button>
              );
            })}
          </div>

          {/* Active Session Card Summary */}
          {currentSession && (() => {
            const currentSessionOverdue = getSessionOverdueStats(currentSession);
            return (
              <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                currentSessionOverdue.hasOverdue
                  ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 border-l-4 border-l-rose-500'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800'
              }`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 block text-[10px]">CURRENT SESSION</span>
                    {currentSessionOverdue.hasOverdue && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border border-rose-200 dark:border-rose-800 flex items-center gap-0.5">
                        <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                        <span>{currentSessionOverdue.overdueCount} Overdue</span>
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {currentSession.customerName || 'Customer'}
                  </span>
                  <span className="text-slate-400 mx-1">·</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                    {formatPaise(currentSession.totalAmountPaise)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenDetail(currentSession)}
                    className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-medium"
                  >
                    Details
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenReceipt(currentSession)}
                    className="px-2.5 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 shadow-xs"
                  >
                    <FileText className="w-3 h-3" />
                    Receipt
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Active Installment QR Code Viewer Component */}
          {currentSession && currentInstallment && (
            <QRCodeViewer
              session={currentSession}
              installment={currentInstallment}
              totalInstallments={currentSession.installments.length}
              language={language}
              onMarkReceived={(inst) => onMarkReceived(inst, currentSession)}
              onSelectInstallment={(idx) => setSelectedInstallmentIndex(idx)}
            />
          )}
        </div>
      )}
    </div>
  );
};
