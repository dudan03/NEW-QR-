import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Installment, PaymentSession, SupportedLanguage } from '../types';
import { formatPaise } from '../utils/currency';
import { translations } from '../locales';
import {
  Share2,
  Download,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface QRCodeViewerProps {
  session: PaymentSession;
  installment: Installment;
  totalInstallments: number;
  language: SupportedLanguage;
  onMarkReceived: (installment: Installment) => void;
  onClose?: () => void;
  onSelectInstallment?: (index: number) => void;
}

export const QRCodeViewer: React.FC<QRCodeViewerProps> = ({
  session,
  installment,
  totalInstallments,
  language,
  onMarkReceived,
  onClose,
  onSelectInstallment,
}) => {
  const t = translations[language];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedUri, setCopiedUri] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (canvasRef.current && installment.paymentUri) {
      QRCode.toCanvas(
        canvasRef.current,
        installment.paymentUri,
        {
          width: 256,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        },
        (error) => {
          if (error) console.error('QR code generation error', error);
          if (canvasRef.current) {
            setQrDataUrl(canvasRef.current.toDataURL('image/png'));
          }
        }
      );
    }
  }, [installment.paymentUri, installment.id]);

  const handleCopyUpi = async () => {
    try {
      await navigator.clipboard.writeText(session.upiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyUri = async () => {
    try {
      await navigator.clipboard.writeText(installment.paymentUri);
      setCopiedUri(true);
      setTimeout(() => setCopiedUri(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `UPI-QR-${session.id}-Part${installment.sequence}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShareQr = async () => {
    const textMsg = `UPI Payment Request: ${formatPaise(installment.amountPaise)} (Installment ${installment.sequence}/${totalInstallments})\nPayee: ${session.payeeName || 'Merchant'}\nUPI ID: ${session.upiId}\nLink: ${installment.paymentUri}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `UPI Payment - ${formatPaise(installment.amountPaise)}`,
          text: textMsg,
        });
      } catch {
        // User cancelled or unsupported
      }
    } else {
      handleCopyUri();
    }
  };

  const handleOpenUpiApp = () => {
    window.location.href = installment.paymentUri;
  };

  const isConfirmed =
    installment.status === 'MANUALLY_CONFIRMED' || installment.status === 'SUCCESS';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-5 max-w-md mx-auto">
      {/* Sequence Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Payment {installment.sequence} of {totalInstallments}
          </span>
          {session.isDemo && (
            <span className="ml-2 text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
              DEMO DATA
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {isConfirmed ? (
            <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t.states[installment.status]}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
              <Clock className="w-3.5 h-3.5" />
              {t.states[installment.status]}
            </span>
          )}
        </div>
      </div>

      {/* Amount Display */}
      <div className="text-center py-4">
        <div className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
          {formatPaise(installment.amountPaise)}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center gap-1">
          <span>{session.customerName || 'Customer'}</span>
          {session.invoiceId && (
            <>
              <span>·</span>
              <span>{session.invoiceId}</span>
            </>
          )}
        </div>
      </div>

      {/* QR Code Container */}
      <div className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 my-2">
        <div className="bg-white p-3 rounded-lg shadow-xs">
          <canvas ref={canvasRef} className="max-w-[200px] max-h-[200px] w-full h-auto block" />
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 text-center">
          Scan with any UPI app (GPay, PhonePe, Paytm, BHIM, Bank UPI)
        </p>
      </div>

      {/* Payee UPI ID row with copy */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 px-3 py-2 rounded-lg text-xs mt-3">
        <div className="truncate mr-2">
          <span className="text-slate-400 block text-[10px]">UPI ID</span>
          <span className="font-mono font-medium text-slate-800 dark:text-slate-200 truncate block">
            {session.upiId}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopyUpi}
          className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 transition-colors shrink-0"
          title="Copy UPI ID"
        >
          {copiedUpi ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      {/* Manual Verification Non-Provider Notice */}
      <div className="my-3 px-3 py-2 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-lg text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
        <div>
          <span className="font-semibold block">Manual Verification Mode</span>
          <span>Status is not automatically verified by banks. Verify independently before recording.</span>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="space-y-2 mt-4">
        {!isConfirmed ? (
          <button
            type="button"
            onClick={() => onMarkReceived(installment)}
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            {t.actions.markAsReceived}
          </button>
        ) : (
          <div className="w-full h-11 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold text-sm rounded-xl flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {t.states.MANUALLY_CONFIRMED}
          </div>
        )}

        {/* Secondary Action Bar */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={handleShareQr}
            className="h-10 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            {t.actions.shareQr}
          </button>

          <button
            type="button"
            onClick={handleDownloadQr}
            className="h-10 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            {t.actions.saveQr}
          </button>

          <button
            type="button"
            onClick={handleOpenUpiApp}
            className="h-10 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            title="Open in UPI App on this device"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {t.actions.openUpiApp}
          </button>
        </div>
      </div>

      {/* Installment Switcher Carousel / Pagination */}
      {totalInstallments > 1 && onSelectInstallment && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5 flex-wrap">
          {session.installments.map((inst, idx) => {
            const isCurrent = inst.id === installment.id;
            const instConfirmed =
              inst.status === 'MANUALLY_CONFIRMED' || inst.status === 'SUCCESS';
            return (
              <button
                key={inst.id}
                type="button"
                onClick={() => onSelectInstallment(idx)}
                className={`min-w-[32px] h-7 px-2 rounded-lg text-xs font-medium transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : instConfirmed
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                #{inst.sequence}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
