import React from 'react';
import { SyncStatusState, SupportedLanguage } from '../types';
import { translations } from '../locales';
import { CheckCircle2, RefreshCw, CloudOff, AlertTriangle } from 'lucide-react';

interface SyncStatusBadgeProps {
  status: SyncStatusState;
  onSyncNow: () => void;
  language: SupportedLanguage;
  lastSyncTime?: string | null;
  compact?: boolean;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  status,
  onSyncNow,
  language,
  lastSyncTime,
  compact = false,
}) => {
  const t = translations[language].cloudSync;

  const getStatusDisplay = () => {
    switch (status) {
      case 'syncing':
        return {
          icon: <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />,
          label: t.syncing,
          bg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        };
      case 'offline':
        return {
          icon: <CloudOff className="w-3.5 h-3.5 text-amber-500" />,
          label: t.offline,
          bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        };
      case 'error':
        return {
          icon: <AlertTriangle className="w-3.5 h-3.5 text-red-500" />,
          label: t.error,
          bg: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-800',
        };
      case 'synced':
      default:
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
          label: t.synced,
          bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        };
    }
  };

  const display = getStatusDisplay();

  if (compact) {
    return (
      <button
        type="button"
        onClick={onSyncNow}
        disabled={status === 'syncing'}
        title={`${display.label}${lastSyncTime ? ` • Last: ${new Date(lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}`}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-medium transition-all ${display.bg} hover:opacity-90 active:scale-95`}
      >
        {display.icon}
        <span className="hidden sm:inline text-[11px]">{display.label}</span>
      </button>
    );
  }

  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium ${display.bg}`}>
      <div className="flex items-center gap-2">
        {display.icon}
        <div>
          <p className="font-semibold">{display.label}</p>
          {lastSyncTime && (
            <p className="text-[10px] opacity-75 mt-0.5">
              {t.lastSync}: {new Date(lastSyncTime).toLocaleString()}
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onSyncNow}
        disabled={status === 'syncing'}
        className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg shadow-2xs border border-current text-[11px] font-bold hover:opacity-80 active:scale-95 transition"
      >
        {t.syncNow}
      </button>
    </div>
  );
};
