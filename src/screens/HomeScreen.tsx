import React, { useState } from 'react';
import { PaymentSession, SupportedLanguage, Customer } from '../types';
import { formatPaise } from '../utils/currency';
import { translations } from '../locales';
import {
  getSessionOverdueStats,
  getAllOverdueStats,
  formatOverdueRelative,
} from '../utils/overdue';
import {
  Plus,
  Clock,
  CheckCircle2,
  Sparkles,
  Layers,
  ChevronRight,
  TrendingUp,
  Users,
  BarChart3,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';

interface HomeScreenProps {
  sessions: PaymentSession[];
  customers: Customer[];
  language: SupportedLanguage;
  onOpenCreate: () => void;
  onSelectSession: (session: PaymentSession) => void;
  onLoadDemo: () => void;
  onOpenCustomers: () => void;
  onOpenReports: () => void;
  hasDemoSession: boolean;
  analytics: {
    todaysCollectionPaise: number;
    pendingAmountPaise: number;
    activeSessionsCount: number;
    completedPaymentsCount: number;
    totalSessions: number;
    totalCustomers: number;
    overdueSessionsCount?: number;
    overdueInstallmentsCount?: number;
    overdueAmountPaise?: number;
  };
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  sessions,
  customers,
  language,
  onOpenCreate,
  onSelectSession,
  onLoadDemo,
  onOpenCustomers,
  onOpenReports,
  hasDemoSession,
  analytics,
}) => {
  const t = translations[language];
  const [sessionFilter, setSessionFilter] = useState<'all' | 'overdue'>('all');

  // Compute aggregate overdue stats across all sessions
  const overdueStats = getAllOverdueStats(sessions);

  // Filter sessions based on selected tab
  const displaySessions =
    sessionFilter === 'overdue'
      ? overdueStats.overdueSessions
      : sessions.slice(0, 5);

  return (
    <div className="space-y-5 pb-20">
      {/* Hero / Header Section with Quick Links */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t.appName}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenCustomers}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition shadow-2xs"
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>CRM Customers ({customers.length})</span>
          </button>
          <button
            type="button"
            onClick={onOpenReports}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition shadow-2xs"
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Reports</span>
          </button>
        </div>
      </div>

      {/* Dashboard Metrics Grid (PRD Section 9 & 25) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Today's Confirmed Amount Card */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t.metrics.todaysCollection}
            </span>
            <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
            {formatPaise(analytics.todaysCollectionPaise)}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 block font-semibold">
            ✓ {t.metrics.verifiedNote}
          </span>
        </div>

        {/* Pending Amount Card (with Overdue indicator if applicable) */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t.metrics.pendingAmount}
            </span>
            <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums tracking-tight">
            {formatPaise(analytics.pendingAmountPaise)}
          </div>
          {overdueStats.totalOverdueInstallments > 0 ? (
            <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
              <span>
                {overdueStats.totalOverdueInstallments} {t.overdue.badge} ({formatPaise(overdueStats.totalOverduePaise)})
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-slate-400 mt-1 block">
              Awaiting merchant credit verification
            </span>
          )}
        </div>

        {/* Active Sessions Card */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t.metrics.activeSessions}
            </span>
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
            {analytics.activeSessionsCount}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">In-progress split plans</span>
        </div>

        {/* Completed Sessions Card */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t.metrics.completedPayments}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
            {analytics.completedPaymentsCount}
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">All installments paid</span>
        </div>
      </div>

      {/* Primary Action Button (Ergonomic Large CTA) */}
      <button
        type="button"
        onClick={onOpenCreate}
        className="w-full h-13 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-extrabold text-sm rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 group"
      >
        <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
        <span>{t.actions.newPayment}</span>
      </button>

      {/* Overdue Installments Alert Banner (Visual Indicator for Immediate Follow-Up) */}
      {overdueStats.totalOverdueSessions > 0 && (
        <div className="p-3.5 sm:p-4 bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/70 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">
                  {overdueStats.totalOverdueSessions}{' '}
                  {overdueStats.totalOverdueSessions === 1
                    ? 'Session has'
                    : 'Sessions have'}{' '}
                  Overdue Installments
                </h4>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                  {t.overdue.actionRequired}
                </span>
              </div>
              <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5 truncate sm:whitespace-normal">
                {overdueStats.totalOverdueInstallments}{' '}
                {overdueStats.totalOverdueInstallments === 1
                  ? 'installment is'
                  : 'installments are'}{' '}
                past due ({formatPaise(overdueStats.totalOverduePaise)} unpaid).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() =>
                setSessionFilter(sessionFilter === 'overdue' ? 'all' : 'overdue')
              }
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition shadow-xs ${
                sessionFilter === 'overdue'
                  ? 'bg-rose-700 text-white'
                  : 'bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {sessionFilter === 'overdue' ? t.overdue.filterAll : t.overdue.filterOverdue}
            </button>
            <button
              type="button"
              onClick={() => onSelectSession(overdueStats.overdueSessions[0])}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1"
            >
              <span>{t.overdue.reviewButton}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Demo helper card if demo not loaded */}
      {!hasDemoSession && (
        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Explore with Sample Demo Data
              </h4>
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                Load ₹10,000 split into 4x ₹2,500 installments (Rahul Kumar)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLoadDemo}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs shrink-0 active:scale-95 transition"
          >
            {t.actions.tryDemo}
          </button>
        </div>
      )}

      {/* Payment Sessions Section with Overdue Badge Indicators */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {sessionFilter === 'overdue' ? 'Overdue Payment Sessions' : 'Recent Sessions'}
            </h3>
            {overdueStats.totalOverdueSessions > 0 && (
              <div className="flex items-center gap-1 ml-1">
                <button
                  type="button"
                  onClick={() => setSessionFilter('all')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition ${
                    sessionFilter === 'all'
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  All ({sessions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSessionFilter('overdue')}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                    sessionFilter === 'overdue'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 hover:bg-rose-100'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3 text-rose-500" />
                  <span>Overdue ({overdueStats.totalOverdueSessions})</span>
                </button>
              </div>
            )}
          </div>
          {displaySessions.length > 0 && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Showing {displaySessions.length}
            </span>
          )}
        </div>

        {displaySessions.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              {sessionFilter === 'overdue' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              ) : (
                <Layers className="w-6 h-6" />
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {sessionFilter === 'overdue'
                  ? 'No overdue installments!'
                  : t.emptyStates.noSessionsTitle}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                {sessionFilter === 'overdue'
                  ? 'All active installment plans are on schedule and up to date.'
                  : t.emptyStates.noSessionsDesc}
              </p>
            </div>
            {sessionFilter === 'overdue' ? (
              <button
                type="button"
                onClick={() => setSessionFilter('all')}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-semibold rounded-xl transition"
              >
                View All Sessions
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenCreate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
              >
                {t.actions.createPayment}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {displaySessions.map((session) => {
              const confirmedCount = session.installments.filter(
                (i) => i.status === 'MANUALLY_CONFIRMED' || i.status === 'SUCCESS'
              ).length;
              const totalCount = session.installments.length;
              const paidPaise = session.installments
                .filter((i) => i.status === 'MANUALLY_CONFIRMED' || i.status === 'SUCCESS')
                .reduce((acc, curr) => acc + curr.amountPaise, 0);

              const percent = Math.round((paidPaise / session.totalAmountPaise) * 100) || 0;
              const overdueInfo = getSessionOverdueStats(session);

              return (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all shadow-2xs flex items-center justify-between gap-3 group ${
                    overdueInfo.hasOverdue
                      ? 'bg-rose-50/30 dark:bg-rose-950/20 hover:bg-rose-50/60 dark:hover:bg-rose-950/35 border-rose-200 dark:border-rose-900/60 border-l-4 border-l-rose-500'
                      : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="grow min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {session.customerName || 'Direct Customer'}
                      </span>
                      {session.isDemo && (
                        <span className="text-[9px] font-bold uppercase px-1 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          DEMO
                        </span>
                      )}

                      {/* Overdue Badge (PRD highlight) */}
                      {overdueInfo.hasOverdue && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 border border-rose-300/80 dark:border-rose-800/80 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block animate-pulse" />
                          <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
                          <span>
                            {t.overdue.badge} ({overdueInfo.overdueCount}{' '}
                            {overdueInfo.overdueCount === 1 ? 'part' : 'parts'})
                          </span>
                        </span>
                      )}

                      <span className="text-slate-300 dark:text-slate-600">·</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {session.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span className="font-extrabold text-slate-900 dark:text-white tabular-nums">
                        {formatPaise(session.totalAmountPaise)}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500 text-[11px]">
                        {confirmedCount}/{totalCount} paid ({percent}%)
                      </span>
                      {overdueInfo.hasOverdue && overdueInfo.oldestDueDate && (
                        <>
                          <span className="text-rose-300 dark:text-rose-800">·</span>
                          <span className="text-rose-600 dark:text-rose-400 text-[11px] font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>
                              Part {overdueInfo.overdueInstallments[0]?.sequence || ''} (
                              {formatOverdueRelative(overdueInfo.oldestDueDate, language)}
                              )
                            </span>
                          </span>
                        </>
                      )}
                    </div>

                    {/* Micro Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full transition-all ${
                          percent === 100
                            ? 'bg-emerald-500'
                            : overdueInfo.hasOverdue
                            ? 'bg-rose-500'
                            : 'bg-blue-600'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block ${
                        session.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : overdueInfo.hasOverdue
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 font-bold'
                          : session.status === 'PARTIALLY_PAID'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {t.states[session.status]}
                    </span>
                    {overdueInfo.hasOverdue ? (
                      <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-1 flex items-center justify-end gap-1">
                        <AlertCircle className="w-2.5 h-2.5" />
                        <span>Action Due</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400 mt-1">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
