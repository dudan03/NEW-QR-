import React, { useState, useMemo } from 'react';
import { PaymentSession, SupportedLanguage, Customer, Subscription, UsageSummary } from '../types';
import { formatPaise } from '../utils/currency';
import { formatCalendarDate } from '../utils/subscription';
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
  ShieldCheck,
  QrCode,
  Search,
  X,
  Calendar,
  User as UserIcon,
  Phone,
  ArrowUpRight,
  Filter,
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
  isPro?: boolean;
  subscription?: Subscription | null;
  dailyUsage?: UsageSummary | null;
  onOpenPricing?: () => void;
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
  isPro = false,
  subscription,
  dailyUsage,
  onOpenPricing,
  analytics,
}) => {
  const t = translations[language];
  const [sessionFilter, setSessionFilter] = useState<'all' | 'overdue'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchCategory, setSearchCategory] = useState<'all' | 'payments' | 'customers'>('all');

  // Compute aggregate overdue stats across all sessions
  const overdueStats = getAllOverdueStats(sessions);

  // Real-time Global Search Filter across Payments and Customers
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { filteredSessions: [], filteredCustomers: [], isSearching: false };

    const filteredSessions = sessions.filter((session) => {
      const customerName = (session.customerName || '').toLowerCase();
      const title = (session.title || '').toLowerCase();
      const invoice = (session.invoiceId || '').toLowerCase();
      const id = (session.id || '').toLowerCase();
      const phone = (session.customerPhone || '').toLowerCase();
      const upi = (session.upiId || '').toLowerCase();
      const category = (session.category || '').toLowerCase();
      const tags = (session.tags || []).map((t) => t.toLowerCase()).join(' ');
      
      // Date matching (ISO string, local formatted, month names, year)
      const dateObj = new Date(session.createdAt);
      const dateLocal = dateObj.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).toLowerCase();
      const dateIso = session.createdAt.toLowerCase();
      const rawDate = dateObj.toLocaleDateString().toLowerCase();

      return (
        customerName.includes(q) ||
        title.includes(q) ||
        invoice.includes(q) ||
        id.includes(q) ||
        phone.includes(q) ||
        upi.includes(q) ||
        category.includes(q) ||
        tags.includes(q) ||
        dateLocal.includes(q) ||
        dateIso.includes(q) ||
        rawDate.includes(q)
      );
    });

    const filteredCustomers = customers.filter((cust) => {
      const name = (cust.name || '').toLowerCase();
      const phone = (cust.phone || '').toLowerCase();
      const email = (cust.email || '').toLowerCase();
      const notes = (cust.notes || '').toLowerCase();
      const address = (cust.address || '').toLowerCase();

      const dateObj = new Date(cust.createdAt);
      const dateLocal = dateObj.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).toLowerCase();

      return (
        name.includes(q) ||
        phone.includes(q) ||
        email.includes(q) ||
        notes.includes(q) ||
        address.includes(q) ||
        dateLocal.includes(q)
      );
    });

    return {
      filteredSessions,
      filteredCustomers,
      isSearching: true,
    };
  }, [searchQuery, sessions, customers]);

  // Filter sessions based on selected tab when not searching
  const displaySessions =
    sessionFilter === 'overdue'
      ? overdueStats.overdueSessions
      : sessions.slice(0, 5);

  // Quick Financial Summary Snapshot (Total Received, Pending Amount, Active Sessions)
  const { totalReceivedPaise, pendingAmountPaise, activeSessionsCount, completedSessionsCount } = useMemo(() => {
    let received = 0;
    let pending = 0;
    let active = 0;
    let completed = 0;

    sessions.forEach((session) => {
      if (session.status === 'CANCELLED') return;

      if (session.status === 'COMPLETED') {
        completed++;
      } else {
        active++;
      }

      session.installments.forEach((inst) => {
        if (
          inst.status === 'MANUALLY_CONFIRMED' ||
          inst.status === 'SUCCESS'
        ) {
          received += inst.amountPaise;
        } else if (
          inst.status === 'PENDING' ||
          inst.status === 'QR_READY' ||
          inst.status === 'PAYMENT_INITIATED' ||
          inst.status === 'DRAFT'
        ) {
          pending += inst.amountPaise;
        }
      });
    });

    return {
      totalReceivedPaise: received,
      pendingAmountPaise: pending,
      activeSessionsCount: active,
      completedSessionsCount: completed,
    };
  }, [sessions]);

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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-2xs cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>CRM Customers ({customers.length})</span>
          </button>
          <button
            type="button"
            onClick={onOpenReports}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-2xs cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Reports</span>
          </button>
        </div>
      </div>

      {/* Top 3 Quick Financial Summary Cards (PRD Financial Snapshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Card 1: Total Received */}
        <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs relative overflow-hidden transition hover:shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Received
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-2xs">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
            {formatPaise(totalReceivedPaise)}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Bank-confirmed collections</span>
          </p>
        </div>

        {/* Card 2: Pending Amount */}
        <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs relative overflow-hidden transition hover:shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pending Amount
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-2xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tabular-nums tracking-tight">
            {formatPaise(pendingAmountPaise)}
          </div>
          {overdueStats.totalOverdueInstallments > 0 ? (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{overdueStats.totalOverdueInstallments} installments overdue ({formatPaise(overdueStats.totalOverduePaise)})</span>
            </p>
          ) : (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
              Upcoming customer installments
            </p>
          )}
        </div>

        {/* Card 3: Active Sessions */}
        <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs relative overflow-hidden transition hover:shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Sessions
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-2xs">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 tabular-nums tracking-tight">
            {activeSessionsCount}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
            {completedSessionsCount > 0 ? `${completedSessionsCount} completed plans` : 'In-progress customer plans'}
          </p>
        </div>
      </div>

      {/* Global Search Bar (Filter Payments & Customers by Name or Date) */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search payments, customers by name, phone, invoice, or date (e.g. Rahul, Sep 2026)..."
            className="w-full h-11 pl-10 pr-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* SEARCH RESULTS VIEW */}
      {searchResults.isSearching ? (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Search Header & Category Filter Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Search Results for "{searchQuery}"
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {searchResults.filteredSessions.length + searchResults.filteredCustomers.length} found
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSearchCategory('all')}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  searchCategory === 'all'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                All ({searchResults.filteredSessions.length + searchResults.filteredCustomers.length})
              </button>
              <button
                type="button"
                onClick={() => setSearchCategory('payments')}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  searchCategory === 'payments'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Payments ({searchResults.filteredSessions.length})
              </button>
              <button
                type="button"
                onClick={() => setSearchCategory('customers')}
                className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  searchCategory === 'customers'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Customers ({searchResults.filteredCustomers.length})
              </button>
            </div>
          </div>

          {/* No Results Found */}
          {searchResults.filteredSessions.length === 0 && searchResults.filteredCustomers.length === 0 && (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No matching payments or customers found
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Try searching by customer name (e.g. "Rahul"), phone number, invoice number, or payment creation date.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Clear Search
              </button>
            </div>
          )}

          {/* Matching Payments List */}
          {(searchCategory === 'all' || searchCategory === 'payments') && searchResults.filteredSessions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Payment Sessions ({searchResults.filteredSessions.length})
                </h4>
              </div>

              <div className="space-y-2">
                {searchResults.filteredSessions.map((session) => {
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
                      className="p-3.5 rounded-2xl border bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800 cursor-pointer transition-all shadow-2xs flex items-center justify-between gap-3 group"
                    >
                      <div className="grow min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {session.customerName || 'Direct Customer'}
                          </span>
                          {session.title && (
                            <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">
                              · {session.title}
                            </span>
                          )}
                          {session.invoiceId && (
                            <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded text-slate-600 dark:text-slate-300">
                              Inv: {session.invoiceId}
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
                          <span className="text-slate-300 dark:text-slate-600">·</span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(session.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block ${
                            session.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : overdueInfo.hasOverdue
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 font-bold'
                              : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          }`}
                        >
                          {t.states[session.status]}
                        </span>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Matching Customers List */}
          {(searchCategory === 'all' || searchCategory === 'customers') && searchResults.filteredCustomers.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  CRM Customers ({searchResults.filteredCustomers.length})
                </h4>
                <button
                  type="button"
                  onClick={onOpenCustomers}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Open CRM</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {searchResults.filteredCustomers.map((cust) => (
                  <div
                    key={cust.id}
                    onClick={onOpenCustomers}
                    className="p-3.5 rounded-2xl border bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 border-slate-200 dark:border-slate-800 cursor-pointer transition-all shadow-2xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 font-bold text-xs">
                        {cust.name ? cust.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">
                          {cust.name}
                        </span>
                        {cust.phone && (
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {cust.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block">
                        Added {new Date(cust.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* NORMAL DASHBOARD VIEW (WHEN NOT SEARCHING) */
        <>
          {/* Subscription Indicator & Banner (PRD Section 13 & 19) */}
          {isPro && subscription ? (
            <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                      Split UPI QR Pro
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-200 tracking-wide">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                    Expires: <strong>{formatCalendarDate(subscription.expiryDate)}</strong> · Unlimited sessions & cloud sync active
                  </p>
                </div>
              </div>
              {onOpenPricing && (
                <button
                  type="button"
                  onClick={onOpenPricing}
                  className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 flex items-center gap-1 shrink-0 self-start sm:self-center px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 shadow-2xs cursor-pointer"
                >
                  <span>Manage Subscription</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : subscription && subscription.status === 'EXPIRED' ? (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                      Split UPI QR Pro
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/80 dark:text-amber-200 tracking-wide">
                      EXPIRED
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                    Historical records are retained. Renew to resume unlimited sessions.
                  </p>
                </div>
              </div>
              {onOpenPricing && (
                <button
                  type="button"
                  onClick={onOpenPricing}
                  className="text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 px-3.5 py-1.5 rounded-xl shadow-xs transition shrink-0 self-start sm:self-center cursor-pointer"
                >
                  Renew for ₹999 / 6 Months
                </button>
              )}
            </div>
          ) : (
            /* Free Plan Usage Dashboard Card (PRD Section 4, 14 & 20) */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        Free Plan
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        3 QR requests / day
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Today's QR Requests: <strong>{dailyUsage ? dailyUsage.used : 0} / 3 used</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {dailyUsage && dailyUsage.used >= 3 ? (
                    onOpenPricing && (
                      <button
                        type="button"
                        onClick={onOpenPricing}
                        className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Upgrade to Pro — ₹999</span>
                      </button>
                    )
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={onOpenCreate}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create Payment</span>
                      </button>
                      {onOpenPricing && (
                        <button
                          type="button"
                          onClick={onOpenPricing}
                          className="px-3 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition cursor-pointer"
                        >
                          Get Pro
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Indicator (PRD Section 4 & 14) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span
                    className={
                      dailyUsage && dailyUsage.used >= 3
                        ? 'text-amber-600 dark:text-amber-400 font-bold'
                        : 'text-slate-600 dark:text-slate-300'
                    }
                  >
                    {dailyUsage && dailyUsage.used >= 3
                      ? 'Daily free limit reached'
                      : dailyUsage && dailyUsage.used === 2
                      ? '1 QR request remaining today'
                      : dailyUsage && dailyUsage.used === 1
                      ? '2 QR requests remaining today'
                      : '3 QR requests remaining today'}
                  </span>
                  <span className="font-mono text-slate-500">
                    {dailyUsage ? dailyUsage.used : 0} / 3
                  </span>
                </div>

                {/* Visual 3-Segment Progress Bar */}
                <div className="grid grid-cols-3 gap-1.5 h-2.5">
                  {[1, 2, 3].map((slot) => {
                    const usedCount = dailyUsage ? dailyUsage.used : 0;
                    const isFilled = slot <= usedCount;
                    const isLimitReached = usedCount >= 3;
                    return (
                      <div
                        key={slot}
                        className={`rounded-full transition-all duration-300 ${
                          isFilled
                            ? isLimitReached
                              ? 'bg-amber-500'
                              : 'bg-blue-600'
                            : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Daily limit reached warning or notice */}
              {dailyUsage && dailyUsage.used >= 3 ? (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>
                      You've used all 3 free QR requests for today. Your allowance will reset tomorrow.
                    </span>
                  </div>
                  {onOpenPricing && (
                    <button
                      type="button"
                      onClick={onOpenPricing}
                      className="text-amber-800 dark:text-amber-300 font-bold hover:underline self-start sm:self-auto shrink-0"
                    >
                      Upgrade to Pro (₹999 / 6 Months) →
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>
                    QR Generated ≠ Payment Received. Always verify credits independently in your bank or UPI app.
                  </span>
                </div>
              )}
            </div>
          )}

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
            className="w-full h-13 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-extrabold text-sm rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 group cursor-pointer"
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
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition shadow-xs cursor-pointer ${
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
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
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
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs shrink-0 active:scale-95 transition cursor-pointer"
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
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
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
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
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
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    View All Sessions
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenCreate}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer"
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
                          {session.title && (
                            <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">
                              · {session.title}
                            </span>
                          )}
                          {session.category && (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                              {session.category}
                            </span>
                          )}
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

                        {session.tags && session.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {session.tags.map((t) => (
                              <span
                                key={t}
                                className="text-[9px] font-medium px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}

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
        </>
      )}
    </div>
  );
};
