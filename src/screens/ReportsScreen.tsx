import React, { useMemo, useState } from 'react';
import { PaymentSession, Customer, SupportedLanguage, BusinessProfile } from '../types';
import { translations } from '../locales';
import { formatRupeesFromPaise } from '../utils/currency';
import {
  generateSessionsSummaryCsv,
  generateDetailedInstallmentsCsv,
  downloadCsv,
} from '../utils/csvExport';
import { getSessionOverdueStats } from '../utils/overdue';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Users,
  CreditCard,
  ShieldCheck,
  Download,
  FileSpreadsheet,
  Check,
  Filter,
  Layers,
  FileText,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface ReportsScreenProps {
  sessions: PaymentSession[];
  customers: Customer[];
  language: SupportedLanguage;
  profile?: BusinessProfile;
}

type ExportScope = 'ALL' | 'ACTIVE' | 'COMPLETED' | 'OVERDUE';
type ExportFormat = 'SUMMARY' | 'DETAILED';

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  sessions,
  customers,
  language,
  profile,
}) => {
  const t = translations[language].reports;

  const [exportScope, setExportScope] = useState<ExportScope>('ALL');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('SUMMARY');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  const stats = useMemo(() => {
    let confirmedTotalPaise = 0;
    let pendingTotalPaise = 0;
    let confirmedInstallmentsCount = 0;
    let totalInstallmentsCount = 0;
    let completedSessionsCount = 0;

    for (const s of sessions) {
      if (s.status === 'COMPLETED') completedSessionsCount++;

      for (const i of s.installments) {
        totalInstallmentsCount++;
        if (i.status === 'MANUALLY_CONFIRMED' || i.status === 'SUCCESS') {
          confirmedTotalPaise += i.amountPaise;
          confirmedInstallmentsCount++;
        } else if (i.status !== 'CANCELLED' && i.status !== 'FAILED') {
          pendingTotalPaise += i.amountPaise;
        }
      }
    }

    const completionRate =
      totalInstallmentsCount > 0
        ? Math.round((confirmedInstallmentsCount / totalInstallmentsCount) * 100)
        : 0;

    const averageSessionPaise =
      sessions.length > 0
        ? Math.round((confirmedTotalPaise + pendingTotalPaise) / sessions.length)
        : 0;

    return {
      confirmedTotalPaise,
      pendingTotalPaise,
      completionRate,
      averageSessionPaise,
      completedSessionsCount,
      totalSessionsCount: sessions.length,
      customersCount: customers.length,
    };
  }, [sessions, customers]);

  // Compute counts for scope filters
  const scopeCounts = useMemo(() => {
    const active = sessions.filter(
      (s) => s.status === 'ACTIVE' || s.status === 'PARTIALLY_PAID' || s.status === 'DRAFT'
    ).length;
    const completed = sessions.filter((s) => s.status === 'COMPLETED').length;
    const overdue = sessions.filter((s) => getSessionOverdueStats(s).hasOverdue).length;

    return {
      all: sessions.length,
      active,
      completed,
      overdue,
    };
  }, [sessions]);

  // Filter sessions according to chosen scope
  const filteredSessionsForExport = useMemo(() => {
    switch (exportScope) {
      case 'ACTIVE':
        return sessions.filter(
          (s) => s.status === 'ACTIVE' || s.status === 'PARTIALLY_PAID' || s.status === 'DRAFT'
        );
      case 'COMPLETED':
        return sessions.filter((s) => s.status === 'COMPLETED');
      case 'OVERDUE':
        return sessions.filter((s) => getSessionOverdueStats(s).hasOverdue);
      default:
        return sessions;
    }
  }, [sessions, exportScope]);

  // Metrics for the filtered subset about to be exported
  const exportPreviewStats = useMemo(() => {
    let totalPaise = 0;
    let confirmedPaise = 0;
    let pendingPaise = 0;
    let totalInstallmentsCount = 0;

    for (const s of filteredSessionsForExport) {
      totalPaise += s.totalAmountPaise;
      for (const i of s.installments) {
        totalInstallmentsCount++;
        if (i.status === 'MANUALLY_CONFIRMED' || i.status === 'SUCCESS') {
          confirmedPaise += i.amountPaise;
        } else if (i.status !== 'CANCELLED' && i.status !== 'FAILED') {
          pendingPaise += i.amountPaise;
        }
      }
    }

    return {
      count: filteredSessionsForExport.length,
      totalPaise,
      confirmedPaise,
      pendingPaise,
      totalInstallmentsCount,
    };
  }, [filteredSessionsForExport]);

  // CSV export handler
  const handleExecuteExport = (
    targetSessions: PaymentSession[] = filteredSessionsForExport,
    format: ExportFormat = exportFormat
  ) => {
    if (targetSessions.length === 0) return;

    setIsExporting(true);
    try {
      const shopName = profile?.businessName || 'RepairKhata';
      const cleanShopName = shopName.replace(/[^a-zA-Z0-9_-]/g, '_');

      let csvContent = '';
      let filenamePrefix = '';

      if (format === 'SUMMARY') {
        csvContent = generateSessionsSummaryCsv(targetSessions, profile?.businessName);
        filenamePrefix = `${cleanShopName}-Session-Summary`;
      } else {
        csvContent = generateDetailedInstallmentsCsv(targetSessions, profile?.businessName);
        filenamePrefix = `${cleanShopName}-Installments-Ledger`;
      }

      downloadCsv(csvContent, filenamePrefix);

      setExportSuccessMessage(
        `${t.exportSuccess} (${targetSessions.length} ${
          targetSessions.length === 1 ? 'session' : 'sessions'
        } downloaded)`
      );

      setTimeout(() => {
        setExportSuccessMessage(null);
      }, 5000);
    } catch (err) {
      console.error('Failed to export CSV:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Quick Export Action */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span>{t.title}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time analysis of your merchant payment agreements and verification status.
            </p>
          </div>

          {/* Quick Export Button in Header */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleExecuteExport(sessions, 'SUMMARY')}
              disabled={sessions.length === 0 || isExporting}
              title={sessions.length === 0 ? t.exportEmptyWarning : t.exportCsv}
              className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl shadow-xs transition-all ${
                sessions.length === 0
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white hover:shadow-emerald-500/20'
              }`}
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>{t.exportCsv}</span>
              <span className="bg-emerald-800/60 text-emerald-100 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                {sessions.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Export Success Banner */}
      {exportSuccessMessage && (
        <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{exportSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setExportSuccessMessage(null)}
            className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 font-bold text-xs underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Honest Revenue Note */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-300">
        <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
        <div>
          <span className="font-bold">Honest Accounting Standard: </span>
          <span>{t.honestNotice}</span>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-semibold text-slate-500">{t.confirmedRevenue}</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white">
            {formatRupeesFromPaise(stats.confirmedTotalPaise)}
          </p>
          <span className="text-[10px] text-emerald-600 font-bold mt-1 inline-block">
            Verified in bank account
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <span className="text-xs font-semibold text-slate-500">{t.pendingPipeline}</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white">
            {formatRupeesFromPaise(stats.pendingTotalPaise)}
          </p>
          <span className="text-[10px] text-amber-600 font-bold mt-1 inline-block">
            Agreed installments due
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-semibold text-slate-500">{t.completionRate}</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white">
            {stats.completionRate}%
          </p>
          <span className="text-[10px] text-slate-500 font-medium mt-1 inline-block">
            {stats.completedSessionsCount} of {stats.totalSessionsCount} plans complete
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-purple-600 mb-2">
            <span className="text-xs font-semibold text-slate-500">{t.averageTicket}</span>
            <CreditCard className="w-4 h-4" />
          </div>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white">
            {formatRupeesFromPaise(stats.averageSessionPaise)}
          </p>
          <span className="text-[10px] text-slate-500 font-medium mt-1 inline-block">
            Across {stats.totalSessionsCount} agreements
          </span>
        </div>
      </div>

      {/* DEDICATED EXPORT TO CSV FEATURE CARD */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{t.exportCsv}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300">
                  Excel & Sheets Ready
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t.exportCsvSubtitle}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-medium text-slate-500">
              Total Database Records:{' '}
              <strong className="text-slate-900 dark:text-white font-mono">
                {sessions.length}
              </strong>
            </span>
          </div>
        </div>

        {/* Filter Scope & Export Format Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Scope Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Select Sessions Scope:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => setExportScope('ALL')}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  exportScope === 'ALL'
                    ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                {t.filterAll} ({scopeCounts.all})
              </button>

              <button
                type="button"
                onClick={() => setExportScope('ACTIVE')}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  exportScope === 'ACTIVE'
                    ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-700 dark:text-amber-300'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                {t.filterActive} ({scopeCounts.active})
              </button>

              <button
                type="button"
                onClick={() => setExportScope('COMPLETED')}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  exportScope === 'COMPLETED'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                {t.filterCompleted} ({scopeCounts.completed})
              </button>

              <button
                type="button"
                onClick={() => setExportScope('OVERDUE')}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  exportScope === 'OVERDUE'
                    ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-300'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                }`}
              >
                Overdue ({scopeCounts.overdue})
              </button>
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>Choose CSV Layout:</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setExportFormat('SUMMARY')}
                className={`px-3 py-2 text-left rounded-lg border transition-all ${
                  exportFormat === 'SUMMARY'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>Sessions Summary</span>
                  {exportFormat === 'SUMMARY' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  1 row per session agreement
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('DETAILED')}
                className={`px-3 py-2 text-left rounded-lg border transition-all ${
                  exportFormat === 'DETAILED'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>Itemized Installments</span>
                  {exportFormat === 'DETAILED' && (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  1 row per individual QR installment
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Selected Data Summary Metrics */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Sessions in Export
              </span>
              <p className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 font-mono">
                {exportPreviewStats.count}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Total Agreement Value
              </span>
              <p className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                {formatRupeesFromPaise(exportPreviewStats.totalPaise)}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">
                Confirmed Paid
              </span>
              <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatRupeesFromPaise(exportPreviewStats.confirmedPaise)}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">
                Outstanding Balance
              </span>
              <p className="text-base font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                {formatRupeesFromPaise(exportPreviewStats.pendingPaise)}
              </p>
            </div>
          </div>
        </div>

        {/* Download Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Includes UTF-8 BOM encoding for seamless Microsoft Excel & Google Sheets rendering.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleExecuteExport(filteredSessionsForExport, exportFormat)}
              disabled={filteredSessionsForExport.length === 0 || isExporting}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl shadow-sm transition-all ${
                filteredSessionsForExport.length === 0
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white hover:shadow-emerald-500/25'
              }`}
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>
                {exportFormat === 'SUMMARY' ? t.exportSummaryBtn : t.exportDetailedBtn}
              </span>
              <span className="bg-emerald-800/60 text-emerald-100 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                {filteredSessionsForExport.length}
              </span>
            </button>
          </div>
        </div>

        {filteredSessionsForExport.length === 0 && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{t.exportEmptyWarning}</span>
          </div>
        )}
      </div>

      {/* Progress & Breakdown Visual Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Progress Bar & Split Ratio */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Total Capital Flow (Confirmed vs Pending)
          </h3>

          {(() => {
            const grandTotal = stats.confirmedTotalPaise + stats.pendingTotalPaise;
            const confirmedPct = grandTotal > 0 ? (stats.confirmedTotalPaise / grandTotal) * 100 : 0;
            const pendingPct = grandTotal > 0 ? (stats.pendingTotalPaise / grandTotal) * 100 : 0;

            return (
              <div className="space-y-2">
                <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${confirmedPct}%` }}
                    className="h-full bg-emerald-500 transition-all duration-500"
                    title={`Confirmed: ${confirmedPct.toFixed(1)}%`}
                  />
                  <div
                    style={{ width: `${pendingPct}%` }}
                    className="h-full bg-amber-400 transition-all duration-500"
                    title={`Pending: ${pendingPct.toFixed(1)}%`}
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Confirmed: {confirmedPct.toFixed(1)}% ({formatRupeesFromPaise(stats.confirmedTotalPaise)})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Pending: {pendingPct.toFixed(1)}% ({formatRupeesFromPaise(stats.pendingTotalPaise)})
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Customer Base Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span>Customer Base Summary</span>
            <Users className="w-4 h-4 text-blue-600" />
          </h3>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center">
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {stats.customersCount}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Unique Customers</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-center">
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {stats.totalSessionsCount}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Total Payment Plans</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
