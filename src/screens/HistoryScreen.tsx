import React, { useState, useMemo } from 'react';
import { PaymentSession, SessionStatus, SupportedLanguage } from '../types';
import { formatPaise } from '../utils/currency';
import { translations } from '../locales';
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  X,
} from 'lucide-react';

interface HistoryScreenProps {
  sessions: PaymentSession[];
  language: SupportedLanguage;
  onSelectSession: (session: PaymentSession) => void;
  onOpenReceipt: (session: PaymentSession) => void;
}

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';
type FilterStatus = 'ALL' | SessionStatus;

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  sessions,
  language,
  onSelectSession,
  onOpenReceipt,
}) => {
  const t = translations[language];

  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const filteredSessions = useMemo(() => {
    let result = [...sessions];

    // Search filter
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      result = result.filter(
        (s) =>
          (s.customerName && s.customerName.toLowerCase().includes(q)) ||
          (s.invoiceId && s.invoiceId.toLowerCase().includes(q)) ||
          s.upiId.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (filterStatus !== 'ALL') {
      result = result.filter((s) => s.status === filterStatus);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'highest') {
        return b.totalAmountPaise - a.totalAmountPaise;
      }
      if (sortBy === 'lowest') {
        return a.totalAmountPaise - b.totalAmountPaise;
      }
      return 0;
    });

    return result;
  }, [sessions, query, filterStatus, sortBy]);

  return (
    <div className="space-y-4 pb-24">
      {/* Title */}
      <div className="pt-2">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {t.nav.history}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Search and inspect past payment sessions
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.actions.searchPlaceholder}
          className="w-full h-11 pl-10 pr-9 text-xs rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Tabs & Sort Row */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
        {/* Status Filter buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {(['ALL', 'ACTIVE', 'PARTIALLY_PAID', 'COMPLETED', 'CANCELLED'] as FilterStatus[]).map(
            (statusKey) => (
              <button
                key={statusKey}
                type="button"
                onClick={() => setFilterStatus(statusKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterStatus === statusKey
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                {statusKey === 'ALL' ? 'All' : t.states[statusKey]}
              </button>
            )
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="shrink-0">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="h-8 px-2.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Amount</option>
            <option value="lowest">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-xs text-slate-400 flex items-center justify-between px-1">
        <span>Showing {filteredSessions.length} sessions</span>
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
          <Clock className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {t.emptyStates.noSearchResultsTitle}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t.emptyStates.noSearchResultsDesc}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredSessions.map((session) => {
            const confirmedCount = session.installments.filter(
              (i) => i.status === 'MANUALLY_CONFIRMED' || i.status === 'SUCCESS'
            ).length;
            const totalCount = session.installments.length;
            const isCompleted = session.status === 'COMPLETED';

            return (
              <div
                key={session.id}
                className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3 transition-colors hover:border-slate-300 dark:hover:border-slate-700"
              >
                <div
                  className="grow min-w-0 cursor-pointer"
                  onClick={() => onSelectSession(session)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {session.customerName || 'Direct Customer'}
                    </span>
                    {session.isDemo && (
                      <span className="text-[9px] font-bold uppercase px-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        DEMO
                      </span>
                    )}
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {session.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-extrabold text-slate-900 dark:text-white tabular-nums">
                      {formatPaise(session.totalAmountPaise)}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500 text-[11px]">
                      {confirmedCount}/{totalCount} installments confirmed
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                    <span>
                      {new Date(session.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    {session.invoiceId && (
                      <>
                        <span>·</span>
                        <span>Invoice: {session.invoiceId}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpenReceipt(session)}
                    className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title={t.receipt.subtitle}
                  >
                    <FileText className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectSession(session)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
