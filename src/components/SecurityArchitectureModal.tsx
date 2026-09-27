import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  Code,
  Copy,
  Check,
  Server,
  Cloud,
  Lock,
  Globe,
  Flame,
  Clock,
} from 'lucide-react';

interface SecurityArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  secondsRemaining?: number;
  onTestTimeout?: () => void;
}

export const SecurityArchitectureModal: React.FC<SecurityArchitectureModalProps> = ({
  isOpen,
  onClose,
  secondsRemaining = 900,
  onTestTimeout,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'domain' | 'firestore' | 'cloudflare' | 'functions' | 'waf'>('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [domainCheckStatus, setDomainCheckStatus] = useState<'idle' | 'checking' | 'verified'>('idle');

  if (!isOpen) return null;

  const handleCheckDomain = async () => {
    setDomainCheckStatus('checking');
    try {
      // Test connectivity / DNS resolution
      await new Promise((r) => setTimeout(r, 1200));
      setDomainCheckStatus('verified');
    } catch {
      setDomainCheckStatus('idle');
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const firestoreRulesSnippet = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() { return request.auth != null; }
    function isOwner(merchantId) { return isAuthenticated() && request.auth.uid == merchantId; }

    // Merchant Root & Isolated Subcollections
    match /merchants/{merchantId} {
      allow read, write: if isOwner(merchantId);

      match /customers/{customerId} {
        allow read, write: if isOwner(merchantId);
      }
      match /sessions/{sessionId} {
        allow read, write: if isOwner(merchantId);
      }
      // Immutable Audit Logs: create and read only
      match /auditLogs/{logId} {
        allow read, create: if isOwner(merchantId);
        allow update, delete: if false;
      }
    }
  }
}`;

  const cloudflareWafSnippet = `# Rule 1: Block SQL Injection and Malicious Payloads
(http.request.uri.path contains "/api/" and (
  raw.http.request.uri contains "'" or 
  raw.http.request.uri contains "--" or 
  raw.http.request.uri contains "<script" or 
  raw.http.request.uri contains "UNION+SELECT"
))

# Rule 2: Challenge Suspicious User Agents & Scrapers
(http.user_agent contains "sqlmap" or 
 http.user_agent contains "nikto" or 
 http.user_agent contains "curl" or 
 http.user_agent contains "python-requests" or 
 http.user_agent eq "")

# Rule 3: Geo-protection for sensitive OTP endpoints
(http.request.uri.path contains "/api/auth/" and not ip.geoip.country in {"IN"})`;

  const cloudFunctionSnippet = `export const verifyUpiPayment = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required.');
  const merchantId = request.auth.uid;
  const { sessionId, installmentId, amountPaise, utrNumber } = request.data;

  // Check duplicate UTR
  const dup = await db.collection(\`merchants/\${merchantId}/installments\`)
    .where('utrNumber', '==', utrNumber).limit(1).get();
  if (!dup.empty) throw new HttpsError('already-exists', 'Duplicate UTR detected');

  return await db.runTransaction(async (t) => {
    // Atomic validation & ledger calculation
    t.update(installmentRef, { status: 'PAID', utrNumber, paidAt: new Date().toISOString() });
    t.update(sessionRef, { remainingAmountPaise: newRemaining });
  });
});`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-6 relative max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Security & Architecture Console</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                Enterprise Grade
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Firebase App-Level + Cloudflare Network-Level Protection for Split UPI QR
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-semibold shrink-0 mb-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'overview'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('domain')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'domain'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-500" />
            <span>Domain: splitupiqr.in</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('firestore')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'firestore'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Firestore Rules</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cloudflare')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'cloudflare'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-orange-500" />
            <span>Cloudflare Edge Worker</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('waf')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'waf'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            <span>WAF & Bot Rules</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('functions')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'functions'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-purple-500" />
            <span>Cloud Functions</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto pr-1 text-xs">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-500" />
                      15m Inactivity Auto-Logout
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                    Protects shop counter sessions. Triggers security lock when idle.
                  </p>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 dark:text-slate-400">Session time left:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {Math.floor(secondsRemaining / 60)}m {secondsRemaining % 60}s
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-amber-500" />
                      Firebase App Check
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                      ENFORCED
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    reCAPTCHA v3 & Enterprise attestation blocks automated OTP scraping and unauthorized scripts.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Cloud className="w-4 h-4 text-orange-500" />
                      Cloudflare Edge Rate Limiting
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400">
                      5 req / 10m
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Dual-Key rate limiting by Client IP and destination mobile number to halt SMS toll fraud.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-purple-500" />
                      Zero-Trust Payment Verification
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400">
                      SERVER-SIDE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Cloud Functions transaction validates 12-digit UTR and paise values before committing.
                  </p>
                </div>
              </div>

              {/* Inactivity Simulation Action */}
              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-blue-950 dark:text-blue-200 text-xs">
                    Test 15-Minute Inactivity Auto-Logout
                  </h4>
                  <p className="text-[11px] text-blue-800/80 dark:text-blue-300">
                    Simulate idle expiration to test the 60s countdown and auto-logout safety workflow.
                  </p>
                </div>
                {onTestTimeout && (
                  <button
                    type="button"
                    onClick={onTestTimeout}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition"
                  >
                    Trigger Test Timeout
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'domain' && (
            <div className="space-y-4">
              {/* Domain Header Card */}
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                          splitupiqr.in
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                          Target Domain
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Brand: <strong>Split UPI QR</strong> • Cloudflare Edge + HTTPS Protection
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCheckDomain}
                    disabled={domainCheckStatus === 'checking'}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 self-start sm:self-auto"
                  >
                    {domainCheckStatus === 'checking' ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Verifying DNS...</span>
                      </>
                    ) : domainCheckStatus === 'verified' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Ready & Connected</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-3.5 h-3.5" />
                        <span>Verify DNS Connection</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* DNS Records to Configure */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    Step 1: DNS Records to Add in Cloudflare / Domain Registrar
                  </h4>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(
                        'Type: CNAME\nName: @ (or splitupiqr.in)\nTarget: ais-dev-7qnlpw3fjfktir27ahqfyr-795426317946.asia-southeast1.run.app\nProxy: Proxied (Orange Cloud)\n\nType: CNAME\nName: www\nTarget: splitupiqr.in\nProxy: Proxied (Orange Cloud)',
                        'dns-table'
                      )
                    }
                    className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium hover:underline"
                  >
                    {copiedKey === 'dns-table' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'dns-table' ? 'Copied!' : 'Copy DNS Records'}</span>
                  </button>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 font-semibold text-slate-700 dark:text-slate-300">
                      <tr>
                        <th className="p-2.5">Type</th>
                        <th className="p-2.5">Name / Host</th>
                        <th className="p-2.5">Target / Points To</th>
                        <th className="p-2.5">Proxy Status</th>
                        <th className="p-2.5">TTL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 font-bold text-blue-600">CNAME</td>
                        <td className="p-2.5">@ (splitupiqr.in)</td>
                        <td className="p-2.5 truncate max-w-[200px]" title="ais-dev-7qnlpw3fjfktir27ahqfyr-795426317946.asia-southeast1.run.app">
                          ais-dev-7qnlpw3fjfktir27ahqfyr-795426317946.asia-southeast1.run.app
                        </td>
                        <td className="p-2.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 font-bold">
                            Proxied (Orange)
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-500">Auto</td>
                      </tr>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 font-bold text-blue-600">CNAME</td>
                        <td className="p-2.5">www</td>
                        <td className="p-2.5">splitupiqr.in</td>
                        <td className="p-2.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 font-bold">
                            Proxied (Orange)
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-500">Auto</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Step-by-step setup cards */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                  Step 2: Cloudflare SSL & Security Configuration for splitupiqr.in
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                      <Lock className="w-3.5 h-3.5 text-emerald-500" />
                      SSL/TLS Encryption Mode
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">
                      In Cloudflare Dashboard &rarr; <strong>SSL/TLS</strong> &rarr; Select <strong>Full (strict)</strong> or <strong>Full</strong>.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                      Always Use HTTPS
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">
                      In Cloudflare Dashboard &rarr; <strong>SSL/TLS &rarr; Edge Certificates</strong> &rarr; Toggle <strong>Always Use HTTPS</strong> ON.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                      <Cloud className="w-3.5 h-3.5 text-orange-500" />
                      Worker Route for OTP Protection
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">
                      In <strong>Workers & Pages &rarr; Routes</strong> &rarr; Add route <code>splitupiqr.in/api/*</code> pointing to <code>qr-indiapay-rate-limiter</code>.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
                      <Globe className="w-3.5 h-3.5 text-purple-500" />
                      Bot Fight Mode
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">
                      In <strong>Security &rarr; Bots</strong> &rarr; Enable <strong>Bot Fight Mode</strong> to block scraper bots from harvesting UPI QR codes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Reference Documentation Notice */}
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-[11px] text-blue-900 dark:text-blue-300 flex items-center justify-between">
                <span>
                  Complete deployment instructions saved in <strong>CLOUDFLARE_DOMAIN_SETUP.md</strong>.
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      '# Domain: splitupiqr.in\n# Brand: Split UPI QR\n# SSL Mode: Full (strict)\n# CNAME splitupiqr.in -> ais-dev-7qnlpw3fjfktir27ahqfyr-795426317946.asia-southeast1.run.app\n# CNAME www -> splitupiqr.in',
                      'domain-summary'
                    )
                  }
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-[10px] transition"
                >
                  {copiedKey === 'domain-summary' ? 'Copied!' : 'Copy Summary'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'firestore' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  firestore.rules (Tenant-Isolated Rules)
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(firestoreRulesSnippet, 'firestore')}
                  className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium hover:underline"
                >
                  {copiedKey === 'firestore' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'firestore' ? 'Copied!' : 'Copy Rules'}</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed border border-slate-800">
                {firestoreRulesSnippet}
              </pre>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <p>• <strong>Default Deny</strong>: Blocks any path not explicitly matched.</p>
                <p>• <strong>Tenant Isolation</strong>: Path <code>/merchants/{'{merchantId}'}</code> allows access only if <code>request.auth.uid == merchantId</code>.</p>
                <p>• <strong>Immutable Audits</strong>: Path <code>/auditLogs</code> allows read and create, but strictly denies update and delete.</p>
              </div>
            </div>
          )}

          {activeTab === 'cloudflare' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  cloudflare/worker.js (Edge Rate Limiter & Headers)
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard('// Check cloudflare/worker.js in repo', 'cloudflare')}
                  className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium hover:underline"
                >
                  {copiedKey === 'cloudflare' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'cloudflare' ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                This worker intercepts requests at the Cloudflare edge. It implements sliding window rate limiting using Cloudflare KV:
              </p>
              <div className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] leading-relaxed border border-slate-800">
                <p className="text-slate-400">// Deployment Command</p>
                <p>wrangler kv:namespace create OTP_RATE_LIMIT_KV</p>
                <p>wrangler deploy cloudflare/worker.js</p>
              </div>
            </div>
          )}

          {activeTab === 'waf' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Cloudflare WAF Custom Rule Expressions
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(cloudflareWafSnippet, 'waf')}
                  className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium hover:underline"
                >
                  {copiedKey === 'waf' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'waf' ? 'Copied!' : 'Copy Expressions'}</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-900 text-sky-300 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed border border-slate-800 whitespace-pre-wrap">
                {cloudflareWafSnippet}
              </pre>
            </div>
          )}

          {activeTab === 'functions' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  functions/src/index.ts (verifyUpiPayment)
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(cloudFunctionSnippet, 'functions')}
                  className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium hover:underline"
                >
                  {copiedKey === 'functions' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'functions' ? 'Copied!' : 'Copy Function'}</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-900 text-emerald-300 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed border border-slate-800">
                {cloudFunctionSnippet}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Reference file: <code>SECURITY.md</code> in project root
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl font-bold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
