import React from 'react';
import { InAppAlert, SupportedLanguage } from '../types';
import { formatPaise } from '../utils/currency';
import {
  Bell,
  X,
  AlertTriangle,
  Clock,
  ChevronRight,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: InAppAlert[];
  language: SupportedLanguage;
  onSelectAlert: (alert: InAppAlert) => void;
  onDismissAlert: (alertId: string) => void;
  onClearAll: () => void;
  hasPushPermission: boolean;
  onRequestPushPermission: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  alerts,
  language,
  onSelectAlert,
  onDismissAlert,
  onClearAll,
  hasPushPermission,
  onRequestPushPermission,
}) => {
  if (!isOpen) return null;

  const overdueAlerts = alerts.filter((a) => a.type === 'OVERDUE');
  const dueTodayAlerts = alerts.filter((a) => a.type === 'DUE_TODAY');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Due Date Alerts & Notifications</span>
                {alerts.length > 0 && (
                  <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200">
                    {alerts.length}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">
                Scheduled payment deadlines and overdue reminders
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Push Notification Permission Banner */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                hasPushPermission ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span className="text-slate-600 dark:text-slate-300 text-[11px]">
              {hasPushPermission
                ? 'System push notifications are active'
                : 'Enable system push notifications for background alerts'}
            </span>
          </div>
          {!hasPushPermission && (
            <button
              type="button"
              onClick={onRequestPushPermission}
              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded-lg shadow-2xs transition"
            >
              Enable Push
            </button>
          )}
        </div>

        {/* Alert List */}
        <div className="p-4 overflow-y-auto space-y-3 grow">
          {alerts.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                All caught up!
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                No installments are currently overdue or due today. The scheduler runs automatically.
              </p>
            </div>
          ) : (
            <>
              {overdueAlerts.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Overdue Installments ({overdueAlerts.length})</span>
                  </div>

                  {overdueAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-3 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-center justify-between gap-3 transition hover:border-rose-300"
                    >
                      <div className="min-w-0 grow">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {alert.customerName}
                          </span>
                          <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                            {alert.daysOverdue || 1}d Overdue
                          </span>
                        </div>
                        <div className="text-xs font-extrabold text-slate-900 dark:text-white tabular-nums mt-0.5">
                          {formatPaise(alert.amountPaise)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Due Date: {new Date(alert.dueDate).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectAlert(alert);
                            onClose();
                          }}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1"
                        >
                          <span>Review</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDismissAlert(alert.id)}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                          title="Dismiss"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {dueTodayAlerts.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Due Today ({dueTodayAlerts.length})</span>
                  </div>

                  {dueTodayAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-center justify-between gap-3 transition hover:border-amber-300"
                    >
                      <div className="min-w-0 grow">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {alert.customerName}
                          </span>
                          <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                            Due Today
                          </span>
                        </div>
                        <div className="text-xs font-extrabold text-slate-900 dark:text-white tabular-nums mt-0.5">
                          {formatPaise(alert.amountPaise)}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Awaiting QR scan or merchant credit verification
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectAlert(alert);
                            onClose();
                          }}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1"
                        >
                          <span>Review</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDismissAlert(alert.id)}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                          title="Dismiss"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {alerts.length > 0 && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs text-slate-500 hover:text-rose-600 transition flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Dismiss All Alerts</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
