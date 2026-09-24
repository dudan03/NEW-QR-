import React from 'react';
import { SupportedLanguage } from '../types';
import { translations } from '../locales';
import { Cloud, Users, Receipt, ArrowRight } from 'lucide-react';
import { formatRupeesFromPaise } from '../utils/currency';

interface WelcomeBackModalProps {
  isOpen: boolean;
  language: SupportedLanguage;
  stats: {
    customersCount: number;
    sessionsCount: number;
    totalRecordedPaise: number;
  };
  onSync: () => void;
  onDismiss: () => void;
}

export const WelcomeBackModal: React.FC<WelcomeBackModalProps> = ({
  isOpen,
  language,
  stats,
  onSync,
  onDismiss,
}) => {
  const t = translations[language].auth;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 border border-emerald-100 dark:border-emerald-900/40 shadow-xs">
          <Cloud className="w-7 h-7" />
        </div>

        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
          {t.welcomeBack}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t.cloudDataFound}
        </p>

        {/* Data summary preview */}
        <div className="mt-5 grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="text-center">
            <div className="flex items-center justify-center text-blue-600 mb-1">
              <Users className="w-4 h-4" />
            </div>
            <p className="text-base font-extrabold text-slate-900 dark:text-white">
              {stats.customersCount}
            </p>
            <p className="text-[10px] text-slate-500 font-medium">Customers</p>
          </div>

          <div className="text-center border-x border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-center text-teal-600 mb-1">
              <Receipt className="w-4 h-4" />
            </div>
            <p className="text-base font-extrabold text-slate-900 dark:text-white">
              {stats.sessionsCount}
            </p>
            <p className="text-[10px] text-slate-500 font-medium">Sessions</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center text-emerald-600 mb-1 font-bold text-xs">
              ₹
            </div>
            <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
              {formatRupeesFromPaise(stats.totalRecordedPaise)}
            </p>
            <p className="text-[10px] text-slate-500 font-medium">Recorded</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onSync}
          className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-bold rounded-xl shadow-xs transition-all"
        >
          <span>{t.syncData}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onDismiss}
          className="mt-2.5 w-full py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
        >
          Later
        </button>
      </div>
    </div>
  );
};
