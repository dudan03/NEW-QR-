import React from 'react';
import { SupportedLanguage } from '../types';
import { translations } from '../locales';
import {
  QrCode,
  ShieldCheck,
  Smartphone,
  Cloud,
  Users,
  Receipt,
  TrendingUp,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Laptop,
  ExternalLink,
  Shield,
  FileText,
  Mail,
  Zap,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface LandingPageProps {
  language: SupportedLanguage;
  onStartApp: () => void;
  onOpenAuth: () => void;
  onOpenLegal: (tab: 'privacy' | 'terms' | 'data') => void;
  onOpenPricing?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  language,
  onStartApp,
  onOpenAuth,
  onOpenLegal,
  onOpenPricing,
}) => {
  const t = translations[language];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
                Split UPI QR
              </h1>
              <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                Split. Scan. Pay. Track.
              </p>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <a href="#how-it-works" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
              How It Works
            </a>
            <a href="#purpose-oauth" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
              About & Google OAuth
            </a>
            <a href="#features" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
              Features
            </a>
            <a href="#pricing" className="hover:text-blue-600 dark:hover:text-blue-400 transition">
              Pricing
            </a>
            <button
              type="button"
              onClick={() => onOpenLegal('privacy')}
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => onOpenLegal('terms')}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
            >
              Terms
            </button>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <PWAInstallButton variant="outline" />
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={onStartApp}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-95 transition cursor-pointer"
            >
              Launch Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-14 sm:py-20 px-4 sm:px-6 bg-gradient-to-b from-blue-50/80 via-slate-50 to-slate-50 dark:from-blue-950/40 dark:via-slate-950 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-700 dark:text-blue-300">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Official Domain: https://www.splitupiqr.in • Built for Indian Merchants & Small Businesses</span>
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-950 dark:text-white leading-tight">
            Split Large UPI Payments into{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Organized Installments
            </span>
          </h2>

          <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            <strong>Split UPI QR</strong> is a specialized billing and split payment management utility. Generate paise-accurate NPCI standard UPI QR codes for each installment, track manual merchant confirmations, organize customer CRM records, and sync data securely across your counter devices.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onStartApp}
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Get Started Free (No Credit Card)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onOpenAuth}
              className="w-full sm:w-auto px-6 py-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2.5 shadow-2xs cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
              <span>Sign In with Google</span>
            </button>
          </div>

          {/* Trust points */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-5 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              100% Free Plan (4 Daily QRs)
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Works with Any UPI App (GPay, PhonePe, Paytm)
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Offline Capable PWA
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-blue-500" />
              Zero UPI PIN Storage
            </span>
          </div>
        </div>
      </section>

      {/* SECTION: Application Purpose & Google OAuth Explanation */}
      <section id="purpose-oauth" className="py-16 px-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-700 dark:text-blue-300">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Application Purpose & Verification Transparency</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              What is Split UPI QR & Why We Use Google Sign-In
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Clear, transparent explanations of how Split UPI QR works and how we safeguard user data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Box 1: App Purpose */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                <QrCode className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                1. Core Application Purpose
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Split UPI QR helps shopkeepers, electronics retailers, coaching institutes, and service providers offer installment-based UPI payments to their walk-in or remote customers.
              </p>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc pl-5">
                <li>Divides total bill into equal or custom installment amounts with <strong>zero remainder paise discrepancy</strong>.</li>
                <li>Generates NPCI standard UPI QR codes with custom notes and invoice references.</li>
                <li>Provides a simple CRM ledger to track paid vs overdue installments.</li>
              </ul>
            </div>

            {/* Box 2: Google OAuth Usage */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                2. Why We Use Google Sign-In (OAuth 2.0)
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                We use Google Sign-In exclusively for <strong>merchant authentication</strong> and multi-device cloud synchronization.
              </p>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc pl-5">
                <li><strong>SSO Authentication:</strong> Securely sign in without having to create or remember passwords.</li>
                <li><strong>Cloud Backup & Sync:</strong> Keeps your customer records and payment sessions synced between your counter laptop, tablet, and mobile.</li>
                <li><strong>Strict Limited Use:</strong> We request only basic profile & email scopes (<code className="font-mono text-blue-600">openid</code>, <code className="font-mono text-blue-600">email</code>, <code className="font-mono text-blue-600">profile</code>). We NEVER sell or share your data.</li>
              </ul>
            </div>
          </div>

          {/* Privacy Policy Callout Box */}
          <div className="p-5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  Read our Comprehensive Privacy Policy & Terms
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Fully compliant with Google API Services User Data Policy, Limited Use Requirements, and Indian IT Rules.
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onOpenLegal('privacy')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                View Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => onOpenLegal('terms')}
                className="px-3 py-2 border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Terms of Service
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: How It Works */}
      <section id="how-it-works" className="py-16 px-4 sm:px-6 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              How Split UPI QR Works in 4 Simple Steps
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              No complex setup or bank paperwork required. Works with your existing UPI ID.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-sm">
                1
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Enter Bill Amount</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Input the customer's total invoice (e.g. ₹10,000) and choose the number of installment splits (e.g. 4 parts).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-sm">
                2
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Instant Paise Splits</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                The smart engine calculates exact installment breakdowns with custom due dates and zero rounding errors.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-sm">
                3
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Customer Scans QR</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Customer scans the dynamic QR code with Google Pay, PhonePe, Paytm, or BHIM. Direct bank-to-bank credit.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-sm">
                4
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Verify & Print Receipt</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Check your merchant bank soundbox/SMS, mark installment confirmed, and print or share a digital WhatsApp receipt.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: Features Grid */}
      <section id="features" className="py-16 px-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Built for Modern Retail & Service Counters
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Everything you need to collect split payments cleanly without costly POS machines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Printable Merchant Receipts</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Generate clean, thermal-printable and 58mm/80mm receipts with your shop logo, contact, and installment breakdown.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Customer CRM Directory</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Maintain contact details, payment history, outstanding balances, and send 1-click WhatsApp payment reminders.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 flex items-center justify-center">
                <Cloud className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Offline-First Cloud Sync</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Works offline without internet. Records queue locally and automatically sync to the cloud when online.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: Pricing Plans */}
      <section id="pricing" className="py-16 px-4 sm:px-6 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Transparent, Fair Pricing
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Start completely free with 4 QR requests per day, or upgrade to Pro for unlimited usage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free Plan */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Free Starter Plan</h4>
                <p className="text-xs text-slate-500">For daily small merchants & trials</p>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">
                ₹0 <span className="text-xs text-slate-400 font-normal">/ forever</span>
              </p>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <strong>4 QR payment requests per day</strong>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Full Customer CRM Directory
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Printable / Downloadable Receipts
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Offline PWA Support
                </li>
              </ul>
              <button
                type="button"
                onClick={onStartApp}
                className="w-full py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-white text-xs font-bold transition cursor-pointer"
              >
                Use Free Plan
              </button>
            </div>

            {/* Pro Plan */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-blue-50/70 to-white dark:from-blue-950/40 dark:to-slate-900 border-2 border-blue-600 shadow-md space-y-4 relative">
              <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider">
                Popular
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Split UPI QR Pro</h4>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">For busy shops & billing counters</p>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white">
                ₹999 <span className="text-xs text-slate-400 font-normal">/ 6 months (₹166/mo)</span>
              </p>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <strong>Unlimited QR Payment Generation</strong>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Unlimited Customer & Session History
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Instant Razorpay Pro Activation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Multi-device real-time cloud sync
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Full CSV spreadsheet data export
                </li>
              </ul>
              <button
                type="button"
                onClick={onOpenPricing || onStartApp}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Get Pro Subscription (₹999)</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-12 px-4 sm:px-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Split UPI QR</h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                Split. Scan. Pay. Track. Designed for Indian merchant installment management.
              </p>
              <p className="text-[11px] text-slate-400">
                Official Domain: <a href="https://www.splitupiqr.in" className="text-blue-600 hover:underline">https://www.splitupiqr.in</a>
              </p>
            </div>

            {/* Legal Links Column */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <button
                type="button"
                onClick={() => onOpenLegal('privacy')}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
              >
                Privacy Policy
              </button>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <button
                type="button"
                onClick={() => onOpenLegal('terms')}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
              >
                Terms of Service
              </button>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <button
                type="button"
                onClick={() => onOpenLegal('data')}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
              >
                Data Security Policy
              </button>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <a
                href="mailto:anshumanparida913@gmail.com"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center gap-1"
              >
                <Mail className="w-3 h-3" />
                <span>Contact Developer</span>
              </a>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <p>© {new Date().getFullYear()} Split UPI QR. All rights reserved.</p>
            <p className="text-center sm:text-right">
              Split UPI QR adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google API Services User Data Policy</a>, including Limited Use requirements.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
