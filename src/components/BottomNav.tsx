import React from 'react';
import { SupportedLanguage } from '../types';
import { translations } from '../locales';
import { Home, Layers, Users, BarChart3, Clock, Settings } from 'lucide-react';

export type NavTab = 'home' | 'payments' | 'customers' | 'reports' | 'history' | 'settings';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  language: SupportedLanguage;
  pendingCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  language,
  pendingCount = 0,
}) => {
  const t = translations[language];

  const tabs: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: t.nav.home, icon: Home },
    { id: 'payments', label: t.nav.payments, icon: Layers },
    { id: 'customers', label: t.customers.title, icon: Users },
    { id: 'reports', label: t.reports.title, icon: BarChart3 },
    { id: 'settings', label: t.nav.settings, icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-xl mx-auto grid grid-cols-5 h-16 items-center px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className="relative min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-all"
            >
              <div
                className={`relative p-1 rounded-lg transition-transform ${
                  isActive
                    ? 'scale-110 text-blue-600 dark:text-blue-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.id === 'payments' && pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-semibold mt-0.5 tracking-tight transition-colors truncate max-w-full px-1 ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
