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
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface LandingPageProps {
  language: SupportedLanguage;
  onStartApp: () => void;
  onOpenAuth: () => void;
  onOpenLegal: (tab: 'privacy' | 'terms' | 'data') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  language,
  onStartApp,
  onOpenAuth,
  onOpenLegal,
}) => {
  const t = translations[language];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
                QR SplitPay India
              </h1>
              <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                {t.tagline}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <PWAInstallButton variant="outline" />
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={onStartApp}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-95 transition"
            >
              Launch Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 px-4 sm:px-6 bg-radial-[at_top_center] from-blue-100/70 via-slate-50 to-slate-50 dark:from-blue-950/40 dark:via-slate-950 dark:to-slate-950">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-700 dark:text-blue-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Built for Indian Merchants, Freelancers & Small Businesses</span>
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-950 dark:text-white leading-tight">
            Split Large UPI Payments into{' '}
            <span className="bg-linear-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
              Organized Installments
            </span>
          </h2>

          <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Generate separate NPCI standard UPI QR codes for each agreed installment amount.
            Track payments manually, maintain customer records, and securely sync your data across mobile, tablet, and desktop.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onStartApp}
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-blue-500/20 transition flex items-center justify-center gap-2"
            >
              <span>Start Free (No Credit Card)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onOpenAuth}
              className="w-full sm:w-auto px-6 py-3.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2.5 shadow-2xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Value Badges */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Works with Any UPI App
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              100% Offline Capable PWA
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-blue-500" />
              No Banking Secrets Stored
            </span>
          </div>
        </div>
      </section>

      {/* Visual Product Mockup Preview */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto rounded-3xl bg-linear-to-b from-slate-900 to-slate-800 p-3 sm:p-6 shadow-2xl border border-slate-700/60">
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-inner space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="text-xs font-mono text-slate-400 ml-2">QR SplitPay Live Dashboard</span>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                Cloud Synced
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-[10px] font-semibold text-slate-400">Agreed Total</span>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white">₹10,000</p>
                <p className="text-[10px] text-blue-600 font-semibold">4 Installments of ₹2,500</p>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">Confirmed Paid</span>
                <p className="text-xl font-extrabold text-emerald-600">₹5,000</p>
                <p className="text-[10px] text-emerald-700 font-semibold">2 of 4 Installments verified</p>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40">
                <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">Pending Due</span>
                <p className="text-xl font-extrabold text-amber-600">₹5,000</p>
                <p className="text-[10px] text-amber-700 font-semibold">2 Installments remaining</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works (6 Clear Steps) */}
      <section className="py-16 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="text-center space-y-2 mb-12">
          <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600">Workflow</span>
          <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            How QR SplitPay Works
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            A practical tool for merchants handling agreed split payments without a payment gateway.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <span className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-black text-sm flex items-center justify-center">
              1
            </span>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">Enter Amount & UPI ID</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Input your merchant VPA (e.g. shop@bank) and select an existing customer or create a new profile.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <span className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-black text-sm flex items-center justify-center">
              2
            </span>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">Choose Split Method</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Split into equal parts (e.g. 4 parts), set a max cap per QR, or customize exact rupee amounts with paise precision.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <span className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-black text-sm flex items-center justify-center">
              3
            </span>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">Generate UPI QR Codes</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              The app creates unique, NPCI-standard QR codes for each exact installment amount ready for customer scanning.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <span className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-black text-sm flex items-center justify-center">
              4
            </span>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">Customer Scans & Pays</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Customer scans the QR code using Google Pay, PhonePe, Paytm, BHIM, or any UPI banking app.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <span className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-black text-sm flex items-center justify-center">
              5
            </span>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">Merchant Manually Confirms</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Verify incoming bank credit alert independently. Tap "Confirm Received" to lock the installment into confirmed revenue.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <span className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-black text-sm flex items-center justify-center">
              6
            </span>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">Print Branded Receipt</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Generate a merchant-signed payment record with business details and remaining balance for the customer.
            </p>
          </div>
        </div>
      </section>

      {/* Cloud Sync & Cross-Device Section */}
      <section className="py-16 px-4 sm:px-6 bg-blue-600 text-white">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold">
              <Cloud className="w-3.5 h-3.5" />
              <span>Multi-Device Cloud Backup</span>
            </div>
            <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Sign In Once. Access Everywhere.
            </h3>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              Whether you are at your shop on mobile, reviewing records at home on tablet, or managing bookkeeping on your desktop computer, your payment agreements, installments, and customer profiles stay synchronized.
            </p>
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-6 py-3 bg-white text-blue-600 font-extrabold text-xs rounded-xl shadow-md hover:bg-blue-50 active:scale-95 transition"
              >
                Sign In with Google
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 text-center w-36">
              <Smartphone className="w-8 h-8 mx-auto mb-2" />
              <p className="text-xs font-bold">Mobile PWA</p>
              <p className="text-[10px] text-blue-200 mt-1">For counter QR scans</p>
            </div>
            <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 text-center w-36">
              <Laptop className="w-8 h-8 mx-auto mb-2" />
              <p className="text-xs font-bold">Desktop Web</p>
              <p className="text-[10px] text-blue-200 mt-1">For reports & exports</p>
            </div>
          </div>
        </div>
      </section>

      {/* Honest Principles & Security */}
      <section className="py-16 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="p-6 rounded-3xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Clear Product Principles (Manual Verification Mode)
              </h4>
              <p className="text-xs text-slate-500">Separating QR generation from payment confirmation</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>
              <strong>1. No False Success Claims:</strong> Generating a QR code or launching a UPI payment does not prove money was received. In QR SplitPay, a payment is only marked confirmed when the merchant manually records it after checking their bank account or UPI soundbox.
            </p>
            <p>
              <strong>2. No Banking Secrets:</strong> QR SplitPay never asks for, never stores, and never transmits your UPI PIN, banking passwords, OTPs, or debit card PINs.
            </p>
            <p>
              <strong>3. Independent Record Keeping:</strong> The application does not hold, intermediate, or process money. Payments flow directly from the customer's bank account to your merchant UPI ID.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing / Future Subscription Plans */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600">Pricing</span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Transparent Plans for Every Business Size
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free Plan */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Free Starter</h4>
              <p className="text-xs text-slate-500">For individuals & sole traders</p>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white">
              ₹0 <span className="text-xs text-slate-400 font-normal">/ forever</span>
            </p>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Unlimited UPI QR splits
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Up to 25 active customers
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Manual payment confirmation
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Local & cloud backup
              </li>
            </ul>
            <button
              type="button"
              onClick={onStartApp}
              className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-white text-xs font-bold transition"
            >
              Current Plan
            </button>
          </div>

          {/* Pro Plan */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-blue-600 shadow-xl space-y-4 relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-wide">
              Most Popular
            </span>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Merchant Pro</h4>
              <p className="text-xs text-slate-500">For retail shops & active providers</p>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white">
              ₹499 <span className="text-xs text-slate-400 font-normal">/ month</span>
            </p>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Unlimited customers & sessions
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Custom branded receipts
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Multi-device real-time sync
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Full CSV spreadsheet export
              </li>
            </ul>
            <button
              type="button"
              onClick={onOpenAuth}
              className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
            >
              Start 14-Day Free Trial
            </button>
          </div>

          {/* Business Plan */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Enterprise Business</h4>
              <p className="text-xs text-slate-500">For multi-counter chains & teams</p>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white">
              ₹1,299 <span className="text-xs text-slate-400 font-normal">/ month</span>
            </p>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Multi-counter staff accounts
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Priority WhatsApp & email support
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Automated daily cloud backups
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Advanced audit analytics
              </li>
            </ul>
            <button
              type="button"
              onClick={onOpenAuth}
              className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-white text-xs font-bold transition"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-10 px-4 sm:px-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-200">
              QR SplitPay India • v2.0
            </p>
            <p className="text-[11px] mt-0.5">
              Split. Scan. Pay. Track. Designed for Indian merchant installment management.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => onOpenLegal('privacy')}
              className="hover:text-blue-600 transition"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => onOpenLegal('terms')}
              className="hover:text-blue-600 transition"
            >
              Terms of Service
            </button>
            <button
              type="button"
              onClick={() => onOpenLegal('data')}
              className="hover:text-blue-600 transition"
            >
              Data Policy
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
