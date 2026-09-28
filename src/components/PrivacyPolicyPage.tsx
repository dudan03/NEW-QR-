import React from 'react';
import { SupportedLanguage } from '../types';
import {
  Shield,
  Lock,
  CheckCircle2,
  FileText,
  Mail,
  ArrowLeft,
  QrCode,
  ExternalLink,
  AlertCircle,
  Database,
  UserCheck,
  Trash2,
} from 'lucide-react';

interface PrivacyPolicyPageProps {
  language?: SupportedLanguage;
  activeTab?: 'privacy' | 'terms' | 'data';
  onBack: () => void;
  onOpenAuth?: () => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({
  activeTab = 'privacy',
  onBack,
  onOpenAuth,
}) => {
  const [tab, setTab] = React.useState<'privacy' | 'terms' | 'data'>(activeTab);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-black tracking-tight text-slate-900 dark:text-white leading-none">
                  Split UPI QR
                </h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Legal, Privacy & Compliance</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenAuth && (
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="bg-gradient-to-b from-blue-50/70 to-slate-50 dark:from-blue-950/30 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800 py-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs font-bold">
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span>Official Legal & Privacy Documentation • Split UPI QR</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Privacy Policy & Terms of Service
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            Effective Date: <strong>September 28, 2026</strong> | Domain: <strong>https://www.splitupiqr.in</strong> | Application: <strong>Split UPI QR</strong>
          </p>

          {/* Tab Selector */}
          <div className="pt-4 flex gap-2 border-b border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setTab('privacy')}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold transition border-b-2 cursor-pointer ${
                tab === 'privacy'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              1. Privacy Policy & Google User Data
            </button>
            <button
              type="button"
              onClick={() => setTab('terms')}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold transition border-b-2 cursor-pointer ${
                tab === 'terms'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              2. Terms of Service
            </button>
            <button
              type="button"
              onClick={() => setTab('data')}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold transition border-b-2 cursor-pointer ${
                tab === 'data'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              3. Data Security & Deletion
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 grow space-y-8 leading-relaxed text-slate-700 dark:text-slate-300 text-sm">
        {tab === 'privacy' && (
          <div className="space-y-8 animate-in fade-in duration-150">
            {/* Summary Highlight Box */}
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-base text-emerald-800 dark:text-emerald-300">
                <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Zero Financial Credential Storage Guarantee</span>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed">
                <strong>Split UPI QR NEVER requests, intercepts, or stores:</strong> your UPI PIN, Net Banking Passwords, OTPs, Credit/Debit Card Numbers, CVVs, or Bank Account Logins. All QR codes generated use standard NPCI UPI intent strings where actual payment execution happens securely inside the customer’s chosen UPI app (e.g. Google Pay, PhonePe, Paytm).
              </p>
            </div>

            {/* Section 1: Overview and Application Purpose */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-black">1</span>
                <span>Overview & Application Purpose</span>
              </h3>
              <p>
                <strong>Split UPI QR</strong> (accessible at <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-blue-600 font-mono text-xs">https://www.splitupiqr.in</code>) is a software productivity utility engineered for Indian small business owners, retail merchants, service professionals, and freelancers.
              </p>
              <p>
                The primary purpose of Split UPI QR is to calculate paise-accurate split payment schedules from customer invoices and generate compliant National Payments Corporation of India (NPCI) UPI QR codes for each installment.
              </p>
            </section>

            {/* Section 2: Google User Data Policy & Scopes Requested */}
            <section className="space-y-3 p-5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black">2</span>
                <span>Google User Data Accessed & Scopes</span>
              </h3>
              <p>
                When you choose to sign in to Split UPI QR using Google OAuth 2.0, we request only the minimal standard authentication scopes:
              </p>
              <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm">
                <li><strong><code className="font-mono text-blue-600 dark:text-blue-400">openid</code>:</strong> Verifies your account identity cryptographically.</li>
                <li><strong><code className="font-mono text-blue-600 dark:text-blue-400">email</code>:</strong> Obtains your primary Google email address to establish your merchant account login and deliver critical billing receipts or alert notifications.</li>
                <li><strong><code className="font-mono text-blue-600 dark:text-blue-400">profile</code>:</strong> Obtains your display name and profile picture to personalize your merchant header and receipt footer.</li>
              </ul>
              <div className="mt-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-1">
                  Google API Services User Data Policy Compliance:
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <strong>Split UPI QR's use and transfer of information received from Google APIs to any other app will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline font-semibold inline-flex items-center gap-0.5">Google API Services User Data Policy <ExternalLink className="w-3 h-3 inline" /></a>, including the Limited Use requirements.</strong>
                </p>
              </div>
            </section>

            {/* Section 3: How We Use Information */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-black">3</span>
                <span>How We Use Your Data</span>
              </h3>
              <p>The information we collect is strictly utilized for the following core functionalities:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Authentication & Account Access</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Signing in securely to your merchant profile and ensuring only you can view your customer ledgers.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-blue-500" />
                    <span>Cross-Device Cloud Synchronization</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Syncing your active installment QR payment sessions between your desktop counter, tablet, and mobile device.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-purple-500" />
                    <span>Receipt Generation</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Printing and generating PDF / WhatsApp receipts containing your shop’s business name and contact details.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-amber-500" />
                    <span>Security & Anti-Fraud Protection</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Protecting against automated bot abuse with Firebase App Check, reCAPTCHA Enterprise, and 15-minute auto-logout.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4: Strict No-Sale & Third-Party Disclosure Policy */}
            <section className="space-y-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-black">4</span>
                <span>No-Sale Policy & Third-Party Disclosure</span>
              </h3>
              <p>
                <strong>We NEVER sell, rent, monetize, or trade your personal data, customer contacts, or Google profile data to any third party, advertising network, or data broker.</strong>
              </p>
              <p>
                We do not share your information except in the following limited, essential circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm">
                <li><strong>Payment Processing (Razorpay):</strong> When you upgrade to Split UPI QR Pro, payment metadata is handled by Razorpay (PCI-DSS Level 1 certified gateway).</li>
                <li><strong>Cloud Infrastructure (Google Cloud / Firebase):</strong> Encrypted database storage and authentication hosting.</li>
                <li><strong>Legal Compliance:</strong> If strictly required by law enforcement or regulatory authorities under applicable Indian laws.</li>
              </ul>
            </section>

            {/* Section 5: Data Retention & User Deletion Rights */}
            <section className="space-y-3 p-5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-600 shrink-0" />
                <span>Data Retention, Portability & Deletion Rights</span>
              </h3>
              <p>
                You retain full ownership of all your data. Split UPI QR provides built-in tools for immediate export and deletion:
              </p>
              <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm">
                <li><strong>Full Export:</strong> Export your entire customer directory and payment sessions at any time into CSV or JSON spreadsheets.</li>
                <li><strong>1-Click Account Deletion:</strong> Clicking <em>Settings → Delete Account</em> permanently and immediately erases your user profile, Google UID association, customer records, and payment sessions from both your local browser and cloud storage.</li>
                <li><strong>Email Request:</strong> You can also email us at <a href="mailto:anshumanparida913@gmail.com" className="text-blue-600 font-semibold underline">anshumanparida913@gmail.com</a> to request manual erasure of all logs.</li>
              </ul>
            </section>

            {/* Section 6: Contact Information */}
            <section className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Developer & Grievance Contact</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                For questions regarding this Privacy Policy, Google OAuth compliance, or data protection practices, please contact:
              </p>
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <p><strong>Application:</strong> Split UPI QR</p>
                <p><strong>Developer / Entity:</strong> Split UPI QR Engineering Team</p>
                <p><strong>Official Contact Email:</strong> <a href="mailto:anshumanparida913@gmail.com" className="text-blue-600 underline font-semibold">anshumanparida913@gmail.com</a></p>
                <p><strong>Primary Website URL:</strong> <a href="https://www.splitupiqr.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-semibold">https://www.splitupiqr.in</a></p>
                <p><strong>Location:</strong> Bhubaneswar, Odisha, India</p>
              </div>
            </section>
          </div>
        )}

        {tab === 'terms' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Notice on Non-Banking Software Classification</span>
              </p>
              <p>
                Split UPI QR is a merchant bookkeeping and payment intent generation software tool. Split UPI QR is <strong>NOT a payment aggregator, banking entity, or financial intermediary</strong>. Funds transferred via generated UPI QR codes flow directly from the customer’s bank account to your merchant bank account without intermediate escrow.
              </p>
            </div>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">1. Manual Payment Confirmation Policy</h3>
              <p className="text-xs sm:text-sm">
                Generating a QR code, presenting it to a customer, or a customer scanning a QR code does NOT guarantee funds have been credited. Merchants are strictly responsible for checking their official banking app notifications, SMS alerts, or merchant soundbox before manually recording an installment as confirmed in Split UPI QR.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">2. Merchant Responsibilities</h3>
              <p className="text-xs sm:text-sm">
                By using Split UPI QR, you agree that you are solely responsible for ensuring your registered UPI ID (VPA) is accurate and belongs to you. You are responsible for complying with applicable GST regulations, Indian tax reporting, and honoring your installment agreements with your customers.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">3. Subscription & Pro Tier Terms</h3>
              <p className="text-xs sm:text-sm">
                Split UPI QR offers a Free Plan (4 QR requests/day) and a Pro Plan (₹999 for 6 months). Subscriptions are processed via Razorpay. Pro access is activated immediately upon successful payment verification and linked to your verified Google account.
              </p>
            </section>
          </div>
        )}

        {tab === 'data' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <section className="space-y-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Security Architecture & Protections</h3>
              <p className="text-xs sm:text-sm">
                We implement comprehensive, multi-layer security measures to keep merchant data secure:
              </p>
              <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm">
                <li><strong>Encryption in Transit:</strong> All web traffic is forced over HTTPS using TLS 1.3 with Cloudflare SSL/TLS termination.</li>
                <li><strong>Firebase App Check:</strong> Protected against automated credential stuffing and bot traffic using reCAPTCHA Enterprise.</li>
                <li><strong>Inactivity Timeout:</strong> Automatic 15-minute idle session auto-lock prevents unauthorized access on unattended shop counters.</li>
                <li><strong>Local-First Database:</strong> All critical operations are saved to client storage first, enabling seamless offline capabilities.</li>
              </ul>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-200">Split UPI QR</p>
            <p className="text-[11px]">Split. Scan. Pay. Track. • Hosted at https://www.splitupiqr.in</p>
          </div>
          <div className="flex gap-4 font-semibold">
            <button type="button" onClick={() => setTab('privacy')} className="hover:text-blue-600">Privacy Policy</button>
            <button type="button" onClick={() => setTab('terms')} className="hover:text-blue-600">Terms of Service</button>
            <button type="button" onClick={() => setTab('data')} className="hover:text-blue-600">Data Security</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
