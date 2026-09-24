import React from 'react';
import { InAppAlert, SupportedLanguage } from '../types';
import { formatPaise } from '../utils/currency';
import {
  AlertTriangle,
  Clock,
  X,
  ChevronRight,
  Bell,
  BellRing,
} from 'lucide-react';

interface NotificationToastBannerProps {
  alerts: InAppAlert[];
  language: SupportedLanguage;
  onSelectAlert: (alert: InAppAlert) => void;
  onDismissAlert: (alertId: string) => void;
  onDismissAll: () => void;
  hasPushPermission: boolean;
  onRequestPushPermission: () => void;
}

export const NotificationToastBanner: React.FC<NotificationToastBannerProps> = ({
  alerts,
  language,
  onSelectAlert,
  onDismissAlert,
  onDismissAll,
  hasPushPermission,
  onRequestPushPermission,
}) => {
  if (alerts.length === 0) return null;

  const overdueCount = alerts.filter((a) => a.type === 'OVERDUE').length;
  const dueTodayCount = alerts.filter((a) => a.type === 'DUE_TODAY').length;
  const primaryAlert = alerts[0];

  const isOverdue = primaryAlert.type === 'OVERDUE';

  return (
    <div className="fixed top-16 right-3 left-3 sm:left-auto sm:right-6 sm:w-96 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div
        className={`rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all ${
          isOverdue
            ? 'bg-rose-50/95 dark:bg-slate-900/95 border-rose-300 dark:border-rose-800/80 text-rose-950 dark:text-rose-100 ring-1 ring-rose-500/20'
            : 'bg-amber-50/95 dark:bg-slate-900/95 border-amber-300 dark:border-amber-800/80 text-amber-950 dark:text-amber-100 ring-1 ring-amber-500/20'
        }`}
      >
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                isOverdue
                  ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400'
                  : 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400'
              }`}
            >
              {isOverdue ? (
                <AlertTriangle className="w-4 h-4 animate-bounce" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={`text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                    isOverdue
                      ? 'bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200'
                      : 'bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                  }`}
                >
                  {isOverdue ? 'Overdue Alert' : 'Due Today'}
                </span>
                {alerts.length > 1 && (
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    +{alerts.length - 1} more
                  </span>
                )}
              </div>

              <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1 truncate">
                {primaryAlert.customerName}: {formatPaise(primaryAlert.amountPaise)}
              </h4>

              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                {isOverdue
                  ? `Installment is ${primaryAlert.daysOverdue || 1} day(s) overdue. Please follow up.`
                  : 'Installment is due today. Tap to view payment QR or confirm status.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onDismissAlert(primaryAlert.id)}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Footer */}
        <div className="mt-3 pt-2.5 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-2">
          {/* Push permission enable link if not yet granted */}
          {!hasPushPermission && typeof window !== 'undefined' && 'Notification' in window && (
            <button
              type="button"
              onClick={onRequestPushPermission}
              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <BellRing className="w-3 h-3" />
              <span>Enable Device Push</span>
            </button>
          )}

          {hasPushPermission && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <Bell className="w-3 h-3" />
              <span>Push alerts active</span>
            </span>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {alerts.length > 1 && (
              <button
                type="button"
                onClick={onDismissAll}
                className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition"
              >
                Dismiss all
              </button>
            )}
            <button
              type="button"
              onClick={() => onSelectAlert(primaryAlert)}
              className={`h-7 px-3 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1 text-white ${
                isOverdue
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              <span>View</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
