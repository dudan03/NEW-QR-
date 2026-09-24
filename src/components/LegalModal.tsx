import React, { useState } from 'react';
import { X, Shield, Lock, FileText, CheckCircle } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  initialTab?: 'privacy' | 'terms' | 'data';
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  initialTab = 'privacy',
  onClose,
}) => {
  const [tab, setTab] = useState<'privacy' | 'terms' | 'data'>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Legal, Privacy & Data Policies
              </h2>
              <p className="text-[11px] text-slate-500">QR SplitPay India • v2.0 Compliance</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 px-6 pt-2 gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab('privacy')}
            className={`pb-2.5 transition border-b-2 ${
              tab === 'privacy'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Privacy Policy
          </button>
          <button
            type="button"
            onClick={() => setTab('terms')}
            className={`pb-2.5 transition border-b-2 ${
              tab === 'terms'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Terms of Service
          </button>
          <button
            type="button"
            onClick={() => setTab('data')}
            className={`pb-2.5 transition border-b-2 ${
              tab === 'data'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Data & Security Policy
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {tab === 'privacy' && (
            <>
              <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  What We NEVER Collect or Store:
                </p>
                <p>
                  QR SplitPay India NEVER requests, stores, or processes:
                  <strong> UPI PINs, Net Banking Passwords, OTPs, ATM/Debit Card PINs, or Bank Account Credentials.</strong>
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">1. Information We Collect</h4>
                <p>
                  When you use QR SplitPay India, we store only the data essential to generating UPI installment payment requests and managing your merchant bookkeeping:
                </p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li><strong>Account Profile:</strong> Name, Google Account ID, and Email address used for authentication.</li>
                  <li><strong>Business Information:</strong> Shop/Business name, address, contact number, and your public merchant UPI ID (VPA).</li>
                  <li><strong>Customer Records:</strong> Customer names, phone numbers, and notes you deliberately input into the CRM.</li>
                  <li><strong>Payment Sessions:</strong> Transaction amounts, installment breakdowns, invoice references, and manual verification notes.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">2. Purpose of Data Processing</h4>
                <p>
                  Data is processed exclusively to:
                </p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Generate standard NPCI-compliant UPI deep links and QR codes.</li>
                  <li>Synchronize records between your authorized mobile, tablet, and desktop devices.</li>
                  <li>Produce downloadable, printable merchant-generated payment records and receipts.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">3. Google Account Integration</h4>
                <p>
                  Google authentication is used exclusively for single-sign-on (SSO) identity verification. We do NOT access your private Google Drive files or Gmail messages without explicit consent. Your data is stored on QR SplitPay's secure cloud database keyed to your verified account ID.
                </p>
              </div>
            </>
          )}

          {tab === 'terms' && (
            <>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">1. Core Non-Provider Principle</h4>
                <p>
                  QR SplitPay India is a <strong>software management utility</strong> for generating UPI payment intent links and tracking installment schedules.
                  It is <strong>NOT a payment aggregator, banking institution, or payment gateway</strong>.
                </p>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 p-3.5 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
                <p className="font-bold mb-1">Important Product Rule (Manual Verification Mode):</p>
                <p>
                  The generation of a QR code, scanning by a customer, or opening of a UPI application DOES NOT constitute proof of payment.
                  Merchants must independently inspect their bank balance or merchant soundbox/SMS alert before marking any installment as received.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">2. User Responsibility & Tax Compliance</h4>
                <p>
                  Users remain solely responsible for:
                </p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Ensuring their registered UPI ID belongs to their business or authorized bank account.</li>
                  <li>Complying with applicable Indian taxation laws, GST reporting, and merchant banking rules.</li>
                  <li>Validating customer identity and honoring commercial agreements for split installments.</li>
                </ul>
              </div>
            </>
          )}

          {tab === 'data' && (
            <>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">1. Multi-Device Synchronization & Conflict Handling</h4>
                <p>
                  QR SplitPay uses timestamped, record-level synchronization. When modifying customer or installment data on multiple devices, updates are merged safely at the entity level so changes on one device do not overwrite unrelated records on another.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">2. Offline Queue</h4>
                <p>
                  When your device is temporarily disconnected from the internet, QR SplitPay allows you to view history, create new installment plans, generate QR codes, and record manual confirmations. Changes are queued locally and automatically pushed to the cloud once network connectivity is restored.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">3. Complete Data Portability & Deletion</h4>
                <p>
                  You own your data. At any time you can:
                </p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>Export your entire record history in universal JSON and spreadsheet-compatible CSV formats.</li>
                  <li>Delete your account and all associated cloud data via <em>Settings → Delete Account</em> with immediate effect.</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
